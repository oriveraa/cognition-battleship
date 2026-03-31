class BattleshipGame {
    constructor() {
        this.boardSize = 10;
        this.ships = {
            "Carrier": 5,
            "Battleship": 4,
            "Cruiser": 3,
            "Submarine": 3,
            "Destroyer": 2
        };
        this.currentPhase = 'setup';
        this.currentShip = 'Carrier';
        this.playerBoard = this.createEmptyBoard();
        this.computerBoard = this.createEmptyBoard();
        this.playerShips = {};
        this.computerShips = {};
        this.playerHits = new Set();
        this.playerMisses = new Set();
        this.computerHits = new Set();
        this.computerMisses = new Set();
        this.currentTurn = 'player';
        this.debugMode = false;
        
        this.initializeEventListeners();
        this.showPhase('mode-select');
        this.updateCurrentShipDisplay();
        this.renderBoard('setupBoard', this.playerBoard, true);
    }

    createEmptyBoard() {
        return Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill('.'));
    }

    initializeEventListeners() {
        // Mode selection
        document.getElementById('playModeBtn').addEventListener('click', () => this.selectMode(false));
        document.getElementById('debugModeBtn').addEventListener('click', () => this.selectMode(true));
        
        // Setup phase
        document.getElementById('placeShipBtn').addEventListener('click', () => this.placeCurrentShip());
        document.getElementById('autoPlaceBtn').addEventListener('click', () => this.autoPlaceShips());
        document.getElementById('startGameBtn').addEventListener('click', () => this.startGame());
        
        // Game phase
        document.getElementById('attackBtn').addEventListener('click', () => this.playerAttack());
        document.getElementById('winGameBtn').addEventListener('click', () => this.winGame());
        document.getElementById('quitBtn').addEventListener('click', () => this.quitGame());
        
        // Game over phase
        document.getElementById('playAgainBtn').addEventListener('click', () => this.playAgain());
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        
        // Modal
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        
        // Input validation
        document.getElementById('startCoord').addEventListener('input', (e) => this.validateCoordinate(e.target));
        document.getElementById('attackCoord').addEventListener('input', (e) => this.validateCoordinate(e.target));
        
        // Ship selection by clicking
        document.querySelectorAll('.ship-item').forEach(item => {
            item.addEventListener('click', () => this.selectShip(item.dataset.ship));
        });

        // Board preview
        document.getElementById('startCoord').addEventListener('input', () => this.previewShipPlacement());
        document.querySelectorAll('input[name="orientation"]').forEach(radio => {
            radio.addEventListener('change', () => this.previewShipPlacement());
        });

        // Click on setup board grid to set starting position
        document.getElementById('setupBoard').addEventListener('click', (e) => {
            const cell = e.target.closest('.cell');
            if (cell && this.currentPhase === 'setup' && this.currentShip) {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                const coordStr = String.fromCharCode(65 + col) + (row + 1);
                document.getElementById('startCoord').value = coordStr;
                this.previewShipPlacement();
            }
        });
    }

    validateCoordinate(input) {
        const value = input.value.toUpperCase();
        const validFormat = /^[A-J][1-9]?$|^A10$|^B10$|^C10$|^D10$|^E10$|^F10$|^G10$|^H10$|^I10$|^J10$/;
        
        if (validFormat.test(value) || value === '') {
            input.style.borderColor = '#dee2e6';
            return true;
        } else {
            input.style.borderColor = '#dc3545';
            return false;
        }
    }

    parseCoordinate(coord) {
        coord = coord.toUpperCase();
        const col = coord.charCodeAt(0) - 65; // A=0, B=1, etc.
        const row = parseInt(coord.substring(1)) - 1;
        
        if (col >= 0 && col < this.boardSize && row >= 0 && row < this.boardSize) {
            return { row, col };
        }
        return null;
    }

    getShipPositions(start, orientation, size) {
        const positions = [];
        for (let i = 0; i < size; i++) {
            if (orientation === 'horizontal') {
                positions.push({ row: start.row, col: start.col + i });
            } else {
                positions.push({ row: start.row + i, col: start.col });
            }
        }
        return positions;
    }

    canPlaceShip(positions) {
        for (const pos of positions) {
            if (pos.row < 0 || pos.row >= this.boardSize || 
                pos.col < 0 || pos.col >= this.boardSize) {
                return false;
            }
            if (this.playerBoard[pos.row][pos.col] !== '.') {
                return false;
            }
        }
        return true;
    }

    placeCurrentShip() {
        if (!this.currentShip) {
            this.showMessage('Please select a ship to place first!');
            return;
        }

        const coordInput = document.getElementById('startCoord');
        const coord = this.parseCoordinate(coordInput.value);
        
        if (!coord) {
            this.showMessage('Invalid coordinate! Use format like A5.');
            return;
        }

        const orientation = document.querySelector('input[name="orientation"]:checked').value;
        const positions = this.getShipPositions(coord, orientation, this.ships[this.currentShip]);

        if (!this.canPlaceShip(positions)) {
            this.showMessage('Cannot place ship there! Ships cannot overlap or go out of bounds.');
            return;
        }

        // Place the ship
        this.playerShips[this.currentShip] = positions;
        for (const pos of positions) {
            this.playerBoard[pos.row][pos.col] = 'S';
        }

        // Update UI
        this.updateShipStatus(this.currentShip, 'placed');
        this.renderBoard('setupBoard', this.playerBoard, true);
        this.renderBoard('playerBoard', this.playerBoard, true);
        coordInput.value = '';
        this.clearPreview();

        // Move to next ship
        this.moveToNextShip();
    }

    moveToNextShip() {
        const shipNames = Object.keys(this.ships);
        const currentIndex = shipNames.indexOf(this.currentShip);
        
        // Find the next unplaced ship starting after the current one
        let nextShip = null;
        for (let i = currentIndex + 1; i < shipNames.length; i++) {
            if (!this.playerShips[shipNames[i]]) {
                nextShip = shipNames[i];
                break;
            }
        }
        // If none found after current, wrap around and check before current
        if (!nextShip) {
            for (let i = 0; i < currentIndex; i++) {
                if (!this.playerShips[shipNames[i]]) {
                    nextShip = shipNames[i];
                    break;
                }
            }
        }
        
        if (nextShip) {
            this.currentShip = nextShip;
            this.updateCurrentShipDisplay();
        } else {
            this.currentShip = null;
            document.getElementById('startGameBtn').style.display = 'block';
            document.getElementById('placeShipBtn').disabled = true;
            this.showMessage('All ships placed! Click "Start Game" to begin.');
        }
    }

    selectShip(shipName) {
        // Only allow selecting ships that haven't been placed yet
        if (this.playerShips[shipName]) {
            this.showMessage(`${shipName} has already been placed!`);
            return;
        }
        
        this.currentShip = shipName;
        document.getElementById('placeShipBtn').disabled = false;
        this.updateCurrentShipDisplay();
        this.clearPreview();
        this.previewShipPlacement();
    }

    updateCurrentShipDisplay() {
        document.querySelectorAll('.ship-item').forEach(item => {
            item.classList.remove('current');
        });
        
        if (this.currentShip) {
            const currentShipElement = document.querySelector(`[data-ship="${this.currentShip}"]`);
            if (currentShipElement) {
                currentShipElement.classList.add('current');
            }
        }
    }

    updateShipStatus(shipName, status) {
        const shipElement = document.querySelector(`[data-ship="${shipName}"]`);
        if (shipElement) {
            const statusElement = shipElement.querySelector('.ship-status');
            if (status === 'placed') {
                shipElement.classList.add('placed');
                statusElement.textContent = 'Placed';
            }
        }
    }

    previewShipPlacement() {
        if (!this.currentShip) return;

        const coordInput = document.getElementById('startCoord');
        const coord = this.parseCoordinate(coordInput.value);
        
        if (!coord) {
            this.clearPreview();
            return;
        }

        const orientation = document.querySelector('input[name="orientation"]:checked').value;
        const positions = this.getShipPositions(coord, orientation, this.ships[this.currentShip]);

        this.clearPreview();
        
        const isValid = this.canPlaceShip(positions);
        for (const pos of positions) {
            const cell = document.querySelector(`#setupBoard .cell[data-row="${pos.row}"][data-col="${pos.col}"]`);
            if (cell) {
                cell.classList.add(isValid ? 'preview' : 'preview-invalid');
            }
        }
    }

    clearPreview() {
        document.querySelectorAll('.cell.preview, .cell.preview-invalid').forEach(cell => {
            cell.classList.remove('preview', 'preview-invalid');
        });
    }


    autoPlaceShips() {
        // Clear existing ships
        this.playerBoard = this.createEmptyBoard();
        this.playerShips = {};
        
        // Place each ship randomly
        for (const [shipName, shipSize] of Object.entries(this.ships)) {
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 100) {
                const startRow = Math.floor(Math.random() * this.boardSize);
                const startCol = Math.floor(Math.random() * this.boardSize);
                const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
                
                const positions = this.getShipPositions({ row: startRow, col: startCol }, orientation, shipSize);
                
                if (this.canPlaceShip(positions)) {
                    this.playerShips[shipName] = positions;
                    for (const pos of positions) {
                        this.playerBoard[pos.row][pos.col] = 'S';
                    }
                    placed = true;
                }
                attempts++;
            }
        }

        // Update UI
        for (const shipName of Object.keys(this.ships)) {
            this.updateShipStatus(shipName, 'placed');
        }
        this.renderBoard('setupBoard', this.playerBoard, true);
        this.renderBoard('playerBoard', this.playerBoard, true);
        
        document.getElementById('startGameBtn').style.display = 'block';
        document.getElementById('placeShipBtn').disabled = true;
        this.currentShip = null;
        this.showMessage('All ships placed automatically! Click "Start Game" to begin.');
    }

    placeComputerShips() {
        for (const [shipName, shipSize] of Object.entries(this.ships)) {
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 100) {
                const startRow = Math.floor(Math.random() * this.boardSize);
                const startCol = Math.floor(Math.random() * this.boardSize);
                const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
                
                const positions = this.getShipPositions({ row: startRow, col: startCol }, orientation, shipSize);
                
                if (this.canPlaceComputerShip(positions)) {
                    this.computerShips[shipName] = positions;
                    for (const pos of positions) {
                        this.computerBoard[pos.row][pos.col] = 'S';
                    }
                    placed = true;
                }
                attempts++;
            }
        }
    }

    canPlaceComputerShip(positions) {
        for (const pos of positions) {
            if (pos.row < 0 || pos.row >= this.boardSize || 
                pos.col < 0 || pos.col >= this.boardSize) {
                return false;
            }
            if (this.computerBoard[pos.row][pos.col] !== '.') {
                return false;
            }
        }
        return true;
    }

    selectMode(isDebug) {
        this.debugMode = isDebug;
        this.showPhase('setup');
        this.updateCurrentShipDisplay();
        this.renderBoard('setupBoard', this.playerBoard, true);
    }

    startGame() {
        this.placeComputerShips();
        this.currentPhase = 'play';
        this.showPhase('play');
        
        // Show/hide debug controls based on mode
        document.getElementById('debugControls').style.display = this.debugMode ? 'block' : 'none';
        
        this.renderBoards();
        this.updateShipsCount();
        this.showMessage('Game started! Your turn to attack!');
    }

    renderBoards() {
        this.renderBoard('playerBoard', this.playerBoard, true);
        this.renderBoard('computerBoard', this.computerBoard, false);
    }

    renderBoard(boardId, board, showShips) {
        const boardElement = document.getElementById(boardId);
        const boardGrid = boardElement.parentElement;
        
        // Clear existing content except the corner label
        const existingLabels = boardGrid.querySelectorAll('.board-label:not(.corner)');
        existingLabels.forEach(label => label.remove());
        
        // Clear board cells
        boardElement.innerHTML = '';
        
        // Add column labels (A-J)
        for (let col = 0; col < this.boardSize; col++) {
            const colLabel = document.createElement('div');
            colLabel.className = 'board-label column';
            colLabel.textContent = String.fromCharCode(65 + col); // A, B, C, etc.
            colLabel.style.gridColumn = col + 2; // Start from column 2
            boardGrid.appendChild(colLabel);
        }
        
        // Add row labels (1-10) and board cells
        for (let row = 0; row < this.boardSize; row++) {
            // Add row label
            const rowLabel = document.createElement('div');
            rowLabel.className = 'board-label row';
            rowLabel.textContent = row + 1;
            rowLabel.style.gridRow = row + 2; // Start from row 2
            boardGrid.appendChild(rowLabel);
            
            // Add board cells for this row
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const cellValue = board[row][col];
                const isHit = this.isHitPosition(boardId, row, col);
                const isMiss = this.isMissPosition(boardId, row, col);
                
                if (isHit) {
                    cell.classList.add('hit');
                    cell.textContent = 'X';
                } else if (isMiss) {
                    cell.classList.add('miss');
                    cell.textContent = 'O';
                } else if (showShips && cellValue === 'S') {
                    cell.classList.add('ship');
                    cell.textContent = 'S';
                }
                
                boardElement.appendChild(cell);
            }
        }
    }

    isHitPosition(boardId, row, col) {
        if (boardId === 'playerBoard' || boardId === 'finalPlayerBoard') {
            return this.computerHits.has(`${row},${col}`);
        } else {
            return this.playerHits.has(`${row},${col}`);
        }
    }

    isMissPosition(boardId, row, col) {
        if (boardId === 'playerBoard' || boardId === 'finalPlayerBoard') {
            return this.computerMisses.has(`${row},${col}`);
        } else {
            return this.playerMisses.has(`${row},${col}`);
        }
    }

    updateShipsCount() {
        const playerShipsRemaining = this.countRemainingShips(this.playerShips, this.computerHits);
        const computerShipsRemaining = this.countRemainingShips(this.computerShips, this.playerHits);
        
        document.getElementById('playerShipsCount').textContent = playerShipsRemaining;
        document.getElementById('computerShipsCount').textContent = computerShipsRemaining;
    }

    countRemainingShips(ships, hits) {
        let remaining = 0;
        for (const [shipName, positions] of Object.entries(ships)) {
            const hasHit = positions.some(pos => hits.has(`${pos.row},${pos.col}`));
            if (!hasHit || positions.some(pos => !hits.has(`${pos.row},${pos.col}`))) {
                remaining++;
            }
        }
        return remaining;
    }

    playerAttack() {
        if (this.currentTurn !== 'player') return;

        const coordInput = document.getElementById('attackCoord');
        const coord = this.parseCoordinate(coordInput.value);
        
        if (!coord) {
            this.showMessage('Invalid coordinate! Use format like A5.');
            return;
        }

        const positionKey = `${coord.row},${coord.col}`;
        
        if (this.playerHits.has(positionKey) || this.playerMisses.has(positionKey)) {
            this.showMessage('You already attacked this position!');
            return;
        }

        const isHit = this.computerBoard[coord.row][coord.col] === 'S';
        
        if (isHit) {
            this.playerHits.add(positionKey);
            this.showMessage('Hit! You hit a computer ship!');
            
            // Check if ship is sunk
            const sunkShip = this.checkIfShipSunk(this.computerShips, this.playerHits);
            if (sunkShip) {
                this.showMessage(`Hit! You sunk the computer's ${sunkShip}!`);
            }
        } else {
            this.playerMisses.add(positionKey);
            this.showMessage('Miss!');
        }

        coordInput.value = '';
        this.renderBoards();
        this.updateShipsCount();

        if (this.checkGameOver()) {
            return;
        }

        this.currentTurn = 'computer';
        this.updateTurnIndicator();
        setTimeout(() => this.computerAttack(), 1500);
    }

    computerAttack() {
        const availablePositions = [];
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const positionKey = `${row},${col}`;
                if (!this.computerHits.has(positionKey) && !this.computerMisses.has(positionKey)) {
                    availablePositions.push({ row, col });
                }
            }
        }

        if (availablePositions.length === 0) return;

        const target = availablePositions[Math.floor(Math.random() * availablePositions.length)];
        const positionKey = `${target.row},${target.col}`;
        
        const isHit = this.playerBoard[target.row][target.col] === 'S';
        
        if (isHit) {
            this.computerHits.add(positionKey);
            const coord = String.fromCharCode(65 + target.col) + (target.row + 1);
            this.showMessage(`Computer attacks ${coord}: Hit!`);
            
            const sunkShip = this.checkIfShipSunk(this.playerShips, this.computerHits);
            if (sunkShip) {
                this.showMessage(`Computer attacks ${coord}: Hit! Your ${sunkShip} was sunk!`);
            }
        } else {
            this.computerMisses.add(positionKey);
            const coord = String.fromCharCode(65 + target.col) + (target.row + 1);
            this.showMessage(`Computer attacks ${coord}: Miss!`);
        }

        this.renderBoards();
        this.updateShipsCount();

        if (this.checkGameOver()) {
            return;
        }

        this.currentTurn = 'player';
        this.updateTurnIndicator();
    }

    checkIfShipSunk(ships, hits) {
        for (const [shipName, positions] of Object.entries(ships)) {
            const allPositionsHit = positions.every(pos => hits.has(`${pos.row},${pos.col}`));
            if (allPositionsHit) {
                return shipName;
            }
        }
        return null;
    }

    checkGameOver() {
        const playerShipsRemaining = this.countRemainingShips(this.playerShips, this.computerHits);
        const computerShipsRemaining = this.countRemainingShips(this.computerShips, this.playerHits);

        if (computerShipsRemaining === 0) {
            this.endGame('player');
            return true;
        } else if (playerShipsRemaining === 0) {
            this.endGame('computer');
            return true;
        }

        return false;
    }

    endGame(winner) {
        this.currentPhase = 'gameover';
        this.showPhase('gameover');

        const titleElement = document.getElementById('gameOverTitle');
        const messageElement = document.getElementById('gameOverMessage');

        if (winner === 'player') {
            titleElement.textContent = '🎉 Victory!';
            messageElement.textContent = 'Congratulations! You sunk all computer ships!';
        } else {
            titleElement.textContent = '💥 Defeat!';
            messageElement.textContent = 'Computer wins! Better luck next time!';
        }

        // Show final boards
        this.renderBoard('finalPlayerBoard', this.playerBoard, true);
        this.renderBoard('finalComputerBoard', this.computerBoard, true);
    }

    updateTurnIndicator() {
        const turnElement = document.getElementById('currentTurn');
        if (this.currentTurn === 'player') {
            turnElement.textContent = 'Your Turn';
            turnElement.style.color = '#28a745';
        } else {
            turnElement.textContent = 'Computer Turn';
            turnElement.style.color = '#dc3545';
        }
    }

    quitGame() {
        if (confirm('Are you sure you want to quit the game?')) {
            this.newGame();
        }
    }

    winGame() {
        if (confirm('Use debug mode to win the game immediately?')) {
            // Hit all computer ship positions
            for (const [shipName, positions] of Object.entries(this.computerShips)) {
                for (const pos of positions) {
                    this.playerHits.add(`${pos.row},${pos.col}`);
                }
            }
            
            this.renderBoards();
            this.updateShipsCount();
            this.endGame('player');
            this.showMessage('Debug mode activated! You won the game!');
        }
    }

    playAgain() {
        // Keep same ships, just reset the game state
        this.playerHits = new Set();
        this.playerMisses = new Set();
        this.computerHits = new Set();
        this.computerMisses = new Set();
        this.currentTurn = 'player';
        
        // Reset computer ships
        this.computerBoard = this.createEmptyBoard();
        this.computerShips = {};
        this.placeComputerShips();
        
        this.currentPhase = 'play';
        this.showPhase('play');
        
        // Preserve debug controls visibility based on mode
        document.getElementById('debugControls').style.display = this.debugMode ? 'block' : 'none';
        
        this.renderBoards();
        this.updateShipsCount();
        this.updateTurnIndicator();
        this.showMessage('New game started! Your turn to attack!');
    }

    newGame() {
        // Reset everything
        this.currentPhase = 'mode-select';
        this.currentShip = 'Carrier';
        this.playerBoard = this.createEmptyBoard();
        this.computerBoard = this.createEmptyBoard();
        this.playerShips = {};
        this.computerShips = {};
        this.playerHits = new Set();
        this.playerMisses = new Set();
        this.computerHits = new Set();
        this.computerMisses = new Set();
        this.currentTurn = 'player';
        
        // Reset UI
        document.querySelectorAll('.ship-item').forEach(item => {
            item.classList.remove('placed', 'current');
            item.querySelector('.ship-status').textContent = 'Not placed';
        });
        
        document.getElementById('startGameBtn').style.display = 'none';
        document.getElementById('placeShipBtn').disabled = false;
        document.getElementById('startCoord').value = '';
        document.getElementById('attackCoord').value = '';
        
        this.updateCurrentShipDisplay();
        this.showPhase('mode-select');
        this.showMessage('Choose your game mode to begin.');
    }

    showPhase(phase) {
        document.querySelectorAll('.game-phase').forEach(element => {
            element.style.display = 'none';
        });
        
        const phaseMap = {
            'mode-select': 'mode-select',
            'setup': 'game-setup',
            'play': 'game-play',
            'gameover': 'game-over'
        };
        const phaseElement = document.getElementById(phaseMap[phase] || phase);
        if (phaseElement) {
            phaseElement.style.display = 'block';
        }
        
        this.currentPhase = phase;
    }

    showMessage(message) {
        document.getElementById('modalMessage').textContent = message;
        document.getElementById('messageModal').style.display = 'block';
        
        setTimeout(() => this.closeModal(), 3000);
    }

    closeModal() {
        document.getElementById('messageModal').style.display = 'none';
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.game = new BattleshipGame();
});
