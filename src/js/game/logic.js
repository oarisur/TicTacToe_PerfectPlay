// src/js/game/logic.js

import { GameBoard } from './board.js';
import { AILogic } from '../ai/minimax.js'; // AILogic now uses an 'init' function
import { StatsManager, LocalStore, STATE_KEY } from '../storage/stats.js'; 
import { SoundController } from '../ui/sound.js'; 
// NOTE: DisplayController import is omitted to resolve the circular dependency.

// --- Private Game State ---
let currentPlayer = "X";
let isGameActive = true;
let currentDifficulty = 'medium'; 
let currentMode = 'pvai'; 

// CRITICAL FIX: The winning conditions array needs to be defined here and used internally.
const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]           // Diagonals
];

// NEW: Object to hold functions injected from DisplayController via main.js
let displayCallbacks = {}; 

/** * Manages the game flow, turn control, win/draw checks, and AI integration. 
 * This module coordinates state changes across all components.
 */
export const GameController = (() => {
    
    // DOM references for persistent settings access.
    // NOTE: These must still be defined within the module pattern for encapsulation.
    const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');
    const modeRadios = document.querySelectorAll('input[name="game-mode"]');

    /** * Returns the current settings selected in the UI. */
    const getCurrentSettings = () => ({
        mode: Array.from(modeRadios).find(r => r.checked)?.value || currentMode,
        difficulty: Array.from(difficultyRadios).find(r => r.checked)?.value || currentDifficulty,
        currentPlayer: currentPlayer
    });
    
    /** * Returns the necessary display functions (Injected via Dependency Injection in main.js). */
    const setDisplayCallbacks = (callbacks) => {
        displayCallbacks = callbacks;
    };
    
    /** * Persists the current board and game settings to local storage. */
    const saveGameState = () => {
        if (isGameActive) {
            StatsManager.saveGameState(GameBoard.getBoard(), currentPlayer, currentMode, currentDifficulty);
        }
    };
    
    /** * Executes the AI's calculated move index using AILogic. */
    const performAIMove = () => {
        const board = GameBoard.getBoard();
        // The AI logic module handles the difficulty setting internally.
        const moveIndex = AILogic.getBestMove(board, currentDifficulty);

        if (moveIndex !== -1) {
            // Treat the AI's move index like a player click.
            handlePlayerMove(moveIndex);
        }
    };
    
    /** * Switches the active player and triggers the AI turn if the mode is PvAI and the new player is 'O'. */
    const switchPlayer = () => {
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        
        displayCallbacks.updateMessage(`Player ${currentPlayer}'s turn`, currentPlayer);
        displayCallbacks.updatePlayerIndicator(currentPlayer, currentMode); 
        saveGameState(); 
        
        if (currentMode === 'pvai' && currentPlayer === 'O' && isGameActive) {
            displayCallbacks.toggleBoardInteraction(false); // Block human input
            SoundController.playAISound(); 
            setTimeout(performAIMove, 700); 
        } else if (currentMode === 'pvai' && currentPlayer === 'X' && isGameActive) {
            // Re-enable interaction for Human player
            displayCallbacks.toggleBoardInteraction(true); 
        }
    };
    
    /** * Checks the board for a win or a draw, updates the UI, and records the result. */
    const checkResult = () => {
        const currentBoard = GameBoard.getBoard();
        
        // 1. Check for a Win (using the locally defined array)
        for (const condition of winningConditions) {
            const [a, b, c] = condition;
            if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
                isGameActive = false;
                const winner = currentBoard[a]; 
                
                StatsManager.recordGameResult(winner, currentMode, currentDifficulty); 
                displayCallbacks.showResult(`Player ${winner} WINS!`, winner, condition);
                displayCallbacks.toggleBoardInteraction(false); 
                StatsManager.deleteGameState(); 
                
                if (currentMode === 'pvai' && winner === 'O') {
                    SoundController.playLossSound();
                } else {
                    SoundController.playWinSound();
                }
                
                return true;
            }
        }

        // 2. Check for a Draw (No empty cells remaining)
        if (!currentBoard.includes("")) {
            isGameActive = false;
            
            StatsManager.recordGameResult(null, currentMode, currentDifficulty); 
            displayCallbacks.showResult("It's a DRAW!", null, null);
            displayCallbacks.toggleBoardInteraction(false); 
            StatsManager.deleteGameState(); 
            SoundController.playDrawSound();
            return true;
        }
        
        return false;
    };
    
    /** * Handles a player's move (human click or AI index). */
    const handlePlayerMove = (index) => {
        if (!isGameActive) return;
        
        if (GameBoard.markCell(index, currentPlayer)) {
            displayCallbacks.render(GameBoard.getBoard());
            SoundController.playMoveSound();
            
            if (!checkResult()) {
                switchPlayer();
            }
        }
    };

    /** * Initializes a new game, resetting the board and applying current settings. */
    const startGame = (loadMode = false) => {
        const settings = getCurrentSettings();

        if (!loadMode) {
            StatsManager.deleteGameState(); 
            GameBoard.reset();
        } 
        
        currentDifficulty = settings.difficulty;
        currentMode = settings.mode;
        currentPlayer = "X"; 
        isGameActive = true;

        // Update View and Stats (using injected functions)
        displayCallbacks.resetUI();
        displayCallbacks.render(GameBoard.getBoard()); 
        displayCallbacks.updateMessage(`Player ${currentPlayer}'s turn`, currentPlayer);
        displayCallbacks.updatePlayerIndicator(currentPlayer, currentMode); 
        displayCallbacks.setModeState(currentMode, currentDifficulty);
        StatsManager.updateStatsUI(currentMode, currentDifficulty); 
        displayCallbacks.toggleBoardInteraction(true); 
        
        // Immediately trigger AI move if PvAI and AI is set to start
        if (currentMode === 'pvai' && currentPlayer === 'O') {
            displayCallbacks.toggleBoardInteraction(false);
            SoundController.playAISound(); 
            setTimeout(performAIMove, 700);
        }
    };

    /** * Loads saved stats and checks for an unfinished game prompt. */
    const loadGameState = () => {
        StatsManager.loadStats();
        
        // FIX: Initialize the AILogic module with the core game rules.
        // This resolves the "getWinningConditions is not defined" ReferenceError.
        AILogic.init(winningConditions); 

        const loadedState = LocalStore.load(STATE_KEY, null); 
        
        if (loadedState && loadedState.board && loadedState.board.some(cell => cell !== "")) {
            displayCallbacks.showResumePrompt(loadedState);
        } else {
            startGame(); 
        }
    };
    
    /** * Resumes the game using the loaded state data from local storage. */
    const resumeGame = (data) => {
        GameBoard.setBoard(data.board);
        currentPlayer = data.currentPlayer;
        currentMode = data.mode;
        currentDifficulty = data.difficulty;
        isGameActive = true;
        
        displayCallbacks.resetUI();
        displayCallbacks.render(GameBoard.getBoard());
        displayCallbacks.updateMessage(`Player ${currentPlayer}'s turn`, currentPlayer);
        displayCallbacks.updatePlayerIndicator(currentPlayer, currentMode); 
        displayCallbacks.setModeState(currentMode, currentDifficulty);
        StatsManager.updateStatsUI(currentMode, currentDifficulty); 
        displayCallbacks.toggleBoardInteraction(true); 

        // Execute AI turn if game was saved mid-AI-turn
        if (currentMode === 'pvai' && currentPlayer === 'O') {
            displayCallbacks.toggleBoardInteraction(false);
            SoundController.playAISound(); 
            setTimeout(performAIMove, 700);
        }
    };

    return { 
        handlePlayerMove, 
        startGame, 
        getWinningConditions: () => winningConditions, // For external modules like unit tests or stats
        getCurrentSettings, 
        loadGameState, 
        resumeGame, 
        setDisplayCallbacks // Required by main.js for dependency injection
    };
})();