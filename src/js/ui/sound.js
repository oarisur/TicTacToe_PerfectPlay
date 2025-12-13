// src/js/ui/sound.js
import { LocalStore, MUTE_KEY } from '../storage/stats.js';

// --- Global DOM Element and State Variables ---

// References to <audio> elements and the mute toggle button (Private Module State)
let AUDIO_MOVE, AUDIO_WIN, AUDIO_DRAW, AUDIO_LOSS, AUDIO_AI_START, muteToggle;

// Initial mute state loaded from localStorage, defaulting to false (unmuted).
let isMuted = LocalStore.load(MUTE_KEY, 'false') === 'true'; 

/**
 * Utility function: Plays the given audio element if sound is not muted.
 * Handles resetting playback position and catching browser policy errors.
 * @param {HTMLAudioElement} audioElement - The DOM audio element to play.
 */
const playSound = (audioElement) => {
    if (!isMuted && audioElement) {
        // Reset time to 0 to allow rapid, sequential playback (e.g., multiple moves).
        audioElement.currentTime = 0; 
        // Use promise-based play() and catch errors related to browser autoplay policies.
        audioElement.play().catch(e => console.warn("Audio playback failed (browser interaction policy or missing file):", e));
    }
};

/** * Manages all audio playback and the global mute state. */
export const SoundController = (() => {

    /** * Safely retrieves and stores references to audio elements and the mute toggle button. 
     * Must be called once the DOM is ready.
     */
    const initDom = () => {
        AUDIO_MOVE = document.getElementById('audio-move');
        AUDIO_WIN = document.getElementById('audio-win');
        AUDIO_DRAW = document.getElementById('audio-draw');
        AUDIO_LOSS = document.getElementById('audio-loss');
        AUDIO_AI_START = document.getElementById('audio-ai-start');
        muteToggle = document.getElementById('mute-toggle');
    };
    
    /** * Toggles the mute state, updates the UI icon, and saves the preference to localStorage. */
    const toggleMute = () => {
        isMuted = !isMuted;
        // Update the visual representation of the mute state.
        muteToggle.textContent = isMuted ? '🔇' : '🔊';
        // Persist the new state.
        LocalStore.save(MUTE_KEY, isMuted ? 'true' : 'false'); 
    }
    
    /** * Sets the initial state of the mute toggle icon based on the loaded preference. 
     * Called during application initialization.
     */
    const loadMuteSetting = () => {
        if (muteToggle) {
            muteToggle.textContent = isMuted ? '🔇' : '🔊';
        }
    }

    return { 
        // Public API for playing specific game sounds
        playMoveSound: () => playSound(AUDIO_MOVE), 
        playWinSound: () => playSound(AUDIO_WIN), 
        playDrawSound: () => playSound(AUDIO_DRAW), 
        playLossSound: () => playSound(AUDIO_LOSS), 
        playAISound: () => playSound(AUDIO_AI_START),
        
        // Public API for mute control and initialization
        toggleMute, 
        loadMuteSetting,
        initDom 
    };
})();