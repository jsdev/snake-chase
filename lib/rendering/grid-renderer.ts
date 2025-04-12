export class GridRenderer {
  gridSize: number
  cellSize: number

  constructor(gridSize: number, cellSize: number) {
    this.gridSize = gridSize
    this.cellSize = cellSize
  }

  updateGridSize(gridSize: number) {
    this.gridSize = gridSize
  }

  // Draw grid lines
  drawGrid(ctx: CanvasRenderingContext2D, gridColor: string) {
    ctx.strokeStyle = gridColor
    ctx.lineWidth = 0.5

    // Draw vertical lines
    for (let i = 0; i <= this.gridSize; i++) {
      ctx.beginPath()
      ctx.moveTo(i * this.cellSize, 0)
      ctx.lineTo(i * this.cellSize, this.gridSize * this.cellSize)
      ctx.stroke()
    }

    // Draw horizontal lines
    for (let i = 0; i <= this.gridSize; i++) {
      ctx.beginPath()
      ctx.moveTo(0, i * this.cellSize)
      ctx.lineTo(this.gridSize * this.cellSize, i * this.cellSize)
      ctx.stroke()
    }
  }
}
