// src/js/ui/display.js

import { StatsManager, LocalStore, STATE_KEY } from '../storage/stats.js';
import { ThemeController } from './theme.js';
import { SoundController } from './sound.js';
// NOTE: GameController is NOT imported here.

// --- Global DOM element references (Private Module State) ---
let cells, messageElement, messageBox, messageContentCard, closeMessageBoxButton;
let difficultyWrapper, resumePrompt, boardElement, playerXTurn, playerOTurn;
let difficultyRadios, modeRadios;

// NEW: Object to hold functions injected from GameController via main.js
let interactCallbacks = {};

/** * Manages all user interface rendering, DOM synchronization, and event listeners. */
export const DisplayController = (() => {

    /** * Safely retrieves and stores all necessary DOM element references. Must be called once on document load. */
    const initDom = () => {
        cells = document.querySelectorAll('.cell');
        messageElement = document.getElementById('message');
        messageBox = document.getElementById('custom-message-box');
        messageContentCard = document.getElementById('message-content-card');
        closeMessageBoxButton = document.getElementById('close-message-box');
        difficultyWrapper = document.getElementById('difficulty-wrapper');
        resumePrompt = document.getElementById('resume-prompt');
        boardElement = document.getElementById('game-board');
        playerXTurn = document.getElementById('player-x-turn');
        playerOTurn = document.getElementById('player-o-turn');
        difficultyRadios = document.querySelectorAll('input[name="difficulty"]');
        modeRadios = document.querySelectorAll('input[name="game-mode"]');
        StatsManager.initDom();
    }
    
    // NEW: Function to receive interaction methods from main.js (Dependency Injection)
    const setInteractionCallbacks = (callbacks) => {
        interactCallbacks = callbacks;
    };

    /** * Renders the current board state onto the cell elements (the View update). */
    const render = (board) => {
        // ... (render logic remains the same) ...
        cells.forEach((cell, index) => {
            const marker = board[index];
            cell.textContent = marker; 
            
            cell.classList.remove('text-player-X', 'text-player-O', 'cell-winner');
            cell.dataset.marker = marker; 
            cell.dataset.nextPlayerMarker = ""; 
            
            if (marker) {
                cell.classList.add(`text-player-${marker}`);
            }
        });
    };
    
    /** * Resets all core UI elements and hides overlays for a new game. */
    const resetUI = () => {
        // ... (resetUI logic remains the same) ...
        cells.forEach(cell => {
            cell.textContent = "";
            cell.classList.remove('text-player-X', 'text-player-O', 'cell-winner');
            cell.dataset.marker = "";
            cell.dataset.nextPlayerMarker = "";
        });
        messageBox.classList.remove('show');
        resumePrompt.classList.remove('show');
        playerXTurn.classList.remove('active-X');
        playerOTurn.classList.remove('active-O');
        
        messageContentCard.style.borderColor = 'var(--brand-accent)'; 
        messageElement.textContent = "Ready to Play!";
        boardElement.classList.remove('board-inactive');
    };
    
    /** * Updates the visual indicator for the current player's turn. */
    const updatePlayerIndicator = (player, mode) => {
        // ... (updatePlayerIndicator logic remains the same) ...
        playerXTurn.classList.remove('active-X');
        playerOTurn.classList.remove('active-O');
        
        playerOTurn.textContent = (mode === 'pvai' ? 'AI' : 'Player O');
        
        if (player === 'X') {
            playerXTurn.classList.add('active-X');
        } else if (player === 'O') {
            playerOTurn.classList.add('active-O');
        }
    }

    /** * Updates the main status message element with dynamic text and color coding. */
    const updateMessage = (msg, player) => {
        // ... (updateMessage logic remains the same) ...
        messageElement.textContent = msg;
        messageElement.className = 'text-base sm:text-lg font-semibold text-center h-6 flex items-center justify-center transition-colors'; 
        
        if (player === 'X') {
            messageElement.classList.add('text-player-X');
        } else if (player === 'O') {
            messageElement.classList.add('text-player-O'); 
        } else if (msg.includes('WINS')) {
            messageElement.classList.add('text-green-400');
        } else if (msg.includes('DRAW')) {
            messageElement.classList.add('text-yellow-400');
        } else {
            messageElement.classList.add('text-gray-400'); 
        }
    };
    
    /** * Shows the game-over message overlay and applies the winning cell highlight. */
    const showResult = (msg, winner, winCondition) => {
        // ... (showResult logic remains the same) ...
        messageBox.classList.add('show');
        document.getElementById('message-content').textContent = msg;
        updateMessage(msg, null); 
        updatePlayerIndicator(null); 
        
        messageContentCard.style.borderColor = `var(--brand-accent)`;
        closeMessageBoxButton.style.backgroundColor = `var(--brand-accent)`;
        
        if (winCondition) {
            winCondition.forEach(index => {
                cells[index].classList.add('cell-winner');
            });
        }
    };
    
    /** * Synchronizes the UI selectors (mode/difficulty) and toggles the visibility of AI difficulty controls. */
    const setModeState = (mode, difficulty) => {
        // ... (setModeState logic remains the same) ...
        document.getElementById(`mode-${mode}`).checked = true;
        document.getElementById(`diff-${difficulty}`).checked = true;
        
        if (mode === 'pvai') {
            difficultyWrapper.style.opacity = '1';
            difficultyWrapper.style.maxHeight = '50px';
            difficultyWrapper.style.pointerEvents = 'auto';
            playerOTurn.textContent = 'AI';
        } else {
            difficultyWrapper.style.opacity = '0';
            difficultyWrapper.style.maxHeight = '0'; 
            difficultyWrapper.style.pointerEvents = 'none';
            playerOTurn.textContent = 'Player O';
        }
        difficultyWrapper.style.transition = 'opacity 0.3s ease-in-out, max-height 0.3s ease-in-out';
    };
    
    /** * Shows the prompt asking the user to resume a saved game. */
    const showResumePrompt = (data) => {
        // ... (showResumePrompt logic remains the same) ...
        resumePrompt.classList.add('show');
        setModeState(data.mode, data.difficulty); 
        
        StatsManager.updateStatsUI(data.mode, data.difficulty); 
    }
    
    /** * Toggles the class that enables/disables pointer events on the board. */
    const toggleBoardInteraction = (isActive) => {
        // ... (toggleBoardInteraction logic remains the same) ...
        if (isActive) {
            boardElement.classList.remove('board-inactive');
        } else {
            boardElement.classList.add('board-inactive');
        }
    }
    
    /** * Sets up all event listeners for user interaction (clicks, settings changes). */
    const setupListeners = () => {
        // --- Cell Interaction ---
        cells.forEach(cell => {
            cell.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                // FIX: Call the injected method instead of the undefined GameController
                interactCallbacks.handlePlayerMove(index); 
            });
            
            // Ghost Marker Hover Logic (Feedforward for the next move)
            cell.addEventListener('mouseover', () => {
                // FIX: Call the injected method instead of the undefined GameController
                const settings = interactCallbacks.getCurrentSettings();
                
                // Check if it's the human's turn AND the cell is empty AND the board is active
                if (cell.textContent === "" && (settings.mode === 'pvp' || settings.currentPlayer === 'X') && !boardElement.classList.contains('board-inactive')) {
                    
                    const marker = settings.currentPlayer || 'X';
                    
                    cell.dataset.nextPlayerMarker = marker;
                    // Set CSS variable for ghost color based on the current marker
                    document.documentElement.style.setProperty('--current-player-color', `var(--brand-${marker.toLowerCase()})`);
                } else {
                    cell.dataset.nextPlayerMarker = "";
                }
            });
            // Clear ghost marker on mouseout for cleaner UX
            cell.addEventListener('mouseout', () => {
                cell.dataset.nextPlayerMarker = "";
            });
        });

        // --- Global Button Listeners (FIX calls to GameController) ---
        document.getElementById('reset-button').addEventListener('click', () => interactCallbacks.startGame(false));
        
        // Listener for the result dialog's close button (starts a new game upon closing)
        document.getElementById('close-message-box').addEventListener('click', () => {
            messageBox.classList.remove('show');
            interactCallbacks.startGame(false);
        });
        
        // --- Settings Change Listeners (FIX calls to GameController) ---
        const handleSettingChange = () => {
            const settings = interactCallbacks.getCurrentSettings();
            setModeState(settings.mode, settings.difficulty); 
            interactCallbacks.startGame(false); // Start a new game immediately on setting change
            
            StatsManager.updateStatsUI(settings.mode, settings.difficulty);
        };
        modeRadios.forEach(radio => radio.addEventListener('change', handleSettingChange));
        difficultyRadios.forEach(radio => radio.addEventListener('change', handleSettingChange));
        
        // --- Resume/New Game Buttons for Load Prompt (FIX calls to GameController) ---
        document.getElementById('resume-button').addEventListener('click', () => {
            resumePrompt.classList.remove('show');
            const gameStateData = LocalStore.load(STATE_KEY, null); 
            if (gameStateData) {
                interactCallbacks.resumeGame(gameStateData);
            }
        });
        document.getElementById('new-game-button').addEventListener('click', () => {
            resumePrompt.classList.remove('show');
            interactCallbacks.startGame(false);
        });

        // --- Theme & Sound Toggles ---
        document.getElementById('theme-toggle').addEventListener('click', ThemeController.toggleTheme);
        document.getElementById('mute-toggle').addEventListener('click', SoundController.toggleMute);
    };

    return { 
        render, 
        updateMessage, 
        showResult, 
        resetUI, 
        setModeState, 
        showResumePrompt, 
        updatePlayerIndicator, 
        toggleBoardInteraction, 
        setupListeners, 
        initDom,
        setInteractionCallbacks // <-- NEWLY ADDED EXPORT FOR DEPENDENCY INJECTION
    };
})();