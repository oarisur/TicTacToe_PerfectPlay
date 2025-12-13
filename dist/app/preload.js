// src/electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script executed before the renderer process's web content is loaded.
 * * Purpose: Securely exposes a limited set of Electron functionality to the
 * isolated renderer context, adhering to best security practices (Context Isolation).
 */
contextBridge.exposeInMainWorld('electronAPI', {
    // --- Secure IPC Channel Example (Uncomment and expand as needed) ---
    
    /**
     * Sends data to the main process for persistent storage (e.g., stats or settings).
     * @param {string} key - The key for the data.
     * @param {object} data - The statistics object to save.
     */
    // saveNativeStats: (key, data) => ipcRenderer.invoke('save-native-stats', key, data),
    
    /**
     * Fetches initialization data or configuration from the main process.
     * @returns {Promise<any>}
     */
    // loadNativeConfig: () => ipcRenderer.invoke('load-native-config'),
    
    // Placeholder: No native features are strictly needed for this simple game, 
    // but this established pattern is mandatory for a secure Electron application.
});