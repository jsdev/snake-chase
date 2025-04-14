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

    // --- This is the crucial part ---
    if (this.animationFrameId !== null) { // Check if loop is still active
      // RENDER the current state AFTER game steps and animation progress updates
      this.onGameRender(); // This should call renderer.render(this.getState())

      // Request the next frame for the game loop
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
      if (this.lives2 <= 0) {
        logDebugEvent("Snake 2 is out of lives, not respawning");
        return;
      }
      if (!this.isMultiplayer) {
        logDebugEvent("Attempted to respawn snake 2 in single player mode", {}, "warn");
        return;
      }
      this.snake2 = new Snake(this.gridSize, safePosition, "purple", "#8800ff", this.noBoundaries, this.allowCoiling);
      this.respawnCountdown2 = 0;
      this.respawnTimer2 = 0;

      this.onSnakeRespawn(this.snake2, true);
    } else {
      if (this.lives <= 0) {
        logDebugEvent("Snake 1 is out of lives, not respawning");
        return;
      }
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
    // Prevent starting if already respawning (important to avoid overlapping animations/logic)
    if ((isSnake2 && this.respawnCountdown2 > 0) || (!isSnake2 && this.respawnCountdown > 0)) {
      logDebugEvent("Respawn countdown already active, skipping new death sequence.", { isSnake2 });
      return;
    }

    logDebugEvent("Starting respawn/death sequence", { isSnake2 });

    const snakeInstance = isSnake2 ? this.snake2 : this.snake;
    let livesRemaining: number;

    // --- Trigger Animation FIRST ---
    // Pass the current segments to the renderer.
    // The renderer must now handle the animation lifecycle internally.
    if (this.renderer && snakeInstance) {
         logDebugEvent(`Attempting to start death animation for snake ${isSnake2 ? 2 : 1}`, { segments: snakeInstance.segments?.length ?? 0 });
         // Pass a copy of segments in case the original array is modified
         this.renderer.startDeathAnimation([...snakeInstance.segments], isSnake2);
    } else {
         logDebugEvent(`Cannot start death animation: Renderer or Snake instance ${isSnake2 ? 2 : 1} is missing/invalid.`, {}, "warn");
    }

    // --- Now handle lives and game state ---
    if (isSnake2) {
      if (!this.snake2) { logDebugEvent("Snake 2 instance missing", {}, "error"); return; }
      this.lives2--;
      livesRemaining = this.lives2;
      this.onLivesChange(this.lives, this.lives2);
      logDebugEvent("Snake 2 lost a life", { remainingLives: livesRemaining });

      if (livesRemaining <= 0) {
        logDebugEvent("Snake 2 is out of lives.");
        if (this.lives <= 0) {
           logDebugEvent("Both players are out of lives. Ending game.");
           // endGame() might stop the game loop needed for rendering frames.
           // If the renderer animation relies on requestAnimationFrame,
           // consider a *very* short delay ONLY IF animation gets cut off.
           // Best if renderer animation is self-contained or uses its own timer.
           this.endGame();
        } else {
           logDebugEvent("Snake 1 still has lives. Game continues. Snake 2 will not respawn.");
        }
        // Return AFTER potentially calling endGame
        return; // Stop: No respawn timer needed
      }
      // If lives > 0, proceed to set up respawn timer...
      this.respawnCountdown2 = RESPAWN_TIME;
      if (this.respawnTimer2) clearInterval(this.respawnTimer2);
      this.respawnTimer2 = window.setInterval(() => {
        this.respawnCountdown2--;
        if (this.respawnCountdown2 <= 0) {
          clearInterval(this.respawnTimer2);
          this.respawnTimer2 = 0;
          if (this.lives2 > 0) this.respawnSnake(true); // Check lives again just in case
        }
      }, 1000);

    } else { // Snake 1
      if (!this.snake) { logDebugEvent("Snake 1 instance missing", {}, "error"); return; }
      this.lives--;
      livesRemaining = this.lives;
      this.onLivesChange(this.lives, this.isMultiplayer ? this.lives2 : undefined);
      logDebugEvent("Snake 1 lost a life", { remainingLives: livesRemaining });

      if (livesRemaining <= 0) {
        logDebugEvent("Snake 1 is out of lives.");
        if (!this.isMultiplayer || (this.isMultiplayer && this.lives2 <= 0)) {
           logDebugEvent("All players out/single player over. Ending game.");
           // See comment above regarding potential endGame() delay
           this.endGame();
        } else {
           logDebugEvent("Snake 2 still has lives. Game continues. Snake 1 will not respawn.");
        }
         // Return AFTER potentially calling endGame
        return; // Stop: No respawn timer needed
      }
      // If lives > 0, proceed to set up respawn timer...
      this.respawnCountdown = RESPAWN_TIME;
      if (this.respawnTimer) clearInterval(this.respawnTimer);
      this.respawnTimer = window.setInterval(() => {
        this.respawnCountdown--;
        if (this.respawnCountdown <= 0) {
          clearInterval(this.respawnTimer);
          this.respawnTimer = 0;
          if (this.lives > 0) this.respawnSnake(false); // Check lives again
        }
      }, 1000);
    }
  }

  gameStep() {
    const startTime = performance.now();

    let snake1Moved = false;
    let snake2Moved = false;

    // --- Snake 1 Logic ---
    // ADDED: Check lives > 0 before processing snake 1
    if (this.snake && this.respawnCountdown === 0 && this.lives > 0) {
      const newHead = this.snake.move();
      snake1Moved = true; // Mark as moved only if alive and active

      // Check wall collision
      if (this.snake.collidesWithWall()) {
        logDebugEvent("Snake 1 collided with wall");
        this.handleSnakeDeath(false);
        // If snake 1 is now out of lives OR respawning, end its turn for this step
        if (this.lives <= 0 || this.respawnCountdown > 0) {
           // Optionally add return here if no other logic should run this step.
           // return; 
           snake1Moved = false; // Ensure it's not considered moved for subsequent checks
        }
      }

      // Check self collision ONLY IF it didn't die from wall collision this step
      if (snake1Moved && this.snake.collidesWithSelf()) {
        logDebugEvent("Snake 1 collided with self");
        this.handleSnakeDeath(false);
        // If snake 1 is now out of lives OR respawning, end its turn for this step
        if (this.lives <= 0 || this.respawnCountdown > 0) {
            // return; 
            snake1Moved = false; // Ensure it's not considered moved for subsequent checks
        }
      }

      // Check fruit eating ONLY IF snake is still alive and considered moved this step
      if (snake1Moved) {
          const eatenFruitIndex = this.fruitManager.checkFruitEaten(newHead);
          if (eatenFruitIndex >= 0) {
            this.fruitManager.removeFruit(eatenFruitIndex);
            logDebugEvent("Snake 1 ate fruit", { fruitIndex: eatenFruitIndex });
            this.score += 10;
            this.onScoreChange(this.score, this.isMultiplayer ? this.score2 : undefined);
            if (this.speed > MAX_SPEED) {
              this.speed = Math.max(MAX_SPEED, this.speed - SPEED_INCREMENT);
            }
            const allSegments = [...this.snake.segments, ...(this.snake2 && this.respawnCountdown2 === 0 && this.lives2 > 0 ? this.snake2.segments : [])];
            this.fruitManager.addFruit(allSegments);
            if (this.renderer) this.renderer.notifySnakeGrowing(false);
          } else {
            this.snake.removeTail();
          }
      }
    } // End Snake 1 Logic Block (if lives > 0)

    // --- Snake 2 Logic ---
    // ADDED: Check lives2 > 0 before processing snake 2
    if (this.isMultiplayer && this.snake2 && this.respawnCountdown2 === 0 && this.lives2 > 0) {
      const newHead2 = this.snake2.move();
      snake2Moved = true; // Mark as moved only if alive and active

      // Check wall collision
      if (this.snake2.collidesWithWall()) {
        logDebugEvent("Snake 2 collided with wall");
        this.handleSnakeDeath(true);
        if (this.lives2 <= 0 || this.respawnCountdown2 > 0) {
             // return; 
             snake2Moved = false;
        }
      }

      // Check self collision ONLY IF it didn't die from wall collision this step
      if (snake2Moved && this.snake2.collidesWithSelf()) {
        logDebugEvent("Snake 2 collided with self");
        this.handleSnakeDeath(true);
        if (this.lives2 <= 0 || this.respawnCountdown2 > 0) {
             // return; 
             snake2Moved = false;
        }
      }

      // Check fruit eating ONLY IF snake is still alive and considered moved this step
      if (snake2Moved) {
          const eatenFruitIndex2 = this.fruitManager.checkFruitEaten(newHead2);
          if (eatenFruitIndex2 >= 0) {
             this.fruitManager.removeFruit(eatenFruitIndex2);
             logDebugEvent("Snake 2 ate fruit", { fruitIndex: eatenFruitIndex2 });
             this.score2 += 10;
             this.onScoreChange(this.score, this.score2);
             if (this.speed > MAX_SPEED) {
               this.speed = Math.max(MAX_SPEED, this.speed - SPEED_INCREMENT);
             }
             const allSegments = [...(this.snake && this.respawnCountdown === 0 && this.lives > 0 ? this.snake.segments : []), ...this.snake2.segments];
             this.fruitManager.addFruit(allSegments);
             if (this.renderer) this.renderer.notifySnakeGrowing(true);
          } else {
            this.snake2.removeTail();
          }
      }
    } // End Snake 2 Logic Block (if lives2 > 0)


    // --- Snake vs Snake Collision ---
    // ADDED: Check both lives > 0 and moved status before checking collision
    if (this.isMultiplayer &&
        this.snake && this.lives > 0 && this.respawnCountdown === 0 && snake1Moved &&
        this.snake2 && this.lives2 > 0 && this.respawnCountdown2 === 0 && snake2Moved)
    {
        // Check Snake 1 hitting Snake 2's body/head
        if (this.snake.collidesWithSnake(this.snake2)) {
            logDebugEvent("Snake 1 collided with Snake 2");
            this.handleSnakeDeath(false); // Handle death for snake 1
            // No return needed here, allow checking if snake 2 also collided in the same step (head-on)
        }
        // Check Snake 2 hitting Snake 1's body/head
        // Important: Check if snake 1 is *still* alive before checking if snake 2 hit it
        if (this.snake && this.lives > 0 && this.respawnCountdown === 0 &&
            this.snake2.collidesWithSnake(this.snake)) {
            logDebugEvent("Snake 2 collided with Snake 1");
            // Make sure snake 1 didn't just die from the previous check
            // If snake 1 died above, this collision might be irrelevant or need different handling
            // Let's assume for now that if Snake 1 caused the collision, Snake 2 doesn't die simultaneously
            // Only handle death for Snake 2 if Snake 1 didn't die from collision in the same step
            if (! (this.lives <= 0 || this.respawnCountdown > 0) ) { 
                this.handleSnakeDeath(true); // Handle death for snake 2
            }
        }
    }


    // --- Timing logic ---
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
    // Prevent multiple calls if already stopped or paused
    if (this.animationFrameId === null && !this.isPaused) {
        logDebugEvent("endGame called but game loop already stopped.");
        return;
    }

    // Check if the conditions are actually met (for debugging)
    const isGameOverConditionMet = !this.isMultiplayer ? this.lives <= 0 : (this.lives <= 0 && this.lives2 <= 0);
    logDebugEvent("End Game function called.", {
        lives: this.lives,
        lives2: this.lives2,
        isMultiplayer: this.isMultiplayer,
        isGameOverConditionMet: isGameOverConditionMet // Log if conditions match expectation
    });

    // If this alert shows, the function is being called.
    alert("Game Over! You have lost all your lives.");

    // --- Simplified Logic ---
    // Trust that startRespawnCountdown called this correctly.
    // Directly stop the loop and trigger the game over callback.
    logDebugEvent("Game over actions triggered: Stopping loop and calling onGameOver.");
    this.stopGameLoop();
    this.onGameOver();

    // --- REMOVED the complex inner if condition ---
    /*
    if (
      !this.isMultiplayer ||
      (this.lives2 <= 0 && this.lives <= 0) ||
      (this.allowCoiling && this.noBoundaries) // This condition might belong elsewhere
    ) {
      logDebugEvent("Game over actions triggered."); // Log message concept kept
      this.stopGameLoop();
      this.onGameOver();
    } else {
       logDebugEvent("endGame called, but inner condition failed to stop game.");
    }
    */
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
