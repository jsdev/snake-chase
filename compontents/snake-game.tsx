"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Game constants
const GRID_SIZE = 20
const CELL_SIZE = 20
const GAME_WIDTH = GRID_SIZE * CELL_SIZE
const GAME_HEIGHT = GRID_SIZE * CELL_SIZE
const INITIAL_SPEED = 150
const MAX_SPEED = 80
const SPEED_INCREMENT = 5
const FRUIT_TYPES = ["🍎", "🍒", "🍓", "🍊", "🍋", "🍉", "🍇", "🍍"]
const INITIAL_SNAKE_LENGTH = 3

// Direction constants
const UP = { x: 0, y: -1 }
const DOWN = { x: 0, y: 1 }
const LEFT = { x: -1, y: 0 }
const RIGHT = { x: 1, y: 0 }

// Types
type Position = {
  x: number
  y: number
}

type Fruit = {
  position: Position
  type: string
  direction: Position
  moveCounter: number
}

export function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)

  // Game state refs (to avoid re-renders)
  const gameStateRef = useRef({
    snake: [] as Position[],
    direction: RIGHT,
    nextDirection: RIGHT,
    fruits: [] as Fruit[],
    speed: INITIAL_SPEED,
    gameLoop: 0,
    score: 0,
  })

  // Initialize game
  const initGame = () => {
    const state = gameStateRef.current

    // Initialize snake in the middle of the grid
    const startX = Math.floor(GRID_SIZE / 2)
    const startY = Math.floor(GRID_SIZE / 2)

    state.snake = []
    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
      state.snake.push({ x: startX - i, y: startY })
    }

    state.direction = RIGHT
    state.nextDirection = RIGHT
    state.fruits = []
    state.speed = INITIAL_SPEED
    state.score = 0

    // Add initial fruits
    addFruit()
    addFruit()

    setScore(0)
    setGameOver(false)
    setGameStarted(true)

    // Start game loop
    if (state.gameLoop) clearInterval(state.gameLoop)
    state.gameLoop = window.setInterval(gameStep, state.speed)
  }

  // Add a new fruit at a random position
  const addFruit = () => {
    const state = gameStateRef.current

    // Find a position that doesn't overlap with the snake or other fruits
    let position: Position
    let overlapping = true

    while (overlapping) {
      position = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      }

      overlapping = false

      // Check if position overlaps with snake
      for (const segment of state.snake) {
        if (segment.x === position.x && segment.y === position.y) {
          overlapping = true
          break
        }
      }

      // Check if position overlaps with other fruits
      if (!overlapping) {
        for (const fruit of state.fruits) {
          if (fruit.position.x === position.x && fruit.position.y === position.y) {
            overlapping = true
            break
          }
        }
      }
    }

    // Random fruit type
    const type = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)]

    // Random direction
    const directions = [UP, DOWN, LEFT, RIGHT]
    const direction = directions[Math.floor(Math.random() * directions.length)]

    state.fruits.push({
      position: position!,
      type,
      direction,
      moveCounter: 0,
    })
  }

  // Game step function
  const gameStep = () => {
    const state = gameStateRef.current
    const canvas = canvasRef.current
    if (!canvas) return

    // Update direction
    state.direction = state.nextDirection

    // Move snake
    const head = { ...state.snake[0] }
    head.x += state.direction.x
    head.y += state.direction.y

    // Check for wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      endGame()
      return
    }

    // Check for self collision
    for (let i = 0; i < state.snake.length; i++) {
      if (state.snake[i].x === head.x && state.snake[i].y === head.y) {
        endGame()
        return
      }
    }

    // Add new head
    state.snake.unshift(head)

    // Check for fruit collision
    let fruitEaten = false
    for (let i = 0; i < state.fruits.length; i++) {
      if (state.fruits[i].position.x === head.x && state.fruits[i].position.y === head.y) {
        // Remove eaten fruit
        state.fruits.splice(i, 1)

        // Increase score
        state.score += 10
        setScore(state.score)

        // Increase speed
        if (state.speed > MAX_SPEED) {
          state.speed -= SPEED_INCREMENT
          clearInterval(state.gameLoop)
          state.gameLoop = window.setInterval(gameStep, state.speed)
        }

        // Add new fruit
        addFruit()

        fruitEaten = true
        break
      }
    }

    // Remove tail if no fruit was eaten
    if (!fruitEaten) {
      state.snake.pop()
    }

    // Move fruits (every 3 steps)
    for (const fruit of state.fruits) {
      fruit.moveCounter++

      if (fruit.moveCounter >= 3) {
        fruit.moveCounter = 0

        // Calculate new position
        const newX = fruit.position.x + fruit.direction.x
        const newY = fruit.position.y + fruit.direction.y

        // Check if fruit would hit a wall
        if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
          // Change direction randomly
          const directions = [UP, DOWN, LEFT, RIGHT]
          fruit.direction = directions[Math.floor(Math.random() * directions.length)]
        } else {
          // Move fruit
          fruit.position.x = newX
          fruit.position.y = newY
        }
      }
    }

    // Draw game
    drawGame()
  }

  // End game
  const endGame = () => {
    const state = gameStateRef.current

    clearInterval(state.gameLoop)
    state.gameLoop = 0

    setGameOver(true)
    setGameStarted(false)

    // Update high score
    if (state.score > highScore) {
      setHighScore(state.score)
    }
  }

  // Draw game
  const drawGame = () => {
    const state = gameStateRef.current
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)

    // Draw grid lines
    ctx.strokeStyle = "#333"
    ctx.lineWidth = 0.5

    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL_SIZE, 0)
      ctx.lineTo(i * CELL_SIZE, GAME_HEIGHT)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, i * CELL_SIZE)
      ctx.lineTo(GAME_WIDTH, i * CELL_SIZE)
      ctx.stroke()
    }

    // Draw snake
    for (let i = 0; i < state.snake.length; i++) {
      const segment = state.snake[i]

      // Head is a different color
      if (i === 0) {
        ctx.fillStyle = "#00ff00" // Green head
      } else {
        // Gradient from green to blue for the body
        const ratio = i / state.snake.length
        const r = Math.floor(0 * (1 - ratio) + 0 * ratio)
        const g = Math.floor(255 * (1 - ratio) + 100 * ratio)
        const b = Math.floor(0 * (1 - ratio) + 255 * ratio)
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
      }

      ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE)

      // Draw eyes on the head
      if (i === 0) {
        ctx.fillStyle = "black"

        // Position eyes based on direction
        if (state.direction === UP || state.direction === DOWN) {
          // Eyes on the sides
          ctx.fillRect(
            segment.x * CELL_SIZE + CELL_SIZE * 0.2,
            segment.y * CELL_SIZE + CELL_SIZE * 0.2,
            CELL_SIZE * 0.2,
            CELL_SIZE * 0.2,
          )
          ctx.fillRect(
            segment.x * CELL_SIZE + CELL_SIZE * 0.6,
            segment.y * CELL_SIZE + CELL_SIZE * 0.2,
            CELL_SIZE * 0.2,
            CELL_SIZE * 0.2,
          )
        } else {
          // Eyes on top/bottom
          ctx.fillRect(
            segment.x * CELL_SIZE + CELL_SIZE * 0.2,
            segment.y * CELL_SIZE + CELL_SIZE * 0.2,
            CELL_SIZE * 0.2,
            CELL_SIZE * 0.2,
          )
          ctx.fillRect(
            segment.x * CELL_SIZE + CELL_SIZE * 0.2,
            segment.y * CELL_SIZE + CELL_SIZE * 0.6,
            CELL_SIZE * 0.2,
            CELL_SIZE * 0.2,
          )
        }
      }
    }

    // Draw fruits
    ctx.font = `${CELL_SIZE}px Arial`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    for (const fruit of state.fruits) {
      ctx.fillText(
        fruit.type,
        fruit.position.x * CELL_SIZE + CELL_SIZE / 2,
        fruit.position.y * CELL_SIZE + CELL_SIZE / 2,
      )
    }
  }

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = gameStateRef.current

      // Start game on any key press if not started
      if (!gameStarted && !gameOver) {
        initGame()
        return
      }

      // Prevent opposite directions (can't go directly backwards)
      switch (e.key) {
        case "ArrowUp":
          if (state.direction !== DOWN) {
            state.nextDirection = UP
          }
          break
        case "ArrowDown":
          if (state.direction !== UP) {
            state.nextDirection = DOWN
          }
          break
        case "ArrowLeft":
          if (state.direction !== RIGHT) {
            state.nextDirection = LEFT
          }
          break
        case "ArrowRight":
          if (state.direction !== LEFT) {
            state.nextDirection = RIGHT
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [gameStarted, gameOver])

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas size
    canvas.width = GAME_WIDTH
    canvas.height = GAME_HEIGHT

    // Draw initial game state
    drawGame()

    // Cleanup on unmount
    return () => {
      if (gameStateRef.current.gameLoop) {
        clearInterval(gameStateRef.current.gameLoop)
      }
    }
  }, [])

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 flex items-center justify-between rounded-lg bg-gray-800 p-4 text-white w-full">
        <div>
          <span className="text-yellow-400">Score:</span> {score}
        </div>
        <div>
          <span className="text-yellow-400">High Score:</span> {highScore}
        </div>
      </div>

      <div className="relative rounded-lg border-4 border-blue-500 overflow-hidden">
        <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} className="block" />

        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 text-white">
            <h2 className="mb-4 text-2xl font-bold text-yellow-400">Snake Chase</h2>
            <p className="mb-6 text-center">
              Use arrow keys to control the snake.
              <br />
              Eat fruits to grow and score points!
              <br />
              Watch out - the fruits move around!
            </p>
            <Button onClick={initGame} className="bg-green-500 hover:bg-green-600">
              Start Game
            </Button>
          </div>
        )}
      </div>

      <Dialog open={gameOver} onOpenChange={setGameOver}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Game Over!</DialogTitle>
            <DialogDescription className="text-center">
              Your score: <span className="font-bold text-yellow-500">{score}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button onClick={initGame} className="bg-green-500 hover:bg-green-600">
              Play Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mt-6 text-center text-white">
        <p className="mb-2 text-sm">Controls:</p>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div></div>
          <div className="rounded bg-gray-700 p-1">↑</div>
          <div></div>
          <div className="rounded bg-gray-700 p-1">←</div>
          <div className="rounded bg-gray-700 p-1">↓</div>
          <div className="rounded bg-gray-700 p-1">→</div>
        </div>
      </div>
    </div>
  )
}
