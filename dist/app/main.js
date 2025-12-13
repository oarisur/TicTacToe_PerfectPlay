// src/electron/main.js
const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');

/**
 * Creates and configures the main application window.
 */
const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 400,
        minHeight: 400,
        title: 'TicTacToe: Perfect Play',
        webPreferences: {
            // SECURITY: The preload script provides a secure, exposed bridge between the 
            // renderer context and Node.js APIs in the main process.
            preload: path.join(__dirname, 'preload.js'), 
            // SECURITY: Disables Node.js access in the renderer process for security.
            nodeIntegration: false, 
            // SECURITY: Isolates the Electron APIs from the global window object.
            contextIsolation: true 
        },
        // Prevents flash of unstyled content; window is shown only when ready.
        show: false 
    });

    // Load the local HTML file (the bundled web content).
    // Note: __dirname points to 'dist/app' after the build script executes.
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Show the window only after its content is fully loaded.
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        // Optional: Open DevTools for development purposes (comment out for production)
        // mainWindow.webContents.openDevTools(); 
    });

    // Cleanup reference when the window is explicitly closed.
    mainWindow.on('closed', () => {
        // Garbage collection handles dereferencing the object.
    });
};

// --- Application Lifecycle Management ---

// This method will be called when Electron has finished initialization.
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        // On macOS, it's common to re-create a window when the dock icon is clicked
        // and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit the application when all windows are closed.
// Exception: macOS typically keeps applications running until explicitly quit (cmd+Q).
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// --- System Menu Setup ---

// Define a minimal application menu.
const template = [{ label: app.name, submenu: [{ role: 'quit' }] }];
const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

// --- Secure IPC Channel Setup ---

// IPC handlers for secure, isolated communication with the renderer process 
// should be defined here, exposed via the preload script.
// Example:
// ipcMain.handle('get-app-version', () => app.getVersion());