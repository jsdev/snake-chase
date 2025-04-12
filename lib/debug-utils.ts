// Debug utilities for the snake game

// Global debug flag
let DEBUG_MODE = false

// Debug events log
const debugEvents: { timestamp: number; event: string; data?: any }[] = []
const MAX_DEBUG_EVENTS = 100

// Toggle debug mode
export function toggleDebugMode(): boolean {
  DEBUG_MODE = !DEBUG_MODE
  return DEBUG_MODE
}

// Check if debug mode is enabled
export function isDebugMode(): boolean {
  return DEBUG_MODE
}

// Log a debug event
export function logDebugEvent(event: string, data?: any) {
  if (!DEBUG_MODE) return

  debugEvents.push({
    timestamp: performance.now(),
    event,
    data,
  })

  // Keep log size manageable
  if (debugEvents.length > MAX_DEBUG_EVENTS) {
    debugEvents.shift()
  }

  // Also log to console for easier inspection
  console.log(`[SNAKE DEBUG] ${event}`, data)
}

// Get debug events
export function getDebugEvents() {
  return [...debugEvents]
}

// Clear debug events
export function clearDebugEvents() {
  debugEvents.length = 0
}

// Performance monitoring
const performanceMetrics: {
  frameTime: number[]
  renderTime: number[]
  gameStepTime: number[]
} = {
  frameTime: [],
  renderTime: [],
  gameStepTime: [],
}

// Record frame time
export function recordFrameTime(time: number) {
  if (!DEBUG_MODE) return

  performanceMetrics.frameTime.push(time)
  if (performanceMetrics.frameTime.length > 60) {
    // Keep last 60 frames
    performanceMetrics.frameTime.shift()
  }
}

// Record render time
export function recordRenderTime(time: number) {
  if (!DEBUG_MODE) return

  performanceMetrics.renderTime.push(time)
  if (performanceMetrics.renderTime.length > 60) {
    performanceMetrics.renderTime.shift()
  }
}

// Record game step time
export function recordGameStepTime(time: number) {
  if (!DEBUG_MODE) return

  performanceMetrics.gameStepTime.push(time)
  if (performanceMetrics.gameStepTime.length > 60) {
    performanceMetrics.gameStepTime.shift()
  }
}

// Get performance metrics
export function getPerformanceMetrics() {
  return {
    frameTime: {
      avg:
        performanceMetrics.frameTime.length > 0
          ? performanceMetrics.frameTime.reduce((a, b) => a + b, 0) / performanceMetrics.frameTime.length
          : 0,
      max: Math.max(...performanceMetrics.frameTime, 0),
      min: Math.min(...performanceMetrics.frameTime, 0),
    },
    renderTime: {
      avg:
        performanceMetrics.renderTime.length > 0
          ? performanceMetrics.renderTime.reduce((a, b) => a + b, 0) / performanceMetrics.renderTime.length
          : 0,
      max: Math.max(...performanceMetrics.renderTime, 0),
      min: Math.min(...performanceMetrics.renderTime, 0),
    },
    gameStepTime: {
      avg:
        performanceMetrics.gameStepTime.length > 0
          ? performanceMetrics.gameStepTime.reduce((a, b) => a + b, 0) / performanceMetrics.gameStepTime.length
          : 0,
      max: Math.max(...performanceMetrics.gameStepTime, 0),
      min: Math.min(...performanceMetrics.gameStepTime, 0),
    },
  }
}

// Visual debugging helpers
export function drawDebugInfo(ctx: CanvasRenderingContext2D, state: any, width: number, height: number) {
  if (!DEBUG_MODE) return

  // Save context state
  ctx.save()

  // Draw semi-transparent overlay
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
  ctx.fillRect(0, 0, width, height)

  // Draw debug text
  ctx.fillStyle = "#00ff00"
  ctx.font = "12px monospace"
  ctx.textAlign = "left"
  ctx.textBaseline = "top"

  // Draw performance metrics
  const metrics = getPerformanceMetrics()
  let y = 10

  ctx.fillText(`FPS: ${(1000 / metrics.frameTime.avg).toFixed(1)}`, 10, y)
  y += 15
  ctx.fillText(`Render: ${metrics.renderTime.avg.toFixed(2)}ms`, 10, y)
  y += 15
  ctx.fillText(`Game Step: ${metrics.gameStepTime.avg.toFixed(2)}ms`, 10, y)
  y += 15

  // Draw game state info
  ctx.fillText(`Snake Length: ${state.snake.length}`, 10, y)
  y += 15
  ctx.fillText(`Fruits: ${state.fruits.length}`, 10, y)
  y += 15
  ctx.fillText(`Speed: ${state.speed}ms`, 10, y)
  y += 15

  // Draw recent events
  ctx.fillText("Recent Events:", 10, y)
  y += 15

  const events = getDebugEvents().slice(-5)
  for (const event of events) {
    const timeAgo = ((performance.now() - event.timestamp) / 1000).toFixed(1)
    ctx.fillText(`${timeAgo}s ago: ${event.event}`, 10, y)
    y += 15
  }

  // Restore context state
  ctx.restore()
}

// Frame timing visualization
export function drawFrameTiming(ctx: CanvasRenderingContext2D, width: number, height: number) {
  if (!DEBUG_MODE) return

  const metrics = getPerformanceMetrics()
  const frameTimes = performanceMetrics.frameTime

  if (frameTimes.length < 2) return

  // Save context state
  ctx.save()

  // Draw background
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
  ctx.fillRect(width - 210, height - 110, 200, 100)

  // Draw graph
  ctx.strokeStyle = "#00ff00"
  ctx.lineWidth = 1
  ctx.beginPath()

  const graphWidth = 180
  const graphHeight = 80
  const graphX = width - 200
  const graphY = height - 100

  // Find max value for scaling
  const maxTime = Math.max(...frameTimes, 33) // At least 33ms (30fps)

  // Draw frame time graph
  for (let i = 0; i < frameTimes.length; i++) {
    const x = graphX + (i / frameTimes.length) * graphWidth
    const y = graphY + graphHeight - (frameTimes[i] / maxTime) * graphHeight

    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }

  ctx.stroke()

  // Draw threshold lines
  // 60fps line (16.67ms)
  ctx.strokeStyle = "#00ff00"
  const y60fps = graphY + graphHeight - (16.67 / maxTime) * graphHeight
  ctx.beginPath()
  ctx.moveTo(graphX, y60fps)
  ctx.lineTo(graphX + graphWidth, y60fps)
  ctx.stroke()

  // 30fps line (33.33ms)
  ctx.strokeStyle = "#ffff00"
  const y30fps = graphY + graphHeight - (33.33 / maxTime) * graphHeight
  ctx.beginPath()
  ctx.moveTo(graphX, y30fps)
  ctx.lineTo(graphX + graphWidth, y30fps)
  ctx.stroke()

  // Draw labels
  ctx.fillStyle = "#ffffff"
  ctx.font = "10px monospace"
  ctx.textAlign = "left"
  ctx.textBaseline = "middle"
  ctx.fillText("60fps", graphX + graphWidth + 5, y60fps)
  ctx.fillText("30fps", graphX + graphWidth + 5, y30fps)

  // Restore context state
  ctx.restore()
}
