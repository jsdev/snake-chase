import type { Direction, Position } from "./types"
import { DIRECTIONS, INITIAL_SNAKE_LENGTH } from "./constants"
import { isSamePosition } from "./utils"

export class Snake {
  segments: Position[]
  direction: Direction
  nextDirection: Direction
  color: string
  headColor: string
  gridSize: number
  noBoundaries: boolean
  allowCoiling: boolean

  constructor(
    gridSize = 20,
    startPosition?: { x: number; y: number },
    color = "green",
    headColor = "#00ff00",
    noBoundaries = false,
    allowCoiling = false,
  ) {
    this.segments = []
    this.direction = DIRECTIONS.RIGHT
    this.nextDirection = DIRECTIONS.RIGHT
    this.color = color
    this.headColor = headColor
    this.gridSize = gridSize
    this.noBoundaries = noBoundaries
    this.allowCoiling = allowCoiling
    this.initialize(startPosition)
  }

  initialize(startPosition?: { x: number; y: number }) {
    // Initialize snake at the specified position or in the middle of the grid
    const startX = startPosition?.x ?? Math.floor(this.gridSize / 2)
    const startY = startPosition?.y ?? Math.floor(this.gridSize / 2)

    this.segments = []
    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
      this.segments.push({ x: startX - i, y: startY })
    }

    this.direction = DIRECTIONS.RIGHT
    this.nextDirection = DIRECTIONS.RIGHT
  }

  setGridSize(gridSize: number) {
    this.gridSize = gridSize
  }

  setNoBoundaries(noBoundaries: boolean) {
    this.noBoundaries = noBoundaries
  }

  setAllowCoiling(allowCoiling: boolean) {
    this.allowCoiling = allowCoiling
  }

  get head(): Position {
    return this.segments[0]
  }

  move() {
    // Update direction
    this.direction = this.nextDirection

    // Calculate new head position
    const newHead = {
      x: this.head.x + this.direction.x,
      y: this.head.y + this.direction.y,
    }

    // Handle wrap-around if no boundaries mode is enabled
    if (this.noBoundaries) {
      if (newHead.x < 0) {
        newHead.x = this.gridSize - 1
      } else if (newHead.x >= this.gridSize) {
        newHead.x = 0
      }

      if (newHead.y < 0) {
        newHead.y = this.gridSize - 1
      } else if (newHead.y >= this.gridSize) {
        newHead.y = 0
      }
    }

    // Add new head to the beginning of the snake
    this.segments.unshift(newHead)

    // Return new head position
    return newHead
  }

  removeTail() {
    return this.segments.pop()
  }

  setDirection(direction: Direction) {
    // Prevent opposite directions (can't go directly backwards)
    const isOpposite =
      (this.direction.x === 1 && direction.x === -1) ||
      (this.direction.x === -1 && direction.x === 1) ||
      (this.direction.y === 1 && direction.y === -1) ||
      (this.direction.y === -1 && direction.y === 1)

    if (!isOpposite) {
      this.nextDirection = direction
    }
  }

  collidesWithSelf(): boolean {
    // If coiling is allowed, no self-collision
    if (this.allowCoiling) {
      return false
    }

    // Check if head collides with any other segment
    const head = this.head
    return this.segments.slice(1).some((segment) => isSamePosition(segment, head))
  }

  collidesWithWall(): boolean {
    // Check if head is out of bounds
    if (this.noBoundaries) {
      return false // No wall collisions in no boundaries mode
    }

    const head = this.head
    return head.x < 0 || head.x >= this.gridSize || head.y < 0 || head.y >= this.gridSize
  }

  die(): { x: number; y: number; type: "remains" }[] {
    // When the snake dies, return its segments as remains
    return this.segments.map((segment) => ({
      x: segment.x,
      y: segment.y,
      type: "remains",
    }))
  }

  // Check if a position collides with any part of the snake
  collidesWithPosition(position: Position): boolean {
    return this.segments.some((segment) => isSamePosition(segment, position))
  }

  // Check if a position collides with the snake's head specifically
  collidesWithHead(position: Position): boolean {
    return isSamePosition(this.head, position)
  }

  // Check if this snake collides with another snake
  collidesWithSnake(otherSnake: Snake): boolean {
    // Check if head collides with any segment of the other snake
    return otherSnake.segments.some((segment) => isSamePosition(this.head, segment))
  }
}
