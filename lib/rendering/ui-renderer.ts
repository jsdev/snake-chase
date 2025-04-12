export class UIRenderer {
  cellSize: number

  constructor(cellSize: number) {
    this.cellSize = cellSize
  }

  // Draw respawn countdown
  drawRespawnCountdown(
    ctx: CanvasRenderingContext2D,
    countdown: number,
    color: string,
    canvasWidth: number,
    canvasHeight: number,
    isSnake2 = false,
  ) {
    const centerX = canvasWidth / 2
    const centerY = canvasHeight / 2 + (isSnake2 ? 40 : -40)
    const radius = 30

    // Draw circle background
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)

    // Create gradient based on snake color
    let gradient
    if (color === "green") {
      gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
      gradient.addColorStop(0, "rgba(0, 255, 0, 0.8)")
      gradient.addColorStop(1, "rgba(0, 100, 0, 0.4)")
    } else {
      gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
      gradient.addColorStop(0, "rgba(200, 0, 255, 0.8)")
      gradient.addColorStop(1, "rgba(100, 0, 100, 0.4)")
    }

    ctx.fillStyle = gradient
    ctx.fill()

    // Draw countdown number
    ctx.font = "bold 36px Arial"
    ctx.fillStyle = "white"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(countdown.toString(), centerX, centerY)
  }

  // Draw lives as hearts
  drawLives(ctx: CanvasRenderingContext2D, lives: number, canvasWidth: number, lives2?: number, isMultiplayer = false) {
    const heartSize = 15
    const padding = 5
    const startY = 10

    // Draw player 1 lives
    for (let i = 0; i < lives; i++) {
      this.drawHeart(ctx, padding + i * (heartSize + padding), startY, heartSize, "#00ff00")
    }

    // Draw player 2 lives if in multiplayer mode
    if (isMultiplayer && lives2 !== undefined) {
      for (let i = 0; i < lives2; i++) {
        this.drawHeart(ctx, canvasWidth - padding - (i + 1) * (heartSize + padding), startY, heartSize, "#8800ff")
      }
    }
  }

  // Draw a heart shape
  drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
    ctx.fillStyle = color

    ctx.beginPath()
    ctx.moveTo(x + size / 2, y + size / 5)

    // Left curve
    ctx.bezierCurveTo(x + size / 5, y - size / 3, x - size / 2, y + size / 3, x + size / 2, y + size)

    // Right curve
    ctx.bezierCurveTo(x + size * 1.5, y + size / 3, x + size * 0.8, y - size / 3, x + size / 2, y + size / 5)

    ctx.fill()
  }
}
