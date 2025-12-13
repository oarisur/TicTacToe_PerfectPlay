// src/js/ai/minmax.js

// --- Configuration Constants ---
const aiMarker = 'O';
const humanMarker = 'X';
// Scores are manipulated by depth to prioritize winning/losing sooner.
const scores = { 'O': 100, 'X': -100, 'draw': 0 };

/**
 * Returns an array of available (empty) board indices (0-8).
 * @param {Array<string>} board - The current board state.
 * @returns {Array<number>}
 */
const findEmptySpots = (board) => board.map((val, index) => val === "" ? index : -1).filter(i => i !== -1);

/**
 * Checks if the given marker has achieved a winning line on the board.
 * @param {Array<string>} board - The current board state.
 * @param {string} marker - The marker to check ('X' or 'O').
 * @param {Array<Array<number>>} winningConditions - List of all possible winning index combinations.
 * @returns {boolean}
 */
const checkBoardWin = (board, marker, winningConditions) => {
    for (const condition of winningConditions) {
        const [a, b, c] = condition;
        if (board[a] === marker && board[b] === marker && board[c] === marker) {
            return true;
        }
    }
    return false;
};

/**
 * Checks for immediate win or block opportunities (two identical markers + one empty spot).
 * @param {Array<string>} board - The current board state.
 * @param {string} marker - The marker to check for 2-in-a-row.
 * @param {Array<Array<number>>} winningConditions - List of all possible winning index combinations.
 * @returns {number} The index (0-8) of the strategic move, or -1 if none found.
 */
const findStrategicMove = (board, marker, winningConditions) => {
    for (const condition of winningConditions) {
        const [a, b, c] = condition;
        const cells = [board[a], board[b], board[c]];
        const emptyIndexInCondition = cells.findIndex(cell => cell === "");
        
        // Check if there is exactly one empty spot and two of the target marker.
        if (emptyIndexInCondition !== -1 && cells.filter(cell => cell === marker).length === 2) {
            // Return the global board index corresponding to the empty spot.
            return condition[emptyIndexInCondition]; 
        }
    }
    return -1;
};

/**
 * The core Minimax algorithm: Recursively finds the optimal move by exploring the game tree.
 * The Maximizer (AI) seeks the highest score; the Minimizer (Human) seeks the lowest score.
 * @param {Array<string>} newBoard - The current board state being evaluated.
 * @param {string} player - The current player ('O' or 'X').
 * @param {number} depth - The current depth in the game tree (used for score tie-breaking).
 * @param {Array<Array<number>>} winningConditions - List of all possible winning index combinations.
 * @returns {{index: number, score: number}} The optimal move object.
 */
const minimax = (newBoard, player, depth, winningConditions) => {
    // Base cases: Check for terminal states (Win, Loss, or Draw).
    // The '+ depth' or '- depth' ensures faster wins/losses are preferred.
    if (checkBoardWin(newBoard, humanMarker, winningConditions)) return { score: scores['X'] + depth }; 
    if (checkBoardWin(newBoard, aiMarker, winningConditions)) return { score: scores['O'] - depth }; 
    if (findEmptySpots(newBoard).length === 0) return { score: scores['draw'] };

    const moves = [];
    const availableSpots = findEmptySpots(newBoard);

    for (const index of availableSpots) {
        const move = { index };
        // Create new board state for the recursive call to prevent mutation.
        const nextBoard = [...newBoard]; 
        nextBoard[index] = player;

        if (player === aiMarker) {
            // AI (Maximizer) calls the opponent (Minimizer).
            // Retrieve the score from the opponent's perspective.
            move.score = minimax(nextBoard, humanMarker, depth + 1, winningConditions).score;
        } else {
            // Human (Minimizer) calls the AI (Maximizer).
            move.score = minimax(nextBoard, aiMarker, depth + 1, winningConditions).score;
        }
        moves.push(move);
    }

    // --- Optimal Move Selection ---
    let bestMove;
    if (player === aiMarker) { 
        // Maximizer: Select move with the highest score.
        let bestScore = -Infinity;
        for (const move of moves) {
            if (move.score > bestScore) { bestScore = move.score; bestMove = move; }
        }
    } else { 
        // Minimizer: Select move with the lowest score.
        let bestScore = Infinity;
        for (const move of moves) {
            if (move.score < bestScore) { bestScore = move.score; bestMove = move; }
        }
    }
    return bestMove;
};


/**
 * Selects the AI's move based on the current difficulty setting.
 * This is an Immediately Invoked Function Expression (IIFE) for module scope.
 */
export const AILogic = (() => {
    let _winningConditions;

    /** Initializes the module with the specific winning conditions of the board. */
    const init = (winningConditions) => {
        _winningConditions = winningConditions;
    }

    /**
     * Determines the optimal move based on difficulty logic hierarchy.
     * @param {Array<string>} board - The current board state.
     * @param {string} difficulty - 'easy', 'medium', or 'hard'.
     * @returns {number} The index (0-8) of the chosen move.
     */
    const getBestMove = (board, difficulty) => {
        const availableMoves = findEmptySpots(board);
        if (availableMoves.length === 0) return -1;

        const opponentMarker = 'X';
        
        // 1. HARD: Full Minimax Search (Unbeatable AI)
        if (difficulty === 'hard') {
            // Start minimax at depth 0 for the AI player.
            return minimax(board, aiMarker, 0, _winningConditions).index; 
        }

        // --- Medium/Easy Logic Fallbacks (Prioritized checks for performance) ---

        // 2. Immediate Win Check (Priority 1 for Medium/Easy)
        let winningMove = findStrategicMove(board, aiMarker, _winningConditions);
        if (winningMove !== -1) return winningMove;

        // 3. Immediate Block Check (Priority 2 for Medium, Skip for Easy)
        let blockingMove = findStrategicMove(board, opponentMarker, _winningConditions);
        if (blockingMove !== -1 && difficulty === 'medium') return blockingMove;
        
        // 4. Center Spot Preference (Priority 3 for Medium)
        if (board[4] === "" && difficulty === 'medium') return 4; 

        // 5. Random Move (Fallback for Medium, Primary strategy for Easy)
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    };

    return { getBestMove, init };
})();