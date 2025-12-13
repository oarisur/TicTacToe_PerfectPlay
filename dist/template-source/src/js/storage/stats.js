// src/js/storage/stats.js

// --- Local Storage Keys ---
export const STATS_KEY = 'tictactoe_stats_pro'; // Key for lifetime game statistics (JSON)
export const STATE_KEY = 'tictactoe_state_pro'; // Key for current unfinished game state (JSON)
export const THEME_KEY = 'tictactoe_theme_pro'; // Key for user preference theme (string)
export const MUTE_KEY = 'tictactoe_mute_pro';   // Key for sound mute state (string)

/** * Encapsulates localStorage operations for persistence. 
 * Handles serialization/deserialization for complex objects and simple strings.
 */
export const LocalStore = (() => {
    // Keys that store simple strings (e.g., "light", "true") instead of JSON objects.
    const simpleValueKeys = [THEME_KEY, MUTE_KEY];

    /** * Retrieves data from localStorage, parsing JSON if necessary.
     * @param {string} key - The localStorage key.
     * @param {any} defaultData - Value to return if data is not found or fails to parse.
     * @returns {any}
     */
    const load = (key, defaultData) => {
        const data = localStorage.getItem(key);
        
        if (!data) return defaultData;
        
        // Handle simple string values without JSON parsing.
        if (simpleValueKeys.includes(key)) {
             return data;
        }

        try {
            // Deserialize complex objects.
            return JSON.parse(data);
        } catch (e) {
            console.error(`LocalStore: Failed to parse data for ${key}. Falling back to default.`, e);
            return defaultData;
        }
    };
    
    /** * Stores data in localStorage, serializing complex objects to JSON if necessary.
     * @param {string} key - The localStorage key.
     * @param {any} data - Data to store.
     */
    const save = (key, data) => {
        try {
            let dataToStore;
            
            // Convert objects to JSON string, otherwise store as simple string.
            if (simpleValueKeys.includes(key)) {
                dataToStore = String(data); 
            } else {
                dataToStore = JSON.stringify(data);
            }
            
            localStorage.setItem(key, dataToStore);
        } catch (e) {
            // Catches quotas exceeded errors (storage limit).
            console.error(`LocalStore: Failed to save data for ${key}. Storage limit may be reached.`, e);
        }
    };
    
    /** * Removes a specific item from localStorage. */
    const removeItem = (key) => localStorage.removeItem(key);

    return { load, save, removeItem };
})();

// --- Statistics Management ---

// Initial state and structure for game statistics.
let stats = { 
    pvai: { // Player vs AI statistics
        total: { wins: 0, losses: 0, draws: 0 },
        easy: { wins: 0, losses: 0, draws: 0 },
        medium: { wins: 0, losses: 0, draws: 0 },
        hard: { wins: 0, losses: 0, draws: 0 },
    },
    pvp: {  // Player vs Player statistics (tracked per marker)
        X: { wins: 0, losses: 0, draws: 0 },
        O: { wins: 0, losses: 0, draws: 0 }
    }
}; 

/** * Manages game statistics: loading, recording results, persistence, and UI synchronization. */
export const StatsManager = (() => {
    
    // Private map to hold references to the DOM elements that display stats.
    let statElements = {};

    /** * Populates the statElements map with DOM references. Must be called after the DOM is ready. */
    const initDom = () => {
        statElements = {
            pvai: {
                wins: document.getElementById('stat-wins'),
                losses: document.getElementById('stat-losses'),
                draws: document.getElementById('stat-draws'),
            },
            pvp: {
                xWins: document.getElementById('pvp-x-wins'),
                oWins: document.getElementById('pvp-o-wins'),
                draws: document.getElementById('pvp-draws'),
            }
        };
    };

    /** * Loads statistics from local storage (STATS_KEY) and calculates aggregate totals. */
    const loadStats = () => {
        // Create a deep copy of the default structure for the fallback.
        const defaultStats = JSON.parse(JSON.stringify(stats)); 
        const loadedStats = LocalStore.load(STATS_KEY, defaultStats);
        stats = loadedStats; 

        // Recalculate PvAI total upon load to ensure consistency, 
        // regardless of how individual difficulty buckets were tracked.
        let combinedWins = 0, combinedLosses = 0, combinedDraws = 0;
        combinedWins += stats.pvai.easy.wins + stats.pvai.medium.wins + stats.pvai.hard.wins;
        combinedLosses += stats.pvai.easy.losses + stats.pvai.medium.losses + stats.pvai.hard.losses;
        combinedDraws += stats.pvai.easy.draws + stats.pvai.medium.draws + stats.pvai.hard.draws;
        stats.pvai.total = { wins: combinedWins, losses: combinedLosses, draws: combinedDraws };
    };

    /** * Updates the visible stats panel (PvAI or PvP) and populates the data fields. */
    const updateStatsUI = (mode, difficulty) => {
        const pvaiDisplay = document.getElementById('stats-pvai');
        const pvpDisplay = document.getElementById('stats-pvp');
        
        if (mode === 'pvai') {
            pvaiDisplay?.classList.remove('hidden');
            pvpDisplay?.classList.add('hidden');

            // Display stats for the selected difficulty, falling back to 'total' if none selected.
            const displayStats = stats.pvai[difficulty] || stats.pvai.total;
            if(statElements.pvai.wins) statElements.pvai.wins.textContent = displayStats.wins;
            if(statElements.pvai.losses) statElements.pvai.losses.textContent = displayStats.losses;
            if(statElements.pvai.draws) statElements.pvai.draws.textContent = displayStats.draws;
        } else { // pvp mode
            pvaiDisplay?.classList.add('hidden');
            pvpDisplay?.classList.remove('hidden');
            
            // Display PvP stats. Note: only draws are symmetric.
            if(statElements.pvp.xWins) statElements.pvp.xWins.textContent = stats.pvp.X.wins;
            if(statElements.pvp.oWins) statElements.pvp.O.wins.textContent = stats.pvp.O.wins;
            if(statElements.pvp.draws) statElements.pvp.draws.textContent = stats.pvp.X.draws; 
        }
    };
    
    /** * Records the result of the game, updates the internal state, and saves to storage.
     * @param {string | null} winnerMarker - 'X', 'O', or null for a draw.
     * @param {string} mode - 'pvai' or 'pvp'.
     * @param {string} difficulty - 'easy', 'medium', or 'hard' (relevant only for pvai).
     */
    const recordGameResult = (winnerMarker, mode, difficulty) => { 
        
        if (mode === 'pvai') {
            const result = (winnerMarker === 'X') ? 'win' : (winnerMarker === 'O' ? 'loss' : 'draw');
            
            // Update specific difficulty bucket
            const difficultyBucket = stats.pvai[difficulty]; 
            if (difficultyBucket) {
                if (result === 'win') difficultyBucket.wins++;
                else if (result === 'loss') difficultyBucket.losses++;
                else if (result === 'draw') difficultyBucket.draws++;
            }
            
            // Update total bucket (redundant due to recalculation on load, but safer)
            if (result === 'win') stats.pvai.total.wins++;
            else if (result === 'loss') stats.pvai.total.losses++;
            else if (result === 'draw') stats.pvai.total.draws++;

        } else if (mode === 'pvp') {
            // Update PvP stats for both X and O based on who won/lost.
            if (winnerMarker === 'X') {
                stats.pvp.X.wins++;
                stats.pvp.O.losses++;
            } else if (winnerMarker === 'O') {
                stats.pvp.O.wins++;
                stats.pvp.X.losses++;
            } else { 
                // Draw is counted equally for both X and O.
                stats.pvp.X.draws++; 
                stats.pvp.O.draws++; 
            }
        }

        LocalStore.save(STATS_KEY, stats);
    };
    
    /** * Saves the current board state and settings for later resumption. */
    const saveGameState = (board, player, mode, difficulty) => {
        const state = { board, currentPlayer: player, mode, difficulty };
        LocalStore.save(STATE_KEY, state);
    };
    
    /** * Removes the temporary saved game state (called after a game ends or is started fresh). */
    const deleteGameState = () => LocalStore.removeItem(STATE_KEY);

    return { loadStats, recordGameResult, saveGameState, deleteGameState, updateStatsUI, initDom }; 
})();