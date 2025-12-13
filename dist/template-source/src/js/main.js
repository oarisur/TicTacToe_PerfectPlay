// src/js/main.js

import { GameController } from './game/logic.js';
import { DisplayController } from './ui/display.js';
import { ThemeController } from './ui/theme.js';
import { SoundController } from './ui/sound.js';
import { StatsManager } from './storage/stats.js';

/** * Main application initialization function, triggered after the DOM is ready.
 * Follows a crucial sequence: DOM references -> Preferences -> Listeners -> State Load.
 */
const initializeApp = () => {
    console.log('--- 🚀 Initializing TicTacToe: Perfect Play App ---');

    // 1. Initialize ALL DOM References
    DisplayController.initDom();
    ThemeController.initDom();
    SoundController.initDom();
    StatsManager.initDom();
    
    // 2. BREAK THE CIRCULAR DEPENDENCY (Part 1: Logic -> Display)
    // Injects display functions INTO the GameController.
    GameController.setDisplayCallbacks({
        render: DisplayController.render,
        updateMessage: DisplayController.updateMessage,
        updatePlayerIndicator: DisplayController.updatePlayerIndicator,
        showResult: DisplayController.showResult,
        resetUI: DisplayController.resetUI,
        setModeState: DisplayController.setModeState,
        showResumePrompt: DisplayController.showResumePrompt,
        toggleBoardInteraction: DisplayController.toggleBoardInteraction,
    });

    // 3. FIX: INJECT GameController methods INTO DisplayController (Display -> Logic)
    // This provides the missing handlePlayerMove and getCurrentSettings functions.
    DisplayController.setInteractionCallbacks({
        handlePlayerMove: GameController.handlePlayerMove,
        getCurrentSettings: GameController.getCurrentSettings,
        startGame: GameController.startGame,
        resumeGame: GameController.resumeGame,
    }); // <--- THIS STEP WAS MISSING

    // 4. Load User Preferences (Theme and Sound)
    ThemeController.loadTheme();
    SoundController.loadMuteSetting();
    
    // 5. Set up all necessary event listeners 
    // This calls setupListeners, which now uses the injected functions from step 3.
    DisplayController.setupListeners(); 
    
    // 6. Load Game State or Start New Game
    GameController.loadGameState();
    
    console.log('--- ✅ Application Ready ---');
};

// Start the application only when the entire DOM structure is loaded.
document.addEventListener('DOMContentLoaded', initializeApp);