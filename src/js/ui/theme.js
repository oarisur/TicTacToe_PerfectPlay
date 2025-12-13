// src/js/ui/theme.js
import { LocalStore, THEME_KEY } from '../storage/stats.js';

// --- Global DOM Element Reference ---
let themeToggle; // Reference to the theme switch button (e.g., sun/moon icon)

/** * Manages the application's theme state and persistence using the Module Pattern (IIFE). */
export const ThemeController = (() => {
    
    /** * Retrieves and stores the necessary DOM element reference. Must be called once on document load. */
    const initDom = () => {
        themeToggle = document.getElementById('theme-toggle');
    };
    
    /** * Toggles the theme between light and dark mode, updates the icon, and saves the preference. */
    const toggleTheme = () => {
        // Toggles the 'light-theme' class on the document body to switch CSS variables (Design Tokens).
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        
        // Update the button icon to reflect the *new* state.
        themeToggle.textContent = isLight ? '🌙' : '☀️'; 
        
        // Persist the theme preference using LocalStore.
        LocalStore.save(THEME_KEY, isLight ? 'light' : 'dark');
    }
    
    /** * Loads the saved theme preference from localStorage and applies it on startup. */
    const loadTheme = () => {
        const savedTheme = LocalStore.load(THEME_KEY, 'dark'); // Default to dark theme if no preference is saved.
        
        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
            themeToggle.textContent = '🌙'; 
        } else {
            // Ensure dark theme is the default visual state (no class needed) and set the icon.
            document.body.classList.remove('light-theme');
            themeToggle.textContent = '☀️'; 
        }
    };

    return { toggleTheme, loadTheme, initDom }; 
})();