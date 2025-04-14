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
export const DEFAULT_LIVES = 1
export const MAX_LIVES = 9
export const RESPAWN_TIME = 3 // seconds

// Grid size options
export const GRID_SIZE_OPTIONS = [10, 15, 20, 25, 30]

// Lives options
export const LIVES_OPTIONS = [1, 2, 3, 5, 9]

// Fruit settings
export const FRUIT_TYPES = [
  "🍇",
  "🍈",
  "🍉",
  "🍊",
  "🍋",
  "🍋‍🟩",
  "🍌",
  "🍍",
  "🥭",
  "🍎",
  "🍏",
  "🍐",
  "🍑",
  "🍒",
  "🍓",
  "🫐",
  "🥝",
  "🍅",
  "🫒",
  "🥥",
  "🥑",
  "🍄",
  "🍆",
  "🥔",
  "🥕",
  "🌽",
  "🌶️",
  "🫑",
  "🥒",
  "🥬",
  "🥦",
  "🧄",
  "🧅",
  "🥜",
  "🫘",
  "🌰",
  "🫚",
  "🫛",
  "🍄‍🟫",
]
export const FRUIT_MOVE_INTERVAL = 3

// Direction vectors
export const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
}

// Theme colors
export const THEME = {
  LIGHT: {
    background: "#f5f5f5",
    text: "#1a1a1a",
    primary: "#3b82f6",
    secondary: "#10b981",
    accent: "#f59e0b",
    danger: "#ef4444",
    border: "#d1d5db",
    gridBg: "#ffffff",
    gridLines: "#e5e7eb",
  },
  DARK: {
    background: "#121212",
    text: "#f5f5f5",
    primary: "#3b82f6",
    secondary: "#10b981",
    accent: "#f59e0b",
    danger: "#ef4444",
    border: "#374151",
    gridBg: "#1f2937",
    gridLines: "#374151",
  },
}
