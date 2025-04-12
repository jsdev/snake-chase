// Game dimensions
export const GRID_SIZE = 20
export const CELL_SIZE = 20
export const GAME_WIDTH = GRID_SIZE * CELL_SIZE
export const GAME_HEIGHT = GRID_SIZE * CELL_SIZE

// Game settings
export const INITIAL_SPEED = 150
export const MAX_SPEED = 80
export const SPEED_INCREMENT = 5
export const INITIAL_SNAKE_LENGTH = 3

// Grid size options
export const GRID_SIZE_OPTIONS = [10, 15, 20, 25, 30]

// Fruit settings
export const FRUIT_TYPES = [
  "🍇","🍈","🍉","🍊","🍋","🍋‍🟩","🍌","🍍","🥭","🍎","🍏",
  "🍐","🍑","🍒","🍓","🫐","🥝","🍅","🫒","🥥", "🥑","🍄"
]
export const FRUIT_MOVE_INTERVAL = 3

// Direction vectors
export const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
}
