# Battleship Game

A classic Battleship game implemented in both Python terminal and web versions where you play against the computer.

## How to Play

### Web Version (Recommended)

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the web server:**
   ```bash
   python app.py
   ```

3. **Open your browser** - The game will automatically open at http://127.0.0.1:5000

4. **Place your ships:**
   - Click on ships to place them manually
   - Enter coordinates (e.g., "A5") and choose orientation
   - Or use "Auto Place All" for random placement
   - Click "Start Game" when ready

5. **Play the game:**
   - Enter target coordinates to attack the computer
   - Watch for hit/miss feedback
   - Computer will automatically attack your board
   - First player to sink all opponent's ships wins!

### Terminal Version

1. **Run the game:**
   ```bash
   python battleship.py
   ```

2. **Place your ships:**
   - The game will prompt you to place 5 ships:
     - Carrier (5 spaces)
     - Battleship (4 spaces)
     - Cruiser (3 spaces)
     - Submarine (3 spaces)
     - Destroyer (2 spaces)
   - Enter coordinates in the format "A5" (letter for column, number for row)
   - Choose orientation: H (horizontal) or V (vertical)
   - **Type 'QUIT' at any time to exit the game**

3. **Play the game:**
   - Take turns attacking the computer's board
   - Enter target coordinates (e.g., "A5") to attack
   - The computer will automatically attack your board
   - First player to sink all opponent's ships wins!
   - **Type 'QUIT' during your turn to exit the game**

## Game Board

- **Rows:** 1-10
- **Columns:** A-J
- **Symbols:**
  - `.` = Empty water
  - `S` = Your ship (only visible on your board)
  - `X` = Hit
  - `O` = Miss

## Features

### Web Version
- Modern, responsive web interface
- Interactive ship placement with visual preview
- Beautiful CSS styling with animations
- Click-and-play interface
- Auto-placement option
- Real-time hit/miss feedback
- Mobile-friendly design
- No terminal required

### Terminal Version
- Interactive ship placement
- Turn-based gameplay
- Clear visual board display
- Automatic computer opponent
- Win/lose detection
- Play again option
- **Quit functionality - type 'QUIT' at any time to exit**

## Requirements

### Web Version
- Python 3.x
- Flask (install with `pip install -r requirements.txt`)
- Modern web browser

### Terminal Version
- Python 3.x
- No additional dependencies required

## Game Rules

1. Ships cannot overlap
2. Ships must be placed within the 10x10 grid
3. Ships can be placed horizontally or vertically
4. Players take turns attacking one square at a time
5. Game ends when all ships of one player are sunk

Enjoy playing Battleship!
