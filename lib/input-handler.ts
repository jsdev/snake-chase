import { DIRECTIONS } from "./constants"
import type { Snake } from "./snake"

export class InputHandler {
  snake: Snake
  snake2?: Snake
  onGameStart: () => void
  isGameStarted: boolean
  isGameOver: boolean
  isMultiplayer: boolean

  constructor(snake: Snake, onGameStart: () => void, snake2?: Snake, isMultiplayer = false) {
    this.snake = snake
    this.snake2 = snake2
    this.onGameStart = onGameStart
    this.isGameStarted = false
    this.isGameOver = false
    this.isMultiplayer = isMultiplayer

    // Bind the event handler to this instance
    this.handleKeyDown = this.handleKeyDown.bind(this)

    // Initialize event listeners
    this.initialize()
  }

  initialize() {
    // Remove any existing listeners first to prevent duplicates
    window.removeEventListener("keydown", this.handleKeyDown)

    // Add the event listener
    window.addEventListener("keydown", this.handleKeyDown)
  }

  cleanup() {
    window.removeEventListener("keydown", this.handleKeyDown)
  }

  setGameState(isStarted: boolean, isOver: boolean) {
    this.isGameStarted = isStarted
    this.isGameOver = isOver
  }

  setMultiplayerMode(isMultiplayer: boolean) {
    this.isMultiplayer = isMultiplayer
  }

  updateSnakes(snake: Snake, snake2?: Snake) {
    this.snake = snake
    this.snake2 = snake2
  }

  handleKeyDown(e: KeyboardEvent) {
    // Start game on any key press if not started
    if (!this.isGameStarted && !this.isGameOver) {
      this.onGameStart()
      return
    }

    // Skip if game is over
    if (this.isGameOver) return

    // Handle direction changes for first snake (arrow keys)
    switch (e.key) {
      case "ArrowUp":
        if (this.snake) this.snake.setDirection(DIRECTIONS.UP)
        break
      case "ArrowDown":
        if (this.snake) this.snake.setDirection(DIRECTIONS.DOWN)
        break
      case "ArrowLeft":
        if (this.snake) this.snake.setDirection(DIRECTIONS.LEFT)
        break
      case "ArrowRight":
        if (this.snake) this.snake.setDirection(DIRECTIONS.RIGHT)
        break
    }

    // Handle direction changes for second snake (WASD keys) if in multiplayer mode
    if (this.isMultiplayer && this.snake2) {
      switch (e.key.toLowerCase()) {
        case "w":
          this.snake2.setDirection(DIRECTIONS.UP)
          break
        case "s":
          this.snake2.setDirection(DIRECTIONS.DOWN)
          break
        case "a":
          this.snake2.setDirection(DIRECTIONS.LEFT)
          break
        case "d":
          this.snake2.setDirection(DIRECTIONS.RIGHT)
          break
      }
    }
  }
}
