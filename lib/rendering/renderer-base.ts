// Base renderer class with common functionality
import type { GameState } from "../types"
import { THEME } from "../constants"
import { logDebugEvent } from "../debug-utils"

export abstract class RendererBase {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D | null
  offscreenCanvas: HTMLCanvasElement
  offscreenCtx: CanvasRenderingContext2D | null
  width: number
  height: number
  isDarkTheme: boolean
  lastRenderTime = 0
  frameCount = 0
  dirtyRegions: Array<{ x: number; y: number; width: number; height: number }> = []

  constructor(canvas: HTMLCanvasElement, width: number, height: number, isDarkTheme = true) {
    this.canvas = canvas
    // Use non-alpha context with hardware acceleration hints
    this.ctx = canvas.getContext("2d", {
      alpha: false,
      desynchronized: true, // Hint for hardware acceleration
      willReadFrequently: false, // Optimization hint
    })

    // Create offscreen canvas for double buffering
    this.offscreenCanvas = document.createElement("canvas")
    this.offscreenCtx = this.offscreenCanvas.getContext("2d", {
      alpha: false,
      desynchronized: true,
      willReadFrequently: false,
    })

    this.width = width
    this.height = height
    this.isDarkTheme = isDarkTheme

    // Set canvas dimensions
    this.updateCanvasSize(width, height)
  }

  updateCanvasSize(width: number, height: number) {
    this.width = width
    this.height = height

    // Set device pixel ratio for sharper rendering
    const dpr = window.devicePixelRatio || 1

    // Set display size
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`

    // Set actual size in memory (scaled for retina displays)
    this.canvas.width = width * dpr
    this.canvas.height = height * dpr

    // Scale context to match device pixel ratio
    if (this.ctx) {
      this.ctx.scale(dpr, dpr)
    }

    // Update offscreen canvas size
    if (this.offscreenCanvas) {
      this.offscreenCanvas.width = width * dpr
      this.offscreenCanvas.height = height * dpr

      if (this.offscreenCtx) {
        this.offscreenCtx.scale(dpr, dpr)
      }
    }

    // Mark entire canvas as dirty
    this.markDirty(0, 0, width, height)

    logDebugEvent("Canvas size updated", { width, height, dpr })
  }

  updateTheme(isDarkTheme: boolean) {
    this.isDarkTheme = isDarkTheme
    // Mark entire canvas as dirty
    this.markDirty(0, 0, this.width, this.height)
  }

  // Mark a region as dirty (needs redrawing)
  markDirty(x: number, y: number, width: number, height: number) {
    this.dirtyRegions.push({ x, y, width, height })
  }

  // Clear dirty regions
  clearDirtyRegions() {
    this.dirtyRegions = []
  }

  // Get current theme colors
  getTheme() {
    return this.isDarkTheme ? THEME.DARK : THEME.LIGHT
  }

  // Swap buffers - copy from offscreen to visible canvas
  swapBuffers() {
    if (!this.ctx || !this.offscreenCanvas) return

    // If we have dirty regions, only copy those
    if (this.dirtyRegions.length > 0) {
      for (const region of this.dirtyRegions) {
        this.ctx.drawImage(
          this.offscreenCanvas,
          region.x,
          region.y,
          region.width,
          region.height,
          region.x,
          region.y,
          region.width,
          region.height,
        )
      }
    } else {
      // Otherwise copy the entire canvas
      this.ctx.drawImage(this.offscreenCanvas, 0, 0)
    }

    // Clear dirty regions for next frame
    this.clearDirtyRegions()
  }

  // Abstract methods to be implemented by subclasses
  abstract render(state: GameState): void
  abstract cleanup(): void
}
