import type { GameState } from "../types"
import { CELL_SIZE, GRID_SIZE } from "../constants"
import { RendererBase } from "./renderer-base"
import { SnakeRenderer } from "./snake-renderer"
import { FruitRenderer } from "./fruit-renderer"
import { UIRenderer } from "./ui-renderer"
import { GridRenderer } from "./grid-renderer"
import { logDebugEvent, recordRenderTime, isDebugMode, drawDebugInfo, drawFrameTiming } from "../debug-utils"

export class GameRenderer extends RendererBase {
  snakeRenderer: SnakeRenderer
  fruitRenderer: FruitRenderer
  uiRenderer: UIRenderer
  gridRenderer: GridRenderer
  cellSize: number
  gridSize: number

  // For death animation
  dyingSnake: { segments: GameState["snake"]; progress: number; isSnake2: boolean } | null = null
  animationFrame: number | null = null

  // For growth animation
  growingSnake1 = false
  growingSnake2 = false

  // For tracking frame timing
  frameTimes: number[] = []

  // For tracking previous state
  lastState: GameState | null = null

  constructor(canvas: HTMLCanvasElement, gridSize: number = GRID_SIZE, isDarkTheme = true) {
    const cellSize = CELL_SIZE
    const width = gridSize * cellSize
    const height = gridSize * cellSize

    super(canvas, width, height, isDarkTheme)

    this.cellSize = cellSize
    this.gridSize = gridSize

    // Initialize renderers
    this.snakeRenderer = new SnakeRenderer(cellSize)
    this.fruitRenderer = new FruitRenderer(cellSize)
    this.uiRenderer = new UIRenderer(cellSize)
    this.gridRenderer = new GridRenderer(gridSize, cellSize)

    logDebugEvent("Game renderer initialized", { gridSize, cellSize, width, height })
  }

  updateGridSize(gridSize: number) {
    this.gridSize = gridSize
    this.gridRenderer.updateGridSize(gridSize)

    // Update canvas size
    const width = gridSize * this.cellSize
    const height = gridSize * this.cellSize
    this.updateCanvasSize(width, height)

    logDebugEvent("Grid size updated in renderer", { gridSize, width, height })
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

  // Start death animation
  startDeathAnimation(segments: GameState["snake"], isSnake2 = false) {
    // Cancel any existing animation
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame)
    }

    // Store the dying snake segments
    this.dyingSnake = {
      segments: [...segments], // Make a copy of the segments
      progress: 0,
      isSnake2,
    }

    logDebugEvent("Death animation started", { isSnake2, segmentCount: segments.length })

    // Start the animation
    this.animateSnakeDeath()
  }

  // Animate snake death
  animateSnakeDeath() {
    if (!this.dyingSnake || !this.lastState) return

    // Increment progress
    this.dyingSnake.progress += 0.1

    // If animation is complete, remove the dying snake
    if (this.dyingSnake.progress >= 1) {
      logDebugEvent("Death animation completed")
      this.dyingSnake = null
      return
    }

    // Render the current state with the dying snake
    this.render(this.lastState, true)

    // Continue animation
    this.animationFrame = requestAnimationFrame(() => this.animateSnakeDeath())
  }

  render(state: GameState, isAnimationFrame = false) {
    const startTime = performance.now()

    if (!this.offscreenCtx) return

    // Store the state for comparison and animations
    this.lastState = state

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
        recordRenderTime(frameTime)
        this.frameTimes.push(frameTime)
        if (this.frameTimes.length > 60) this.frameTimes.shift()
      }

      this.lastRenderTime = now
    }

    const theme = this.getTheme()

    // Clear offscreen canvas with a single operation
    this.offscreenCtx.fillStyle = theme.gridBg
    this.offscreenCtx.fillRect(0, 0, this.width, this.height)

    // Draw grid lines
    this.gridRenderer.drawGrid(this.offscreenCtx, theme.gridLines)

    // Draw fruits
    this.fruitRenderer.drawFruits(this.offscreenCtx, state.fruits)

    // Draw snake 1 if not respawning
    if (state.respawning === 0) {
      this.snakeRenderer.drawSnake(
        this.offscreenCtx,
        state.snake,
        state.direction,
        state.snakeColor || "green",
        state.snakeHeadColor || "#00ff00",
        this.growingSnake1,
      )
    } else {
      // Draw respawn countdown for snake 1
      this.uiRenderer.drawRespawnCountdown(
        this.offscreenCtx,
        state.respawning,
        state.snakeColor || "green",
        this.width,
        this.height,
      )
    }

    // Draw snake 2 if in multiplayer mode and not respawning
    if (state.isMultiplayer && state.snake2 && state.direction2) {
      if (state.respawning2 === 0) {
        this.snakeRenderer.drawSnake(
          this.offscreenCtx,
          state.snake2,
          state.direction2,
          state.snake2Color || "purple",
          state.snake2HeadColor || "#8800ff",
          this.growingSnake2,
        )
      } else {
        // Draw respawn countdown for snake 2
        this.uiRenderer.drawRespawnCountdown(
          this.offscreenCtx,
          state.respawning2,
          state.snake2Color || "purple",
          this.width,
          this.height,
          true,
        )
      }
    }

    // Draw dying snake if there is one
    if (this.dyingSnake) {
      this.snakeRenderer.drawDyingSnake(
        this.offscreenCtx,
        this.dyingSnake.segments,
        this.dyingSnake.progress,
        this.dyingSnake.isSnake2 ? "purple" : "green",
        this.dyingSnake.isSnake2 ? "#8800ff" : "#00ff00",
      )
    }

    // Draw lives
    this.uiRenderer.drawLives(this.offscreenCtx, state.lives, this.width, state.lives2, state.isMultiplayer)

    // Draw debug info if in debug mode
    if (isDebugMode()) {
      drawDebugInfo(this.offscreenCtx, state, this.width, this.height)
      drawFrameTiming(this.offscreenCtx, this.width, this.height)
    }

    // Copy from offscreen canvas to visible canvas
    this.swapBuffers()

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

  // Clean up any animations when component unmounts
  cleanup() {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame)
    }
    logDebugEvent("Renderer cleanup")
  }
}
