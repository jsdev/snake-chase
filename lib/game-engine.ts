import type { GameState, Position } from "./types";
import { Snake } from "./snake";
import { FruitManager } from "./fruit";
import { INITIAL_SPEED, MAX_SPEED, SPEED_INCREMENT, DEFAULT_LIVES, RESPAWN_TIME } from "./constants";
import type { GameRenderer } from "./rendering/game-renderer";
import { logDebugEvent, recordGameStepTime } from "./debug-utils";

export class GameEngine {
  snake: Snake;
  snake2?: Snake;
  fruitManager: FruitManager;
  score: number;
  score2: number;
  lives: number;
  lives2: number;
  speed: number;
  animationFrameId: number | null = null; // Used for the main game loop
  lastFrameTime = 0;
  accumulator = 0;
  respawnTimer: number; // Holds setInterval ID for snake 1 respawn
  respawnTimer2: number; // Holds setInterval ID for snake 2 respawn
  respawnCountdown: number;
  respawnCountdown2: number;
  isMultiplayer: boolean;
  noBoundaries: boolean;
  allowCoiling: boolean;
  isDarkTheme: boolean;
  gridSize: number;
  isPaused: boolean;
  renderer: GameRenderer | null = null;
  onScoreChange: (score: number, score2?: number) => void;
  onLivesChange: (lives: number, lives2?: number) => void;
  onGameOver: () => void;
  onGameRender: () => void;
  onSnakeRespawn: (snake: Snake, isSnake2: boolean) => void;
  lastGameStepTime = 0;

  constructor(
    onScoreChange: (score: number, score2?: number) => void,
    onLivesChange: (lives: number, lives2?: number) => void,
    onGameOver: () => void,
    onGameRender: () => void,
    onSnakeRespawn: (snake: Snake, isSnake2: boolean) => void,
    gridSize = 20,
    isMultiplayer = false,
    noBoundaries = false,
    allowCoiling = false,
    isDarkTheme = true,
    lives = DEFAULT_LIVES,
  ) {
    this.snake = new Snake(gridSize, undefined, "green", "#00ff00", noBoundaries, allowCoiling);
    this.fruitManager = new FruitManager(gridSize);
    this.score = 0;
    this.score2 = 0;
    this.lives = lives;
    this.lives2 = lives;
    this.speed = INITIAL_SPEED;
    this.respawnTimer = 0; // Initialize timer ID holder
    this.respawnTimer2 = 0; // Initialize timer ID holder
    this.respawnCountdown = 0;
    this.respawnCountdown2 = 0;
    this.isMultiplayer = isMultiplayer;
    this.noBoundaries = noBoundaries;
    this.allowCoiling = allowCoiling;
    this.isDarkTheme = isDarkTheme;
    this.gridSize = gridSize;
    this.isPaused = false;
    this.onScoreChange = onScoreChange;
    this.onLivesChange = onLivesChange;
    this.onGameOver = onGameOver;
    this.onGameRender = onGameRender;
    this.onSnakeRespawn = onSnakeRespawn;

    if (isMultiplayer) {
      this.setMultiplayerMode(true);
    }

    logDebugEvent("Game engine initialized", {
      gridSize,
      isMultiplayer,
      noBoundaries,
      allowCoiling,
      isDarkTheme,
      lives,
    });
  }

  setRenderer(renderer: GameRenderer) {
    this.renderer = renderer;
    logDebugEvent("Renderer set in game engine");
  }

  setMultiplayerMode(isMultiplayer: boolean) {
    this.isMultiplayer = isMultiplayer;
    if (isMultiplayer && !this.snake2) {
      // Create second snake at a different position
      this.snake2 = new Snake(
        this.gridSize,
        { x: Math.floor(this.gridSize / 2), y: Math.floor(this.gridSize / 2) + 5 },
        "purple",
        "#8800ff",
        this.noBoundaries,
        this.allowCoiling,
      );
      logDebugEvent("Second snake created for multiplayer");
    }
  }

  setGridSize(size: number) {
    this.gridSize = size;
    this.snake.setGridSize(size);
    if (this.snake2) {
      this.snake2.setGridSize(size);
    }
    this.fruitManager.setGridSize(size);
    logDebugEvent("Grid size updated in game engine", { size });
  }

  setNoBoundaries(noBoundaries: boolean) {
    this.noBoundaries = noBoundaries;
    this.snake.setNoBoundaries(noBoundaries);
    if (this.snake2) {
      this.snake2.setNoBoundaries(noBoundaries);
    }
    logDebugEvent("No boundaries setting updated", { noBoundaries });
  }

  setAllowCoiling(allowCoiling: boolean) {
    this.allowCoiling = allowCoiling;
    this.snake.setAllowCoiling(allowCoiling);
    if (this.snake2) {
      this.snake2.setAllowCoiling(allowCoiling);
    }
    logDebugEvent("Allow coiling setting updated", { allowCoiling });
  }

  setTheme(isDarkTheme: boolean) {
    this.isDarkTheme = isDarkTheme;
    logDebugEvent("Theme updated in game engine", { isDarkTheme });
  }

  setLives(lives: number) {
    this.lives = lives;
    this.lives2 = lives;
    logDebugEvent("Lives updated", { lives });
  }

  setPaused(isPaused: boolean) {
    if (this.isPaused === isPaused) return;

    this.isPaused = isPaused;
    logDebugEvent("Game pause state changed", { isPaused });

    if (isPaused) {
      this.stopGameLoop();
    } else {
      this.accumulator = 0;
      this.lastFrameTime = performance.now();
      this.startGameLoop();
    }
  }

  initialize() {
    logDebugEvent("Game initialization started");

    this.snake = new Snake(this.gridSize, undefined, "green", "#00ff00", this.noBoundaries, this.allowCoiling);

    if (this.isMultiplayer) {
      this.snake2 = new Snake(
        this.gridSize,
        { x: Math.floor(this.gridSize / 2), y: Math.floor(this.gridSize / 2) + 5 },
        "purple",
        "#8800ff",
        this.noBoundaries,
        this.allowCoiling,
      );
    } else {
      this.snake2 = undefined;
    }

    this.fruitManager = new FruitManager(this.gridSize);
    this.score = 0;
    this.score2 = 0;
    this.respawnTimer = 0;
    this.respawnTimer2 = 0;
    this.respawnCountdown = 0;
    this.respawnCountdown2 = 0;
    this.isPaused = false;
    this.accumulator = 0;
    this.lastFrameTime = 0;

    this.stopGameLoop();

    const initialSnakeSegments = [...this.snake.segments, ...(this.snake2?.segments || [])];
    this.fruitManager.addFruit(initialSnakeSegments);
    this.fruitManager.addFruit(initialSnakeSegments);

    this.onScoreChange(this.score, this.isMultiplayer ? this.score2 : undefined);
    this.onLivesChange(this.lives, this.isMultiplayer ? this.lives2 : undefined);

    this.startGameLoop();

    logDebugEvent("Game initialization completed", {
      snakeLength: this.snake.segments.length,
      fruitCount: this.fruitManager.fruits.length,
      speed: this.speed,
    });
  }

  startGameLoop() {
    if (this.animationFrameId !== null || this.isPaused) return;

    this.lastFrameTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.boundGameLoop);
    logDebugEvent("Game loop started");
  }

  stopGameLoop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
      logDebugEvent("Game loop stopped");
    }

    if (this.respawnTimer) {
      clearInterval(this.respawnTimer);
      this.respawnTimer = 0;
    }

    if (this.respawnTimer2) {
      clearInterval(this.respawnTimer2);
      this.respawnTimer2 = 0;
    }
  }

  private boundGameLoop = this.gameLoop.bind(this);

  gameLoop(timestamp: number) {
    if (this.isPaused || this.animationFrameId === null) {
      if (!this.isPaused) this.animationFrameId = null;
      return;
    }

    const deltaTime = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;

    this.accumulator += Math.min(deltaTime, 500);

    while (this.accumulator >= this.speed) {
      if (!this.isPaused) {
        this.gameStep();
      }
      this.accumulator -= this.speed;

      if (this.animationFrameId === null) break;
    }

    if (this.animationFrameId !== null) {
      this.onGameRender();
      this.animationFrameId = requestAnimationFrame(this.boundGameLoop);
    }
  }

  findSafeRespawnPosition(otherSnakeSegments: Position[] = []): Position {
    const minDistance = 5;
    let attempts = 0;
    const maxAttempts = 50;
    let position: Position;

    do {
      position = {
        x: Math.floor(Math.random() * (this.gridSize - 4)) + 2,
        y: Math.floor(Math.random() * (this.gridSize - 4)) + 2,
      };

      const isSafe = otherSnakeSegments.every((segment) => {
        const dx = Math.abs(segment.x - position.x);
        const dy = Math.abs(segment.y - position.y);
        return Math.sqrt(dx * dx + dy * dy) > minDistance;
      });

      if (isSafe) {
        logDebugEvent("Found safe respawn position", { position, attempts });
        return position;
      }

      attempts++;
    } while (attempts < maxAttempts);

    logDebugEvent(`Could not find safe respawn position after ${maxAttempts} attempts`);
    return {
      x: Math.floor(Math.random() * this.gridSize),
      y: Math.floor(Math.random() * this.gridSize),
    };
  }

  respawnSnake(isSnake2 = false) {
    logDebugEvent("Respawning snake", { isSnake2 });

    const otherSnakeSegments = isSnake2
      ? (this.snake && this.respawnCountdown === 0 ? this.snake.segments : [])
      : (this.snake2 && this.respawnCountdown2 === 0 ? this.snake2.segments : []);

    const safePosition = this.findSafeRespawnPosition(otherSnakeSegments);

    if (isSnake2) {
      if (!this.isMultiplayer) {
        logDebugEvent("Attempted to respawn snake 2 in single player mode", {}, "warn");
        return;
      }
      this.snake2 = new Snake(this.gridSize, safePosition, "purple", "#8800ff", this.noBoundaries, this.allowCoiling);
      this.respawnCountdown2 = 0;
      this.respawnTimer2 = 0;

      this.onSnakeRespawn(this.snake2, true);
    } else {
      this.snake = new Snake(this.gridSize, safePosition, "green", "#00ff00", this.noBoundaries, this.allowCoiling);
      this.respawnCountdown = 0;
      this.respawnTimer = 0;

      this.onSnakeRespawn(this.snake, false);
    }

    if (!this.isPaused && this.animationFrameId === null) {
      this.startGameLoop();
    }
  }

  startRespawnCountdown(isSnake2 = false) {
    if ((isSnake2 && this.respawnCountdown2 > 0) || (!isSnake2 && this.respawnCountdown > 0)) {
      logDebugEvent("Respawn countdown already active", { isSnake2 });
      return;
    }

    logDebugEvent("Starting respawn countdown", { isSnake2 });

    if (this.renderer) {
      const snakeInstance = isSnake2 ? this.snake2 : this.snake;
      if (snakeInstance) {
        this.renderer.startDeathAnimation(snakeInstance.segments, isSnake2);
      }
    }

    if (isSnake2) {
      if (!this.snake2) {
        logDebugEvent("Attempted respawn countdown for non-existent snake 2", {}, "error");
        return;
      }
      this.lives2--;
      this.onLivesChange(this.lives, this.lives2);
      logDebugEvent("Snake 2 lost a life", { remainingLives: this.lives2 });

      if ((this.allowCoiling || this.noBoundaries) && this.lives2 <= 0) {
        this.endGame();
        return;
      }

      this.respawnCountdown2 = RESPAWN_TIME;

      if (this.respawnTimer2) clearInterval(this.respawnTimer2);

      this.respawnTimer2 = window.setInterval(() => {
        this.respawnCountdown2--;
        logDebugEvent("Respawn countdown tick (snake 2)", { countdown: this.respawnCountdown2 });

        if (this.respawnCountdown2 <= 0) {
          clearInterval(this.respawnTimer2);
          this.respawnTimer2 = 0;
          this.respawnSnake(true);
        }
      }, 1000);
    } else {
      if (!this.snake) {
        logDebugEvent("Attempted respawn countdown for non-existent snake 1", {}, "error");
        return;
      }
      this.lives--;
      this.onLivesChange(this.lives, this.isMultiplayer ? this.lives2 : undefined);
      logDebugEvent("Snake 1 lost a life", { remainingLives: this.lives });

      if (this.lives <= 0) {
        this.endGame();
        return;
      }

      this.respawnCountdown = RESPAWN_TIME;

      if (this.respawnTimer) clearInterval(this.respawnTimer);

      this.respawnTimer = window.setInterval(() => {
        this.respawnCountdown--;
        logDebugEvent("Respawn countdown tick (snake 1)", { countdown: this.respawnCountdown });

        if (this.respawnCountdown <= 0) {
          clearInterval(this.respawnTimer);
          this.respawnTimer = 0;
          this.respawnSnake(false);
        }
      }, 1000);
    }
  }

  gameStep() {
    const startTime = performance.now();

    let snake1Moved = false;
    let snake2Moved = false;

    if (this.snake && this.respawnCountdown === 0) {
      const newHead = this.snake.move();
      snake1Moved = true;

      if (this.snake.collidesWithWall()) {
        logDebugEvent("Snake 1 collided with wall");
        this.handleSnakeDeath(false);
        return;
      }

      if (this.snake.collidesWithSelf()) {
        logDebugEvent("Snake 1 collided with self");
        this.handleSnakeDeath(false);
        return;
      }

      const eatenFruitIndex = this.fruitManager.checkFruitEaten(newHead);
      if (eatenFruitIndex >= 0) {
        this.fruitManager.removeFruit(eatenFruitIndex);
        logDebugEvent("Snake 1 ate fruit", { fruitIndex: eatenFruitIndex });

        this.score += 10;
        this.onScoreChange(this.score, this.isMultiplayer ? this.score2 : undefined);

        if (this.speed > MAX_SPEED) {
          this.speed = Math.max(MAX_SPEED, this.speed - SPEED_INCREMENT);
          logDebugEvent("Game speed increased", { newSpeed: this.speed });
        }

        const allSegments = [...this.snake.segments, ...(this.snake2 && this.respawnCountdown2 === 0 ? this.snake2.segments : [])];
        this.fruitManager.addFruit(allSegments);

        if (this.renderer) this.renderer.notifySnakeGrowing(false);
      } else {
        this.snake.removeTail();
      }
    }

    if (this.isMultiplayer && this.snake2 && this.respawnCountdown2 === 0) {
      const newHead2 = this.snake2.move();
      snake2Moved = true;

      if (this.snake2.collidesWithWall()) {
        logDebugEvent("Snake 2 collided with wall");
        this.handleSnakeDeath(true);
        return;
      }

      if (this.snake2.collidesWithSelf()) {
        logDebugEvent("Snake 2 collided with self");
        this.handleSnakeDeath(true);
        return;
      }

      const eatenFruitIndex2 = this.fruitManager.checkFruitEaten(newHead2);
      if (eatenFruitIndex2 >= 0) {
        this.fruitManager.removeFruit(eatenFruitIndex2);
        logDebugEvent("Snake 2 ate fruit", { fruitIndex: eatenFruitIndex2 });

        this.score2 += 10;
        this.onScoreChange(this.score, this.score2);

        if (this.speed > MAX_SPEED) {
          this.speed = Math.max(MAX_SPEED, this.speed - SPEED_INCREMENT);
          logDebugEvent("Game speed increased", { newSpeed: this.speed });
        }

        const allSegments = [...(this.snake && this.respawnCountdown === 0 ? this.snake.segments : []), ...this.snake2.segments];
        this.fruitManager.addFruit(allSegments);

        if (this.renderer) this.renderer.notifySnakeGrowing(true);
      } else {
        this.snake2.removeTail();
      }
    }

    if (this.isMultiplayer && this.snake && this.snake2 && snake1Moved && snake2Moved && this.respawnCountdown === 0 && this.respawnCountdown2 === 0) {
      if (this.snake.collidesWithSnake(this.snake2)) {
        logDebugEvent("Snake 1 collided with Snake 2");
        this.handleSnakeDeath(false);
        return;
      }
      if (this.snake2.collidesWithSnake(this.snake)) {
        logDebugEvent("Snake 2 collided with Snake 1");
        this.handleSnakeDeath(true);
        return;
      }
    }

    const gameStepTime = performance.now() - startTime;
    recordGameStepTime(gameStepTime);
    if (gameStepTime > 16) {
      logDebugEvent("Game step took longer than 16ms", { gameStepTime });
    }
    this.lastGameStepTime = gameStepTime;
  }

  handleSnakeDeath(isSnake2: boolean) {
    const snakeId = isSnake2 ? 2 : 1;
    logDebugEvent(`Handling death for Snake ${snakeId}`);
    this.startRespawnCountdown(isSnake2);
  }

  endGame() {
    if (this.animationFrameId === null && !this.isPaused) return;

    logDebugEvent("Game over");
    this.stopGameLoop();
    this.onGameOver();
  }

  applySettings(settings: {
    gridSize?: number;
    isMultiplayer?: boolean;
    noBoundaries?: boolean;
    allowCoiling?: boolean;
    isDarkTheme?: boolean;
  }) {
    logDebugEvent("Applying settings", settings);
    let needsReInitialize = false;

    if (settings.isDarkTheme !== undefined && settings.isDarkTheme !== this.isDarkTheme) {
      this.setTheme(settings.isDarkTheme);
    }

    if (settings.gridSize !== undefined && settings.gridSize !== this.gridSize) {
      logDebugEvent("Grid size change requires re-initialization.");
      needsReInitialize = true;
      this.gridSize = settings.gridSize;
    }

    if (settings.isMultiplayer !== undefined && settings.isMultiplayer !== this.isMultiplayer) {
      logDebugEvent("Multiplayer mode change requires re-initialization.");
      needsReInitialize = true;
      this.isMultiplayer = settings.isMultiplayer;
    }

    if (settings.noBoundaries !== undefined && settings.noBoundaries !== this.noBoundaries) {
      this.setNoBoundaries(settings.noBoundaries);
    }

    if (settings.allowCoiling !== undefined && settings.allowCoiling !== this.allowCoiling) {
      this.setAllowCoiling(settings.allowCoiling);
    }

    if (needsReInitialize) {
      logDebugEvent("Settings require game restart to take full effect.", {}, "warn");
    }

    this.onGameRender();
  }

  getState(): GameState {
    return {
      snake: this.snake ? this.snake.segments : [],
      direction: this.snake ? this.snake.direction : { dx: 1, dy: 0 },
      nextDirection: this.snake ? this.snake.nextDirection : { dx: 1, dy: 0 },
      snakeColor: this.snake ? this.snake.color : "green",
      snakeHeadColor: this.snake ? this.snake.headColor : "#00ff00",
      respawning: this.respawnCountdown,

      snake2: this.snake2 ? this.snake2.segments : undefined,
      direction2: this.snake2 ? this.snake2.direction : undefined,
      nextDirection2: this.snake2 ? this.snake2.nextDirection : undefined,
      snake2Color: this.snake2 ? this.snake2.color : undefined,
      snake2HeadColor: this.snake2 ? this.snake2.headColor : undefined,
      respawning2: this.respawnCountdown2,

      fruits: this.fruitManager.fruits,
      speed: this.speed,
      score: this.score,
      score2: this.score2,
      lives: this.lives,
      lives2: this.lives2,
      isMultiplayer: this.isMultiplayer,
      noBoundaries: this.noBoundaries,
      allowCoiling: this.allowCoiling,
      isDarkTheme: this.isDarkTheme,
      isPaused: this.isPaused,
      isGameLoopActive: this.animationFrameId !== null,
      gridSize: this.gridSize,
    };
  }
}
