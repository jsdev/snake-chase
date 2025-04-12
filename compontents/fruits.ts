import type { Fruit, Position } from "./types"
import { DIRECTIONS, FRUIT_MOVE_INTERVAL, FRUIT_TYPES, GRID_SIZE } from "./constants"
import { getRandomItem, overlapsWithAny } from "./utils"

export class FruitManager {
  fruits: Fruit[]
  gridSize: number

  constructor(gridSize: number = GRID_SIZE) {
    this.fruits = []
    this.gridSize = gridSize
  }

  setGridSize(gridSize: number) {
    this.gridSize = gridSize
  }

  // Get a random position within the grid
  getRandomPosition(): Position {
    return {
      x: Math.floor(Math.random() * this.gridSize),
      y: Math.floor(Math.random() * this.gridSize),
    }
  }

  // Check if a position is out of bounds
  isOutOfBounds(position: Position): boolean {
    return position.x < 0 || position.x >= this.gridSize || position.y < 0 || position.y >= this.gridSize
  }

  // Add a new fruit at a random position that doesn't overlap with the snake or other fruits
  addFruit(snakeSegments: Position[]) {
    let position: Position
    let overlapping = true

    // Find a position that doesn't overlap with the snake or other fruits
    while (overlapping) {
      position = this.getRandomPosition()
      overlapping =
        overlapsWithAny(position, snakeSegments) ||
        this.fruits.some((fruit) => fruit.position.x === position.x && fruit.position.y === position.y)
    }

    // Random fruit type
    const type = getRandomItem(FRUIT_TYPES)

    // Random direction
    const directions = Object.values(DIRECTIONS)
    const direction = getRandomItem(directions)

    this.fruits.push({
      position: position!,
      type,
      direction,
      moveCounter: 0,
    })
  }

  // Move all fruits
  moveFruits(snakeSegments: Position[]) {
    for (const fruit of this.fruits) {
      fruit.moveCounter++

      if (fruit.moveCounter >= FRUIT_MOVE_INTERVAL) {
        fruit.moveCounter = 0

        // Calculate new position
        const newPosition = {
          x: fruit.position.x + fruit.direction.x,
          y: fruit.position.y + fruit.direction.y,
        }

        // Check if fruit would hit a wall or snake body (except head)
        if (this.isOutOfBounds(newPosition) || this.wouldCollideWithSnakeBody(newPosition, snakeSegments)) {
          // Change direction randomly, avoiding the current direction
          this.changeDirection(fruit)
        } else {
          // Move fruit
          fruit.position = newPosition
        }
      }
    }
  }

  // Check if a position would collide with any snake segment
  wouldCollideWithSnakeBody(position: Position, snakeSegments: Position[]): boolean {
    // Skip the head (first segment) since we handle head collisions separately
    return overlapsWithAny(position, snakeSegments.slice(1))
  }

  // Change fruit direction randomly, avoiding the current direction
  changeDirection(fruit: Fruit) {
    const directions = Object.values(DIRECTIONS)

    // Filter out the current direction and its opposite
    const oppositeDirection = { x: -fruit.direction.x, y: -fruit.direction.y }
    const validDirections = directions.filter(
      (dir) =>
        !(dir.x === fruit.direction.x && dir.y === fruit.direction.y) &&
        !(dir.x === oppositeDirection.x && dir.y === oppositeDirection.y),
    )

    // If there are valid directions, choose one randomly
    if (validDirections.length > 0) {
      fruit.direction = getRandomItem(validDirections)
    } else {
      // If no valid directions, just pick any random direction
      fruit.direction = getRandomItem(directions)
    }
  }

  // Check for fruit collision with snake head and return the eaten fruit index
  checkFruitEaten(headPosition: Position): number {
    return this.fruits.findIndex((fruit) => fruit.position.x === headPosition.x && fruit.position.y === headPosition.y)
  }

  // Remove a fruit by index
  removeFruit(index: number) {
    if (index >= 0) {
      this.fruits.splice(index, 1)
      return true
    }
    return false
  }
}
