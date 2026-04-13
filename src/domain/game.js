import { createSudokuFromJSON } from './sudoku.js';

function cloneJSON(value) {
	return JSON.parse(JSON.stringify(value));
}

function createGameWithState({ sudoku, undoStack = [], redoStack = [] } = {}) {
	if (!sudoku || typeof sudoku.getGrid !== 'function' || typeof sudoku.guess !== 'function') {
		throw new Error('createGame requires a sudoku domain object.');
	}

	let currentSudoku = sudoku;
	const undoHistory = undoStack.map(entry => cloneJSON(entry));
	const redoHistory = redoStack.map(entry => cloneJSON(entry));

	return {
		guess(move) {
			undoHistory.push(currentSudoku.toJSON());
			redoHistory.length = 0;
			currentSudoku.guess({ row: move.row, col: move.col, value: move.value });
		},

		undo() {
			if (undoHistory.length === 0) return false;

			redoHistory.push(currentSudoku.toJSON());
			currentSudoku = createSudokuFromJSON(undoHistory.pop());
			return true;
		},

		redo() {
			if (redoHistory.length === 0) return false;

			undoHistory.push(currentSudoku.toJSON());
			currentSudoku = createSudokuFromJSON(redoHistory.pop());
			return true;
		},

		canUndo() {
			return undoHistory.length > 0;
		},

		canRedo() {
			return redoHistory.length > 0;
		},

		getSudoku() {
			return currentSudoku;
		},

		toJSON() {
			return {
				sudoku: currentSudoku.toJSON(),
				undoStack: undoHistory.map(entry => cloneJSON(entry)),
				redoStack: redoHistory.map(entry => cloneJSON(entry)),
			};
		},

		clone() {
			return createGameFromJSON(this.toJSON());
		}
	};
}

export function createGame({ sudoku } = {}) {
	return createGameWithState({ sudoku });
}

export function createGameFromJSON(json) {
	if (!json || typeof json !== 'object' || !json.sudoku) {
		throw new Error('Game JSON must include sudoku data.');
	}

	return createGameWithState({
		sudoku: createSudokuFromJSON(json.sudoku),
		undoStack: Array.isArray(json.undoStack) ? json.undoStack : [],
		redoStack: Array.isArray(json.redoStack) ? json.redoStack : [],
	});
}
