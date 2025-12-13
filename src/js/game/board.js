// src/js/game/GameBoard.js

/** * Manages the core 3x3 game board state (model) using a Module Pattern (IIFE).
 * The board state is kept private and accessible only via the returned methods.
 */
export const GameBoard = (() => {
    // The private array representing the 9 cells of the board. 
    // Initialized as empty strings ("").
    let board = ["", "", "", "", "", "", "", "", ""];

    /** * Returns a copy of the current board state.
     * @returns {Array<string>}
     */
    const getBoard = () => board;
    
    /** * Overwrites the current board state (used for loading saved games or setting AI simulation states).
     * @param {Array<string>} newBoard - The new 9-element array state.
     */
    const setBoard = (newBoard) => { board = newBoard; }; 
    
    /** * Resets the board to the initial empty state.
     */
    const reset = () => { board = ["", "", "", "", "", "", "", "", ""]; };

    /** * Attempts to place a marker ('X' or 'O') on the board at a specific index.
     * This is the primary method for user/AI interaction.
     * @param {number} index - The index (0-8) of the cell to mark.
     * @param {string} playerMarker - The marker to place ('X' or 'O').
     * @returns {boolean} True if the cell was successfully marked, false if the cell was already occupied.
     */
    const markCell = (index, playerMarker) => {
        if (board[index] === "") {
            board[index] = playerMarker;
            return true;
        }
        return false;
    };
    
    return { getBoard, setBoard, reset, markCell };
})();