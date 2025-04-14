import type { Position, Direction } from "../types"

export class SnakeRenderer {
  cellSize: number

  constructor(cellSize: number) {
    this.cellSize = cellSize
  }

  // Draw a snake with gradient coloring
  drawSnake(
    ctx: CanvasRenderingContext2D,
    snake: Position[],
    direction: Direction,
    baseColor = "green",
    headColor = "#00ff00",
    isGrowing = false,
  ) {
    if (!ctx || snake.length === 0) return

    // Draw body segments first (back to front)
    for (let i = snake.length - 1; i > 0; i--) {
      const segment = snake[i]

      // Gradient from base color to a darker shade for the body
      if (baseColor === "green") {
        // Green to blue gradient for snake 1
        const ratio = i / snake.length
        const r = Math.floor(0 * (1 - ratio) + 0 * ratio)
        const g = Math.floor(255 * (1 - ratio) + 100 * ratio)
        const b = Math.floor(0 * (1 - ratio) + 255 * ratio)
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
      } else {
        // Purple to pink gradient for snake 2
        const ratio = i / snake.length
        const r = Math.floor(136 * (1 - ratio) + 255 * ratio)
        const g = Math.floor(0 * (1 - ratio) + 0 * ratio)
        const b = Math.floor(255 * (1 - ratio) + 128 * ratio)
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
      }

      // If growing, add a subtle glow effect to the last segment
      if (isGrowing && i === snake.length - 1) {
        // Save context state
        ctx.save()

        // Draw glow
        const glowColor = baseColor === "green" ? "rgba(0, 255, 0, 0.3)" : "rgba(200, 0, 255, 0.3)"
        ctx.shadowColor = glowColor
        ctx.shadowBlur = 10

        // Draw segment with glow
        ctx.fillRect(segment.x * this.cellSize, segment.y * this.cellSize, this.cellSize, this.cellSize)

        // Restore context state
        ctx.restore()
      } else {
        // Draw normal segment
        ctx.fillRect(segment.x * this.cellSize, segment.y * this.cellSize, this.cellSize, this.cellSize)
      }
    }

    // Draw head last (on top)
    if (snake.length > 0) {
      const head = snake[0]
      ctx.fillStyle = headColor
      ctx.fillRect(head.x * this.cellSize, head.y * this.cellSize, this.cellSize, this.cellSize)
      this.drawSnakeEyes(ctx, head, direction)
    }
  }

  // Draw snake eyes based on direction
  drawSnakeEyes(ctx: CanvasRenderingContext2D, headSegment: Position, direction: Direction) {
    ctx.fillStyle = "black"

    // Position eyes based on direction
    if (direction.y !== 0) {
      // Eyes on the sides for up/down movement
      ctx.fillRect(
        headSegment.x * this.cellSize + this.cellSize * 0.2,
        headSegment.y * this.cellSize + this.cellSize * 0.2,
        this.cellSize * 0.2,
        this.cellSize * 0.2,
      )
      ctx.fillRect(
        headSegment.x * this.cellSize + this.cellSize * 0.6,
        headSegment.y * this.cellSize + this.cellSize * 0.2,
        this.cellSize * 0.2,
        this.cellSize * 0.2,
      )
    } else {
      // Eyes on top/bottom for left/right movement
      ctx.fillRect(
        headSegment.x * this.cellSize + this.cellSize * 0.2,
        headSegment.y * this.cellSize + this.cellSize * 0.2,
        this.cellSize * 0.2,
        this.cellSize * 0.2,
      )
      ctx.fillRect(
        headSegment.x * this.cellSize + this.cellSize * 0.2,
        headSegment.y * this.cellSize + this.cellSize * 0.6,
        this.cellSize * 0.2,
        this.cellSize * 0.2,
      )
    }
  }

  // Draw a dying snake with animation
  drawDyingSnake(
    ctx: CanvasRenderingContext2D,
    segments: Position[],
    progress: number,
    baseColor = "green",
    headColor = "#00ff00",
  ) {
    alert("Drawing dying snake");
    if (!ctx || segments.length === 0) return

    const head = segments[0]

    // Calculate how many segments to show based on progress
    const segmentsToShow = Math.max(1, Math.floor(segments.length * (1 - progress)))

    // Draw the remaining segments, collapsing toward the head
    for (let i = segmentsToShow - 1; i >= 0; i--) {
      // Calculate position with interpolation toward the head
      const segment = segments[i]
      const interpolatedX = segment.x + (head.x - segment.x) * progress
      const interpolatedY = segment.y + (head.y - segment.y) * progress

      // Determine color
      let fillStyle
      if (i === 0) {
        // Head color
        fillStyle = headColor
      } else {
        // Body gradient
        if (baseColor === "green") {
          const ratio = i / segments.length
          const r = Math.floor(0 * (1 - ratio) + 0 * ratio)
          const g = Math.floor(255 * (1 - ratio) + 100 * ratio)
          const b = Math.floor(0 * (1 - ratio) + 255 * ratio)
          fillStyle = `rgb(${r}, ${g}, ${b})`
        } else {
          const ratio = i / segments.length
          const r = Math.floor(136 * (1 - ratio) + 255 * ratio)
          const g = Math.floor(0 * (1 - ratio) + 0 * ratio)
          const b = Math.floor(255 * (1 - ratio) + 128 * ratio)
          fillStyle = `rgb(${r}, ${g}, ${b})`
        }
      }

      ctx.fillStyle = fillStyle
      ctx.fillRect(interpolatedX * this.cellSize, interpolatedY * this.cellSize, this.cellSize, this.cellSize)
    }
  }
}
