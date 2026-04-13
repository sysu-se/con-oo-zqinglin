const GRID_SIZE = 9;

function cloneGrid(grid) {
	return grid.map(row => row.slice());
}

function assertGrid(grid) {
	if (!Array.isArray(grid) || grid.length !== GRID_SIZE) {
		throw new Error('Sudoku grid must be a 9x9 array.');
	}

	for (const row of grid) {
		if (!Array.isArray(row) || row.length !== GRID_SIZE) {
			throw new Error('Sudoku grid must be a 9x9 array.');
		}

		for (const cell of row) {
			if (!Number.isInteger(cell) || cell < 0 || cell > 9) {
				throw new Error('Sudoku values must be integers from 0 to 9.');
			}
		}
	}
}

function assertMove(move) {
	if (!move || typeof move !== 'object') {
		throw new Error('Move must be an object.');
	}

	const { row, col, value } = move;

	if (!Number.isInteger(row) || row < 0 || row >= GRID_SIZE) {
		throw new Error('Move row must be between 0 and 8.');
	}
	if (!Number.isInteger(col) || col < 0 || col >= GRID_SIZE) {
		throw new Error('Move col must be between 0 and 8.');
	}
	if (!Number.isInteger(value) || value < 0 || value > 9) {
		throw new Error('Move value must be between 0 and 9.');
	}
}

function hasConflict(grid, row, col) {
	const value = grid[row][col];
	if (value === 0) return false;

	for (let i = 0; i < GRID_SIZE; i++) {
		if (i !== col && grid[row][i] === value) return true;
		if (i !== row && grid[i][col] === value) return true;
	}

	const boxRow = Math.floor(row / 3) * 3;
	const boxCol = Math.floor(col / 3) * 3;
	for (let r = boxRow; r < boxRow + 3; r++) {
		for (let c = boxCol; c < boxCol + 3; c++) {
			if ((r !== row || c !== col) && grid[r][c] === value) return true;
		}
	}

	return false;
}

function getInvalidCellsFromGrid(grid) {
	const invalid = [];

	for (let row = 0; row < GRID_SIZE; row++) {
		for (let col = 0; col < GRID_SIZE; col++) {
			if (hasConflict(grid, row, col)) {
				invalid.push(`${col},${row}`);
			}
		}
	}

	return invalid;
}

export function createSudoku(inputGrid) {
	assertGrid(inputGrid);
	let grid = cloneGrid(inputGrid);

	return {
		guess(move) {
			assertMove(move);
			grid[move.row][move.col] = move.value;
		},

		getGrid() {
			return cloneGrid(grid);
		},

		getInvalidCells() {
			return getInvalidCellsFromGrid(grid);
		},

		isSolved() {
			for (let row = 0; row < GRID_SIZE; row++) {
				for (let col = 0; col < GRID_SIZE; col++) {
					if (grid[row][col] === 0) return false;
				}
			}

			return this.getInvalidCells().length === 0;
		},

		clone() {
			return createSudoku(grid);
		},

		toJSON() {
			return { grid: cloneGrid(grid) };
		},

		toString() {
			return grid.map(row => row.join(' ')).join('\n');
		}
	};
}

export function createSudokuFromJSON(json) {
	if (!json || typeof json !== 'object') {
		throw new Error('Sudoku JSON must be an object.');
	}

	return createSudoku(json.grid);
}
