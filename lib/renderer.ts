import type { GameState } from "./types"
import { CELL_SIZE, GRID_SIZE, THEME } from "./constants"
import {
  isDebugMode,
  logDebugEvent,
  recordRenderTime,
  recordFrameTime,
  drawDebugInfo,
  drawFrameTiming,
} from "./debug-utils"

export class GameRenderer {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D | null
  gridSize: number
  cellSize: number
  isDarkTheme: boolean
  lastState: GameState | null = null
  lastRenderTime = 0
  frameCount = 0
  // For death animation
  dyingSnake: { segments: GameState["snake"]; progress: number; isSnake2: boolean } | null = null
  // For growth animation
  growingSnake1 = false
  growingSnake2 = false
  animationFrame: number | null = null
  // For double buffering
  offscreenCanvas: HTMLCanvasElement | null = null
  offscreenCtx: CanvasRenderingContext2D | null = null
  // For tracking fruit changes
  lastFruitCount = 0
  // For tracking frame timing
  frameTimes: number[] = []

  constructor(canvas: HTMLCanvasElement, gridSize: number = GRID_SIZE, isDarkTheme = true) {
    this.canvas = canvas
    this.ctx = canvas.getContext("2d", { alpha: false }) // Use non-alpha context to prevent flicker
    this.gridSize = gridSize
    this.cellSize = CELL_SIZE
    this.isDarkTheme = isDarkTheme
    this.dyingSnake = null
    this.animationFrame = null

    // Create offscreen canvas for double buffering
    this.offscreenCanvas = document.createElement("canvas")
    this.offscreenCtx = this.offscreenCanvas.getContext("2d", { alpha: false })

    // Set canvas size
    this.updateCanvasSize()

    logDebugEvent("Renderer initialized", { gridSize, isDarkTheme })
  }

  updateGridSize(gridSize: number) {
    this.gridSize = gridSize
    this.updateCanvasSize()
    logDebugEvent("Grid size updated", { gridSize })
  }

  updateTheme(isDarkTheme: boolean) {
    this.isDarkTheme = isDarkTheme
    logDebugEvent("Theme updated", { isDarkTheme })
  }

  updateCanvasSize() {
    // Set canvas size based on grid size
    const width = this.gridSize * this.cellSize
    const height = this.gridSize * this.cellSize

    this.canvas.width = width
    this.canvas.height = height

    // Update offscreen canvas size too
    if (this.offscreenCanvas) {
      this.offscreenCanvas.width = width
      this.offscreenCanvas.height = height
    }

    logDebugEvent("Canvas size updated", { width, height })
  }

  // Notify renderer that snake is growing
  notifySnakeGrowing(isSnake2 = false) {
    if (isSnake2) {
      this.growingSnake2 = true
      logDebugEvent("Snake 2 growing")
    } else {
      this.growingSnake1 = true
      logDebugEvent("Snake 1 growing")
    }

    // Reset growth flag after a short delay
    setTimeout(() => {
      if (isSnake2) {
        this.growingSnake2 = false
      } else {
        this.growingSnake1 = false
      }
    }, 100) // Short delay to ensure smooth transition
  }

  private snake1DeathStartTime: number = 0;
  private snake2DeathStartTime: number = 0;
  private readonly DEATH_ANIMATION_DURATION = 500; // ms, Example duration, adjust as needed
  
  startDeathAnimation(segments: GameState["snake"], isSnake2 = false) {
      // Cancel any existing animation frame loop
      if (this.animationFrame !== null) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null; // Clear the ID
      }
  
      logDebugEvent(`Renderer received startDeathAnimation call for snake ${isSnake2 ? 2 : 1}`);
      if (!segments || segments.length === 0) {
          logDebugEvent("Skipping death animation: No segments provided.", {}, "warn");
          // Ensure dyingSnake is null if we skip
          if (this.dyingSnake?.isSnake2 === isSnake2) {
              this.dyingSnake = null;
          }
          return;
      }
  
      const startTime = performance.now(); // Get current time
  
      // Store the dying snake segments and reset progress
      this.dyingSnake = {
        segments: [...segments], // Make a copy
        progress: 0,
        isSnake2,
      };
  
      // Store the start time for time-based progress calculation
      if (isSnake2) {
          this.snake2DeathStartTime = startTime;
      } else {
          this.snake1DeathStartTime = startTime;
      }
  
      logDebugEvent("Death animation initiated", { isSnake2, segmentCount: segments.length, startTime });
  
      // Start the animation UPDATE loop
      this.animateSnakeDeath();
  }

 // Inside GameRenderer class

animateSnakeDeath() {
  // Ensure there is an active animation
  if (!this.dyingSnake) {
       // Clear potential lingering frame requests if state was cleared externally
       if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
       this.animationFrame = null;
       return;
  }

  // Calculate time-based progress for smoother animation
  const now = performance.now();
  const startTime = this.dyingSnake.isSnake2 ? this.snake2DeathStartTime : this.snake1DeathStartTime;
  const elapsed = now - startTime;
  const duration = this.DEATH_ANIMATION_DURATION; // Use the defined duration

  // Update progress (clamped between 0 and 1)
  this.dyingSnake.progress = Math.min(elapsed / duration, 1);

  // Check if animation is complete
  if (this.dyingSnake.progress >= 1) {
    logDebugEvent("Death animation progress >= 1 (Time-based). Clearing dyingSnake.", { isSnake2: this.dyingSnake.isSnake2 });
    this.dyingSnake = null; // Clear the animation state
    this.animationFrame = null; // Stop requesting new frames
    // DO NOT CALL RENDER HERE
    return; // Exit the animation loop
  }

  // Request the next frame to continue UPDATING the animation progress
  // The actual drawing happens in the main 'render' call triggered by the GameEngine
  this.animationFrame = requestAnimationFrame(() => this.animateSnakeDeath());
}

  render(state: GameState, isAnimationFrame = false) {
    const startTime = performance.now()

    if (!this.ctx || !this.offscreenCtx || !this.offscreenCanvas) return

    // Store the state for comparison
    this.lastState = state

    // Track fruit count changes
    if (state.fruits.length !== this.lastFruitCount) {
      logDebugEvent("Fruit count changed", {
        previous: this.lastFruitCount,
        current: state.fruits.length,
      })
      this.lastFruitCount = state.fruits.length
    }

    // Throttle regular rendering to prevent flicker (max 60fps)
    // But don't throttle animation frames
    if (!isAnimationFrame) {
      const now = performance.now()
      if (now - this.lastRenderTime < 16) {
        // ~60fps
        return
      }

      // Record frame time
      if (this.lastRenderTime > 0) {
        const frameTime = now - this.lastRenderTime
        recordFrameTime(frameTime)
        this.frameTimes.push(frameTime)
        if (this.frameTimes.length > 60) this.frameTimes.shift()
      }

      this.lastRenderTime = now
    }

    const theme = this.isDarkTheme ? THEME.DARK : THEME.LIGHT

    // Draw to offscreen canvas first
    // Clear offscreen canvas with a single operation
    this.offscreenCtx.fillStyle = theme.gridBg
    this.offscreenCtx.fillRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height)

    // Draw grid lines
    this.drawGrid(this.offscreenCtx, theme)

    // Draw fruits
    this.drawFruits(this.offscreenCtx, state.fruits)

    // Draw snake 1 if not respawning
    if (state.respawning === 0) {
      this.drawSnake(
        this.offscreenCtx,
        state.snake,
        state.direction,
        state.snakeColor || "green",
        state.snakeHeadColor || "#00ff00",
        this.growingSnake1,
      )
    } else {
      // Draw respawn countdown for snake 1 (just the number, no text)
      this.drawRespawnCountdown(this.offscreenCtx, state.respawning, state.snakeColor || "green")
    }

    // Draw snake 2 if in multiplayer mode and not respawning
    if (state.isMultiplayer && state.snake2 && state.direction2) {
      if (state.respawning2 === 0) {
        this.drawSnake(
          this.offscreenCtx,
          state.snake2,
          state.direction2,
          state.snake2Color || "purple",
          state.snake2HeadColor || "#8800ff",
          this.growingSnake2,
        )
      } else {
        // Draw respawn countdown for snake 2 (just the number, no text)
        this.drawRespawnCountdown(this.offscreenCtx, state.respawning2, state.snake2Color || "purple", true)
      }
    }

    // Draw dying snake if there is one
    if (this.dyingSnake) {
      this.drawDyingSnake(
        this.offscreenCtx,
        this.dyingSnake.segments,
        this.dyingSnake.progress,
        this.dyingSnake.isSnake2 ? "purple" : "green",
        this.dyingSnake.isSnake2 ? "#8800ff" : "#00ff00",
      )
    }

    // Draw lives
    this.drawLives(this.offscreenCtx, state.lives, state.lives2, state.isMultiplayer)

    // Draw debug info if in debug mode
    if (isDebugMode()) {
      drawDebugInfo(this.offscreenCtx, state, this.offscreenCanvas.width, this.offscreenCanvas.height)
      drawFrameTiming(this.offscreenCtx, this.offscreenCanvas.width, this.offscreenCanvas.height)
    }

    // Copy from offscreen canvas to visible canvas in a single operation
    this.ctx.drawImage(this.offscreenCanvas, 0, 0)

    // Record render time
    const renderTime = performance.now() - startTime
    recordRenderTime(renderTime)

    // Log occasional frame stats
    this.frameCount++
    if (isDebugMode() && this.frameCount % 60 === 0) {
      logDebugEvent("Frame stats", {
        renderTime,
        frameCount: this.frameCount,
        avgFrameTime: this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length,
      })
    }
  }

  drawGrid(ctx: CanvasRenderingContext2D, theme: typeof THEME.DARK) {
    ctx.strokeStyle = theme.gridLines
    ctx.lineWidth = 0.5

    // Draw vertical lines
    for (let i = 0; i <= this.gridSize; i++) {
      ctx.beginPath()
      ctx.moveTo(i * this.cellSize, 0)
      ctx.lineTo(i * this.cellSize, ctx.canvas.height)
      ctx.stroke()
    }

    // Draw horizontal lines
    for (let i = 0; i <= this.gridSize; i++) {
      ctx.beginPath()
      ctx.moveTo(0, i * this.cellSize)
      ctx.lineTo(ctx.canvas.width, i * this.cellSize)
      ctx.stroke()
    }
  }

  drawSnake(
    ctx: CanvasRenderingContext2D,
    snake: GameState["snake"],
    direction: GameState["direction"],
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

  drawDyingSnake(
    ctx: CanvasRenderingContext2D,
    segments: GameState["snake"],
    progress: number,
    baseColor = "green",
    headColor = "#00ff00",
  ) {
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

  drawSnakeEyes(ctx: CanvasRenderingContext2D, headSegment: GameState["snake"][0], direction: GameState["direction"]) {
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

  drawFruits(ctx: CanvasRenderingContext2D, fruits: GameState["fruits"]) {
    ctx.font = `${this.cellSize}px Arial`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    for (const fruit of fruits) {
      ctx.fillText(
        fruit.type,
        fruit.position.x * this.cellSize + this.cellSize / 2,
        fruit.position.y * this.cellSize + this.cellSize / 2,
      )
    }
  }

  drawRespawnCountdown(ctx: CanvasRenderingContext2D, countdown: number, color: string, isSnake2 = false) {
    const centerX = ctx.canvas.width / 2
    const centerY = ctx.canvas.height / 2 + (isSnake2 ? 40 : -40)
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

  drawLives(ctx: CanvasRenderingContext2D, lives: number, lives2?: number, isMultiplayer = false) {
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
        this.drawHeart(ctx, ctx.canvas.width - padding - (i + 1) * (heartSize + padding), startY, heartSize, "#8800ff")
      }
    }
  }

  drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
    // Draw a heart shape
    ctx.fillStyle = color

    ctx.beginPath()
    ctx.moveTo(x + size / 2, y + size / 5)

    // Left curve
    ctx.bezierCurveTo(x + size / 5, y - size / 3, x - size / 2, y + size / 3, x + size / 2, y + size)

    // Right curve
    ctx.bezierCurveTo(x + size * 1.5, y + size / 3, x + size * 0.8, y - size / 3, x + size / 2, y + size / 5)

    ctx.fill()
  }

  // Clean up any animations when component unmounts
  cleanup() {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame)
    }
    logDebugEvent("Renderer cleanup")
  }
}
