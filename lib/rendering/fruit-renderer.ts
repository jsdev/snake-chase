import type { Fruit } from "../types"

export class FruitRenderer {
  cellSize: number
  lastFruitPositions: Map<number, { x: number; y: number; type: string }> = new Map()

  constructor(cellSize: number) {
    this.cellSize = cellSize
  }

  // Draw all fruits
  drawFruits(ctx: CanvasRenderingContext2D, fruits: Fruit[]) {
    ctx.font = `${this.cellSize}px Arial`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    // Clear old positions that are no longer present
    const currentIds = new Set(fruits.map((_, i) => i))
    for (const id of this.lastFruitPositions.keys()) {
      if (!currentIds.has(id)) {
        this.lastFruitPositions.delete(id)
      }
    }

    // Draw each fruit
    for (let i = 0; i < fruits.length; i++) {
      const fruit = fruits[i]

      // Check if this fruit has moved
      const lastPos = this.lastFruitPositions.get(i)
      if (lastPos && (lastPos.x !== fruit.position.x || lastPos.y !== fruit.position.y)) {
        // Fruit has moved, mark old position for clearing
        // We don't need to do anything special here since we're using dirty rectangles
      }

      // Draw the fruit
      ctx.fillText(
        fruit.type,
        fruit.position.x * this.cellSize + this.cellSize / 2,
        fruit.position.y * this.cellSize + this.cellSize / 2,
      )

      // Update last position
      this.lastFruitPositions.set(i, {
        x: fruit.position.x,
        y: fruit.position.y,
        type: fruit.type,
      })
    }
  }
}
