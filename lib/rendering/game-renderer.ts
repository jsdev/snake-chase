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
    const startTime = performance.now();

    if (!this.offscreenCtx) return;

    // Store the state for comparison and animations (Good practice)
    this.lastState = state;

    // --- Animation Frame Throttling / Timing ---
    // Your existing logic here for throttling and frame timing is fine
    if (!isAnimationFrame) {
        const now = performance.now();
        if (now - this.lastRenderTime < 16) { // ~60fps throttle
             return;
        }
        if (this.lastRenderTime > 0) { /* ... record frame time ... */ }
        this.lastRenderTime = now;
    }

    const theme = this.getTheme();

    // Clear offscreen canvas
    this.offscreenCtx.fillStyle = theme.gridBg;
    this.offscreenCtx.fillRect(0, 0, this.width, this.height);

    // Draw grid lines
    this.gridRenderer.drawGrid(this.offscreenCtx, theme.gridLines);

    // Draw fruits
    this.fruitRenderer.drawFruits(this.offscreenCtx, state.fruits);

    // --- Determine Drawing Flags based on Animation ---
    let drawNormalSnake1 = true; // Flag to control drawing of non-animating snake 1
    let drawNormalSnake2 = true; // Flag to control drawing of non-animating snake 2

    // --- Draw Dying Snake Animation (Highest Priority) ---
    if (this.dyingSnake) {
      // Use the state colors from the main state object for consistency
      const dyingColor = this.dyingSnake.isSnake2 ? (state.snake2Color || "purple") : (state.snakeColor || "green");
      const dyingHeadColor = this.dyingSnake.isSnake2 ? (state.snake2HeadColor || "#8800ff") : (state.snakeHeadColor || "#00ff00");

      this.snakeRenderer.drawDyingSnake(
        this.offscreenCtx,
        this.dyingSnake.segments,
        this.dyingSnake.progress,
        dyingColor,
        dyingHeadColor
      );
      // Prevent drawing the normal snake/respawn text for the snake that is dying
      if (this.dyingSnake.isSnake2) {
        drawNormalSnake2 = false;
      } else {
        drawNormalSnake1 = false;
      }
    }

    // --- Draw Snake 1 (Alive or Respawning Text) ---
    // Only draw if not currently animating death
    if (drawNormalSnake1) {
      // Check if snake 1 is alive and not respawning
      if (state.lives > 0 && state.respawning === 0) {
        this.snakeRenderer.drawSnake(
          this.offscreenCtx,
          state.snake,
          state.direction,
          state.snakeColor || "green",
          state.snakeHeadColor || "#00ff00",
          this.growingSnake1
        );
      // Check if snake 1 is currently respawning (draw text)
      } else if (state.respawning > 0) {
        this.uiRenderer.drawRespawnCountdown(
          this.offscreenCtx,
          state.respawning,
          state.snakeColor || "green",
          this.width,
          this.height
        );
      }
      // Implicitly: If lives <= 0 AND not respawning AND not animating death, draw nothing.
    }

    // --- Draw Snake 2 (Alive or Respawning Text) ---
    // Only draw if multiplayer mode is active AND snake 2 is not animating death
    if (state.isMultiplayer && drawNormalSnake2) {
      // Check if snake 2 actually exists in the state
      if (state.snake2 && state.direction2) {
        // Check if snake 2 is alive and not respawning
        if (state.lives2 > 0 && state.respawning2 === 0) {
          this.snakeRenderer.drawSnake(
            this.offscreenCtx,
            state.snake2,
            state.direction2,
            state.snake2Color || "purple",
            state.snake2HeadColor || "#8800ff",
            this.growingSnake2
          );
        // Check if snake 2 is currently respawning (draw text)
        } else if (state.respawning2 > 0) {
          this.uiRenderer.drawRespawnCountdown(
            this.offscreenCtx,
            state.respawning2,
            state.snake2Color || "purple",
            this.width,
            this.height,
            true // isSnake2 = true
          );
        }
        // Implicitly: If lives2 <= 0 AND not respawning AND not animating death, draw nothing.
      }
    }

    // --- Draw UI Elements ---
    this.uiRenderer.drawLives(this.offscreenCtx, state.lives, this.width, state.lives2, state.isMultiplayer);

    // Draw debug info if needed
    if (isDebugMode()) {
        drawDebugInfo(this.offscreenCtx, state, this.width, this.height);
        drawFrameTiming(this.offscreenCtx, this.width, this.height);
    }

    // Copy to visible canvas
    this.swapBuffers();

    // --- Record timing / stats ---
    const renderTime = performance.now() - startTime;
    recordRenderTime(renderTime);
    this.frameCount++;   
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
