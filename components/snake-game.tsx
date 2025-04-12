"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { GameEngine } from "@/lib/game-engine"
import { GameRenderer } from "@/lib/renderer"
import { InputHandler } from "@/lib/input-handler"
import { DEFAULT_LIVES, GRID_SIZE } from "@/lib/constants"
import { GameSettings } from "./game-settings"
import { MobileControls } from "./mobile-controls"
import { Pause, Play } from "lucide-react"
import type { Direction, GameSettings as GameSettingsType } from "@/lib/types"
import type { Snake } from "@/lib/snake"

export function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameEngineRef = useRef<GameEngine | null>(null)
  const rendererRef = useRef<GameRenderer | null>(null)
  const inputHandlerRef = useRef<InputHandler | null>(null)

  const [score, setScore] = useState(0)
  const [score2, setScore2] = useState(0)
  const [lives, setLives] = useState(DEFAULT_LIVES)
  const [lives2, setLives2] = useState(DEFAULT_LIVES)
  const [highScore, setHighScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [settings, setSettings] = useState<GameSettingsType>({
    gridSize: GRID_SIZE,
    isMultiplayer: false,
    noBoundaries: false,
    allowCoiling: false,
    isDarkTheme: true,
    lives: DEFAULT_LIVES,
  })

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || "ontouchstart" in window)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  // Handle settings change
  const handleSettingsChange = (newSettings: GameSettingsType) => {
    setSettings(newSettings)

    // Update lives state (but don't change lives during gameplay)
    if (!gameStarted || gameOver) {
      setLives(newSettings.lives)
      setLives2(newSettings.lives)
    }

    // Update game engine with new settings
    if (gameEngineRef.current) {
      if (gameStarted && !gameOver) {
        // During gameplay, apply only settings that can change mid-game
        gameEngineRef.current.applySettings({
          gridSize: newSettings.gridSize,
          isMultiplayer: newSettings.isMultiplayer,
          noBoundaries: newSettings.noBoundaries,
          allowCoiling: newSettings.allowCoiling,
          isDarkTheme: newSettings.isDarkTheme,
        })
      } else {
        // Between games, apply all settings
        gameEngineRef.current.setGridSize(newSettings.gridSize)
        gameEngineRef.current.setMultiplayerMode(newSettings.isMultiplayer)
        gameEngineRef.current.setNoBoundaries(newSettings.noBoundaries)
        gameEngineRef.current.setAllowCoiling(newSettings.allowCoiling)
        gameEngineRef.current.setTheme(newSettings.isDarkTheme)
        gameEngineRef.current.setLives(newSettings.lives)
      }
    }

    // Update renderer
    if (rendererRef.current) {
      rendererRef.current.updateGridSize(newSettings.gridSize)
      rendererRef.current.updateTheme(newSettings.isDarkTheme)
    }

    // Update input handler
    if (inputHandlerRef.current) {
      inputHandlerRef.current.setMultiplayerMode(newSettings.isMultiplayer)
    }

    // Update document theme
    document.body.className = newSettings.isDarkTheme ? "dark-theme" : "light-theme"
  }

  // Handle snake respawn
  const handleSnakeRespawn = (snake: Snake, isSnake2: boolean) => {
    // Update input handler with new snake instance
    if (inputHandlerRef.current) {
      if (isSnake2) {
        inputHandlerRef.current.updateSnakes(gameEngineRef.current!.snake, snake)
      } else {
        inputHandlerRef.current.updateSnakes(snake, gameEngineRef.current!.snake2)
      }
    }
  }

  // Initialize game
  const initGame = () => {
    if (!canvasRef.current || !gameEngineRef.current) return

    gameEngineRef.current.initialize()
    setScore(0)
    setScore2(0)
    setLives(settings.lives)
    setLives2(settings.lives)
    setGameOver(false)
    setGameStarted(true)
    setIsPaused(false)

    // Update input handler state
    if (inputHandlerRef.current) {
      inputHandlerRef.current.setGameState(true, false)
      inputHandlerRef.current.updateSnakes(gameEngineRef.current.snake, gameEngineRef.current.snake2)
    }
  }

  // Toggle pause
  const togglePause = () => {
    if (gameOver || !gameStarted) return

    const newPausedState = !isPaused
    setIsPaused(newPausedState)

    if (gameEngineRef.current) {
      gameEngineRef.current.setPaused(newPausedState)

      if (newPausedState) {
        // Pause the game
        if (gameEngineRef.current.gameLoop) {
          clearInterval(gameEngineRef.current.gameLoop)
          gameEngineRef.current.gameLoop = 0
        }
      } else {
        // Resume the game
        if (gameEngineRef.current.gameLoop === 0) {
          gameEngineRef.current.gameLoop = window.setInterval(
            () => gameEngineRef.current?.gameStep(),
            gameEngineRef.current.speed,
          )
        }
      }
    }
  }

  // Handle key press for pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "p" || e.key === "P" || e.key === "Escape") {
        togglePause()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isPaused, gameStarted, gameOver])

  // End game
  const handleGameOver = () => {
    setGameOver(true)
    setGameStarted(false)
    setIsPaused(false)

    // Update high score (use the higher score in multiplayer mode)
    const finalScore = settings.isMultiplayer ? Math.max(score, score2) : score
    if (finalScore > highScore) {
      setHighScore(finalScore)
    }

    // Update input handler state
    if (inputHandlerRef.current) {
      inputHandlerRef.current.setGameState(false, true)
    }
  }

  // Handle score change
  const handleScoreChange = (newScore: number, newScore2?: number) => {
    setScore(newScore)
    if (newScore2 !== undefined) {
      setScore2(newScore2)
    }
  }

  // Handle lives change
  const handleLivesChange = (newLives: number, newLives2?: number) => {
    setLives(newLives)
    if (newLives2 !== undefined) {
      setLives2(newLives2)
    }
  }

  // Handle game render
  const handleGameRender = () => {
    if (!rendererRef.current || !gameEngineRef.current) return
    rendererRef.current.render(gameEngineRef.current.getState())
  }

  // Handle mobile direction change
  const handleDirectionChange = (direction: Direction) => {
    if (!gameEngineRef.current || !gameStarted || isPaused) return
    gameEngineRef.current.snake.setDirection(direction)
  }

  // Initialize canvas and game engine
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set initial theme
    document.body.className = settings.isDarkTheme ? "dark-theme" : "light-theme"

    // Create renderer
    rendererRef.current = new GameRenderer(canvas, settings.gridSize, settings.isDarkTheme)

    // Create game engine with all settings
    gameEngineRef.current = new GameEngine(
      handleScoreChange,
      handleLivesChange,
      handleGameOver,
      handleGameRender,
      handleSnakeRespawn,
      settings.gridSize,
      settings.isMultiplayer,
      settings.noBoundaries,
      settings.allowCoiling,
      settings.isDarkTheme,
      settings.lives,
    )

    // Connect renderer to game engine
    gameEngineRef.current.setRenderer(rendererRef.current)

    // Create input handler
    inputHandlerRef.current = new InputHandler(
      gameEngineRef.current.snake,
      initGame,
      gameEngineRef.current.snake2,
      settings.isMultiplayer,
    )

    // Initial render
    if (rendererRef.current) {
      rendererRef.current.render(gameEngineRef.current.getState())
    }

    // Cleanup on unmount
    return () => {
      if (gameEngineRef.current && gameEngineRef.current.gameLoop) {
        clearInterval(gameEngineRef.current.gameLoop)
      }
      if (inputHandlerRef.current) {
        inputHandlerRef.current.cleanup()
      }
      if (rendererRef.current) {
        rendererRef.current.cleanup()
      }
    }
  }, [])

  // Get border style based on settings
  const getBorderStyle = () => {
    if (settings.noBoundaries) {
      return "rounded-xl border-4 border-transparent bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30"
    } else {
      return "border-4 border-red-600"
    }
  }

  return (
    <div className="flex flex-col items-center" style={{ color: "var(--text)" }}>
      <div
        className="mb-4 flex items-center justify-between rounded-lg p-4 w-full"
        style={{ backgroundColor: "var(--grid-bg)", color: "var(--text)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-4">
          <div>
            <span style={{ color: "var(--accent)" }}>Score:</span> {score}
          </div>
          {settings.isMultiplayer && (
            <div>
              <span style={{ color: "#8800ff" }}>Player 2:</span> {score2}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {gameStarted && !gameOver && (
            <Button
              variant="outline"
              size="icon"
              onClick={togglePause}
              className="flex items-center"
              style={{ backgroundColor: isPaused ? "var(--accent)" : "transparent" }}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              <span className="sr-only">{isPaused ? "Resume" : "Pause"}</span>
            </Button>
          )}
          <GameSettings
            settings={settings}
            onSettingsChange={handleSettingsChange}
            disabled={gameStarted && !isPaused && !gameOver}
          />
        </div>
      </div>

      <div className={`relative overflow-hidden ${getBorderStyle()}`}>
        <canvas ref={canvasRef} className="block" />

        {/* Pause overlay */}
        {isPaused && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center bg-opacity-80 p-6 text-center"
            style={{ backgroundColor: "rgba(0,0,0,0.7)", color: "var(--text)" }}
          >
            <h2 className="mb-4 text-3xl font-bold" style={{ color: "var(--accent)" }}>
              Game Paused
            </h2>
            <p className="mb-6">Press P or ESC to resume</p>
            <Button onClick={togglePause} className="bg-green-500 hover:bg-green-600">
              Resume Game
            </Button>
          </div>
        )}

        {/* Start/Game Over overlay */}
        {!gameStarted && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
            style={{ backgroundColor: "var(--background)", color: "var(--text)" }}
          >
            <h2 className="mb-4 text-2xl font-bold" style={{ color: "var(--accent)" }}>
              Snake Chase
            </h2>

            {gameOver && (
              <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                <h3 className="text-xl mb-2">Game Over!</h3>
                {!settings.isMultiplayer ? (
                  <p>
                    Your score:{" "}
                    <span className="font-bold" style={{ color: "var(--accent)" }}>
                      {score}
                    </span>
                  </p>
                ) : (
                  <>
                    <p>
                      Player 1: <span className="font-bold text-green-500">{score}</span>
                    </p>
                    <p>
                      Player 2: <span className="font-bold text-purple-500">{score2}</span>
                    </p>
                  </>
                )}
              </div>
            )}

            <Button onClick={initGame} className="bg-green-500 hover:bg-green-600">
              Start Game
            </Button>
          </div>
        )}
      </div>

      {/* Show mobile controls only on mobile devices and in single player mode */}
      {isMobile && !settings.isMultiplayer && (
        <MobileControls onDirectionChange={handleDirectionChange} disabled={!gameStarted || gameOver || isPaused} />
      )}

      {!isMobile && (
        <div className="mt-4 flex w-full justify-between items-center">
          <div style={{ color: "var(--text)" }}>
            <p className="mb-2 text-sm">Controls:</p>
            {!settings.isMultiplayer ? (
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div></div>
                <div className="rounded p-1" style={{ backgroundColor: "var(--grid-bg)" }}>
                  ↑
                </div>
                <div></div>
                <div className="rounded p-1" style={{ backgroundColor: "var(--grid-bg)" }}>
                  ←
                </div>
                <div className="rounded p-1" style={{ backgroundColor: "var(--grid-bg)" }}>
                  ↓
                </div>
                <div className="rounded p-1" style={{ backgroundColor: "var(--grid-bg)" }}>
                  →
                </div>
                <div className="col-span-3 mt-2 text-center">
                  Press <span className="font-bold">P</span> or <span className="font-bold">ESC</span> to pause
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="mb-1" style={{ color: "#00ff00" }}>
                    Player 1:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div></div>
                    <div className="rounded p-1" style={{ backgroundColor: "var(--grid-bg)" }}>
                      ↑
                    </div>
                    <div></div>
                    <div className="rounded p-1" style={{ backgroundColor: "var(--grid-bg)" }}>
                      ←
                    </div>
                    <div className="rounded p-1" style={{ backgroundColor: "var(--grid-bg)" }}>
                      ↓
                    </div>
                    <div className="rounded p-1" style={{ backgroundColor: "var(--grid-bg)" }}>
                      →
                    </div>
                  </div>
                </div>
                <div>
                  <p className="mb-1" style={{ color: "#8800ff" }}>
                    Player 2:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div></div>
                    <div className="rounded p-1" style={{ backgroundColor: "var(--grid-bg)" }}>
                      W
                    </div>
                    <div></div>
                    <div className="rounded p-1" style={{ backgroundColor: "var(--grid-bg)" }}>
                      A
                    </div>
                    <div className="rounded p-1" style={{ backgroundColor: "var(--grid-bg)" }}>
                      S
                    </div>
                    <div className="rounded p-1" style={{ backgroundColor: "var(--grid-bg)" }}>
                      D
                    </div>
                  </div>
                </div>
                <div className="col-span-2 mt-2 text-center">
                  Press <span className="font-bold">P</span> or <span className="font-bold">ESC</span> to pause
                </div>
              </div>
            )}
          </div>

          <div style={{ color: "var(--text)" }}>
            <p className="mb-2 text-sm">High Score:</p>
            <div className="text-xl font-bold" style={{ color: "var(--accent)" }}>
              {highScore}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
