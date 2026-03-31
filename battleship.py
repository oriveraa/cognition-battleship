import random
import os
from typing import List, Tuple, Optional

class Board:
    def __init__(self, size: int = 10):
        self.size = size
        self.grid = [['.' for _ in range(size)] for _ in range(size)]
        self.ships = {}
        self.hits = set()
        self.misses = set()
    
    def display(self, show_ships: bool = False):
        print("   " + " ".join(chr(65 + i) for i in range(self.size)))
        for i in range(self.size):
            row_label = str(i + 1).rjust(2)
            row = row_label + " "
            for j in range(self.size):
                if (i, j) in self.hits:
                    row += "X "
                elif (i, j) in self.misses:
                    row += "O "
                elif show_ships and (i, j) in self.get_all_ship_positions():
                    row += "S "
                else:
                    row += ". "
            print(row)
        print()
    
    def get_all_ship_positions(self) -> set:
        positions = set()
        for ship_positions in self.ships.values():
            positions.update(ship_positions)
        return positions
    
    def can_place_ship(self, start: Tuple[int, int], end: Tuple[int, int]) -> bool:
        if not (0 <= start[0] < self.size and 0 <= start[1] < self.size):
            return False
        if not (0 <= end[0] < self.size and 0 <= end[1] < self.size):
            return False
        
        if start[0] != end[0] and start[1] != end[1]:
            return False
        
        positions = self.get_ship_positions(start, end)
        occupied = self.get_all_ship_positions()
        
        return not any(pos in occupied for pos in positions)
    
    def get_ship_positions(self, start: Tuple[int, int], end: Tuple[int, int]) -> List[Tuple[int, int]]:
        positions = []
        if start[0] == end[0]:
            row = start[0]
            for col in range(min(start[1], end[1]), max(start[1], end[1]) + 1):
                positions.append((row, col))
        else:
            col = start[1]
            for row in range(min(start[0], end[0]), max(start[0], end[0]) + 1):
                positions.append((row, col))
        return positions
    
    def place_ship(self, ship_name: str, start: Tuple[int, int], end: Tuple[int, int]) -> bool:
        if not self.can_place_ship(start, end):
            return False
        
        positions = self.get_ship_positions(start, end)
        self.ships[ship_name] = positions
        return True
    
    def attack(self, position: Tuple[int, int]) -> Tuple[bool, str]:
        if position in self.hits or position in self.misses:
            return False, "Already attacked this position!"
        
        if position in self.get_all_ship_positions():
            self.hits.add(position)
            for ship_name, ship_positions in self.ships.items():
                if position in ship_positions:
                    ship_positions.remove(position)
                    if not ship_positions:
                        return True, f"Hit! You sunk the {ship_name}!"
                    return True, "Hit!"
        else:
            self.misses.add(position)
            return False, "Miss!"
    
    def all_ships_sunk(self) -> bool:
        return all(len(positions) == 0 for positions in self.ships.values())

class BattleshipGame:
    def __init__(self):
        self.player_board = Board()
        self.computer_board = Board()
        self.ships = {
            "Carrier": 5,
            "Battleship": 4,
            "Cruiser": 3,
            "Submarine": 3,
            "Destroyer": 2
        }
        self.current_turn = "player"
    
    def clear_screen(self):
        os.system('clear' if os.name == 'posix' else 'cls')
    
    def get_coordinate_input(self, prompt: str) -> Tuple[int, int]:
        while True:
            try:
                coord = input(prompt).strip().upper()
                if coord == 'QUIT':
                    raise KeyboardInterrupt
                if len(coord) < 2:
                    print("Invalid coordinate format. Use format like 'A5' or 'B10'")
                    continue
                
                col = ord(coord[0]) - ord('A')
                row = int(coord[1:]) - 1
                
                if 0 <= row < 10 and 0 <= col < 10:
                    return (row, col)
                else:
                    print("Coordinate out of bounds. Use A-J for columns and 1-10 for rows.")
            except (ValueError, IndexError):
                print("Invalid coordinate format. Use format like 'A5' or 'B10'")
    
    def place_player_ships(self):
        print("Place your ships! Enter coordinates (e.g., 'A5') and orientation (H/V)")
        print("Ships to place:")
        for ship, size in self.ships.items():
            print(f"  {ship} ({size} spaces)")
        
        for ship_name, ship_size in self.ships.items():
            while True:
                self.clear_screen()
                print(f"Placing {ship_name} ({ship_size} spaces)")
                self.player_board.display(show_ships=True)
                
                try:
                    start_coord = input("Enter starting coordinate (e.g., 'A5') or 'QUIT' to exit: ").strip().upper()
                    if start_coord == 'QUIT':
                        raise KeyboardInterrupt
                    if len(start_coord) < 2:
                        print("Invalid coordinate format")
                        continue
                    
                    start_col = ord(start_coord[0]) - ord('A')
                    start_row = int(start_coord[1:]) - 1
                    
                    if not (0 <= start_row < 10 and 0 <= start_col < 10):
                        print("Coordinate out of bounds")
                        continue
                    
                    orientation = input("Enter orientation (H for horizontal, V for vertical) or 'QUIT' to exit: ").strip().upper()
                    if orientation == 'QUIT':
                        raise KeyboardInterrupt
                    
                    if orientation == 'H':
                        end_row, end_col = start_row, start_col + ship_size - 1
                    elif orientation == 'V':
                        end_row, end_col = start_row + ship_size - 1, start_col
                    else:
                        print("Invalid orientation. Use H or V.")
                        continue
                    
                    if self.player_board.place_ship(ship_name, (start_row, start_col), (end_row, end_col)):
                        break
                    else:
                        print("Cannot place ship there. Try again.")
                        input("Press Enter to continue...")
                
                except (ValueError, IndexError):
                    print("Invalid input. Try again.")
                    input("Press Enter to continue...")
    
    def place_computer_ships(self):
        for ship_name, ship_size in self.ships.items():
            while True:
                start_row = random.randint(0, 9)
                start_col = random.randint(0, 9)
                orientation = random.choice(['H', 'V'])
                
                if orientation == 'H':
                    end_row, end_col = start_row, start_col + ship_size - 1
                else:
                    end_row, end_col = start_row + ship_size - 1, start_col
                
                if (0 <= end_row < 10 and 0 <= end_col < 10 and 
                    self.computer_board.can_place_ship((start_row, start_col), (end_row, end_col))):
                    self.computer_board.place_ship(ship_name, (start_row, start_col), (end_row, end_col))
                    break
    
    def player_turn(self):
        print("Your turn to attack!")
        print("Computer's board:")
        self.computer_board.display(show_ships=False)
        
        while True:
            try:
                position = self.get_coordinate_input("Enter target coordinate (e.g., 'A5') or 'QUIT' to exit: ")
                hit, message = self.computer_board.attack(position)
                
                print(message)
                if "Already attacked" not in message:
                    break
                else:
                    input("Press Enter to try again...")
            except KeyboardInterrupt:
                raise
            except Exception as e:
                print(f"Error: {e}")
                input("Press Enter to continue...")
        
        input("Press Enter to continue...")
    
    def computer_turn(self):
        print("Computer's turn...")
        
        available_positions = []
        for i in range(10):
            for j in range(10):
                if (i, j) not in self.player_board.hits and (i, j) not in self.player_board.misses:
                    available_positions.append((i, j))
        
        if available_positions:
            position = random.choice(available_positions)
            hit, message = self.player_board.attack(position)
            
            col_char = chr(position[1] + ord('A'))
            row_num = position[0] + 1
            print(f"Computer attacks {col_char}{row_num}: {message}")
        
        input("Press Enter to continue...")
    
    def display_game_state(self):
        self.clear_screen()
        print("BATTLESHIP")
        print("=" * 50)
        
        print("Your board:")
        self.player_board.display(show_ships=True)
        
        print("Computer's board:")
        self.computer_board.display(show_ships=False)
    
    def play(self):
        try:
            self.clear_screen()
            print("Welcome to BATTLESHIP!")
            print("You will play against the computer.")
            print("Type 'QUIT' at any time to exit the game.")
            input("Press Enter to start placing your ships...")
            
            self.place_player_ships()
            self.place_computer_ships()
            
            while True:
                self.display_game_state()
                
                if self.computer_board.all_ships_sunk():
                    print("Congratulations! You won!")
                    break
                elif self.player_board.all_ships_sunk():
                    print("Computer wins! Better luck next time.")
                    break
                
                self.player_turn()
                
                self.display_game_state()
                
                if self.computer_board.all_ships_sunk():
                    print("Congratulations! You won!")
                    break
                elif self.player_board.all_ships_sunk():
                    print("Computer wins! Better luck next time.")
                    break
                
                self.computer_turn()
            
            print("\nFinal boards:")
            print("Your board:")
            self.player_board.display(show_ships=True)
            print("Computer's board:")
            self.computer_board.display(show_ships=True)
            
            play_again = input("Play again? (y/n): ").strip().lower()
            if play_again == 'y':
                self.__init__()
                self.play()
        except KeyboardInterrupt:
            print("\nGame exited. Thanks for playing!")

if __name__ == "__main__":
    game = BattleshipGame()
    game.play()
