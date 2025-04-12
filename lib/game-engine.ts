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
  // gameLoop: number | null = null; // Removed this unused/misused property
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
    // Consider what happens if isMultiplayer becomes false - should snake2 be removed?
    // else if (!isMultiplayer && this.snake2) {
    //   this.snake2 = undefined;
    //   logDebugEvent("Second snake removed");
    // }
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
    // Typically called before initialize()
    this.lives = lives;
    this.lives2 = lives;
    logDebugEvent("Lives updated", { lives });
  }

  setPaused(isPaused: boolean) {
    if (this.isPaused === isPaused) return; // No change

    this.isPaused = isPaused;
    logDebugEvent("Game pause state changed", { isPaused });

    if (isPaused) {
      this.stopGameLoop(); // Stops the requestAnimationFrame loop
    } else {
      // Don't restart if game is over (implicitly handled by game over state)
      // Reset accumulator and last frame time to avoid jump after pause
      this.accumulator = 0;
      this.lastFrameTime = performance.now();
      this.startGameLoop(); // Restarts the requestAnimationFrame loop
    }
  }

  initialize() {
    logDebugEvent("Game initialization started");

    // Reset game state
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
    // Lives are set externally via constructor or setLives, don't reset here unless intended
    // this.lives = DEFAULT_LIVES; // Re-enable if needed on initialize
    // this.lives2 = DEFAULT_LIVES; // Re-enable if needed on initialize
    this.respawnTimer = 0;
    this.respawnTimer2 = 0;
    this.respawnCountdown = 0;
    this.respawnCountdown2 = 0;
    this.isPaused = false;
    this.accumulator = 0;
    this.lastFrameTime = 0;

    // Clear any existing game loop and timers
    this.stopGameLoop();

    // Add initial fruits (ensure they don't overlap snakes)
    const initialSnakeSegments = [...this.snake.segments, ...(this.snake2?.segments || [])];
    this.fruitManager.addFruit(initialSnakeSegments);
    this.fruitManager.addFruit(initialSnakeSegments);

    // Update score and lives display
    this.onScoreChange(this.score, this.isMultiplayer ? this.score2 : undefined);
    this.onLivesChange(this.lives, this.isMultiplayer ? this.lives2 : undefined);

    // Start game loop using requestAnimationFrame
    this.startGameLoop();

    logDebugEvent("Game initialization completed", {
      snakeLength: this.snake.segments.length,
      fruitCount: this.fruitManager.fruits.length,
      speed: this.speed,
    });
  }

  // Start the game loop using requestAnimationFrame
  startGameLoop() {
    // Don't start if already running or paused
    if (this.animationFrameId !== null || this.isPaused) return;

    this.lastFrameTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.boundGameLoop); // Use bound reference
    logDebugEvent("Game loop started");
  }

  // Stop the game loop
  stopGameLoop() {
    // Stop the animation frame loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
      logDebugEvent("Game loop stopped");
    }

    // Stop the respawn countdown timers
    if (this.respawnTimer) {
      clearInterval(this.respawnTimer);
      this.respawnTimer = 0;
    }

    if (this.respawnTimer2) {
      clearInterval(this.respawnTimer2);
      this.respawnTimer2 = 0;
    }
  }

  // Store the bound version of gameLoop to avoid creating new function objects repeatedly
  private boundGameLoop = this.gameLoop.bind(this);

  // Game loop using requestAnimationFrame
  gameLoop(timestamp: number) {
    // If somehow called while paused or stopped, exit early
    if (this.isPaused || this.animationFrameId === null) {
        // If it was stopped externally (e.g. game over), ensure animationFrameId is null
        if (!this.isPaused) this.animationFrameId = null;
        return;
    }

    // Calculate delta time
    const deltaTime = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;

    // Add to accumulator - Clamp deltaTime to avoid large jumps if tab was inactive
    this.accumulator += Math.min(deltaTime, 500); // Max delta 500ms

    // Update game state based on fixed time step (speed)
    while (this.accumulator >= this.speed) {
      if (!this.isPaused) { // Double check pause state before stepping
          this.gameStep();
      }
      this.accumulator -= this.speed;

      // If game ended during gameStep, break the inner loop
      if (this.animationFrameId === null) break;
    }

    // Render the game if the loop is still active
    if (this.animationFrameId !== null) {
        this.onGameRender();
        // Schedule next frame
        this.animationFrameId = requestAnimationFrame(this.boundGameLoop);
    }
  }

  // Find a safe position for respawning away from other snakes
  findSafeRespawnPosition(otherSnakeSegments: Position[] = []): Position {
    const minDistance = 5; // Minimum distance from other snake segments
    let attempts = 0;
    const maxAttempts = 50;
    let position: Position;

    do {
      position = {
        x: Math.floor(Math.random() * (this.gridSize - 4)) + 2, // Keep away from edges
        y: Math.floor(Math.random() * (this.gridSize - 4)) + 2,
      };

      // Check if position is far enough from all other snake segments
      const isSafe = otherSnakeSegments.every((segment) => {
        const dx = Math.abs(segment.x - position.x);
        const dy = Math.abs(segment.y - position.y);
        // Check Manhattan distance for simplicity, or Euclidean if preferred
        // return dx + dy > minDistance; // Manhattan
        return Math.sqrt(dx*dx + dy*dy) > minDistance; // Euclidean
      });

      if (isSafe) {
        logDebugEvent("Found safe respawn position", { position, attempts });
        return position;
      }

      attempts++;
    } while (attempts < maxAttempts); // Limit attempts to avoid infinite loop

    // If we couldn't find a safe position after many attempts, return a random one (less ideal)
    logDebugEvent(`Could not find safe respawn position after ${maxAttempts} attempts`);
    return {
      x: Math.floor(Math.random() * this.gridSize),
      y: Math.floor(Math.random() * this.gridSize),
    };
  }

  // Respawn a snake
  respawnSnake(isSnake2 = false) {
    logDebugEvent("Respawning snake", { isSnake2 });

    // Determine segments of the *other* snake to avoid spawning on top of it
    const otherSnakeSegments = isSnake2
        ? (this.snake && this.respawnCountdown === 0 ? this.snake.segments : []) // Only consider active snake 1
        : (this.snake2 && this.respawnCountdown2 === 0 ? this.snake2.segments : []); // Only consider active snake 2

    const safePosition = this.findSafeRespawnPosition(otherSnakeSegments);

    if (isSnake2) {
      // Check if multiplayer is still active, otherwise this shouldn't be called
      if (!this.isMultiplayer) {
          logDebugEvent("Attempted to respawn snake 2 in single player mode", {}, "warn");
          return;
      }
      this.snake2 = new Snake(this.gridSize, safePosition, "purple", "#8800ff", this.noBoundaries, this.allowCoiling);
      this.respawnCountdown2 = 0; // Reset countdown
      // this.respawnTimer2 should have already been cleared by its interval callback
      this.respawnTimer2 = 0;

      // Notify about the new snake instance
      this.onSnakeRespawn(this.snake2, true);
    } else {
      this.snake = new Snake(this.gridSize, safePosition, "green", "#00ff00", this.noBoundaries, this.allowCoiling);
      this.respawnCountdown = 0; // Reset countdown
       // this.respawnTimer should have already been cleared by its interval callback
      this.respawnTimer = 0;

      // Notify about the new snake instance
      this.onSnakeRespawn(this.snake, false);
    }

    // Ensure game continues if not paused
    if (!this.isPaused && this.animationFrameId === null) {
        this.startGameLoop();
    }
  }

  // Start respawn countdown
  startRespawnCountdown(isSnake2 = false) {
    // Prevent starting countdown if already respawning
    if ((isSnake2 && this.respawnCountdown2 > 0) || (!isSnake2 && this.respawnCountdown > 0)) {
      logDebugEvent("Respawn countdown already active", { isSnake2 });
      return;
    }

    logDebugEvent("Starting respawn countdown", { isSnake2 });

    // Start death animation if renderer is available
    if (this.renderer) {
      const snakeInstance = isSnake2 ? this.snake2 : this.snake;
      if (snakeInstance) { // Check if snake exists before accessing segments
        this.renderer.startDeathAnimation(snakeInstance.segments, isSnake2);
      }
    }

    if (isSnake2) {
        // Ensure snake2 exists before proceeding
        if (!this.snake2) {
            logDebugEvent("Attempted respawn countdown for non-existent snake 2", {}, "error");
            return;
        }
      // Decrement lives first
      this.lives2--;
      this.onLivesChange(this.lives, this.lives2);
      logDebugEvent("Snake 2 lost a life", { remainingLives: this.lives2 });


      // Check if game over (based on multiplayer rules - here assuming game ends if one player is out)
      if (this.lives2 <= 0) {
        this.endGame();
        return;
      }

      this.respawnCountdown2 = RESPAWN_TIME;

      // Clear any previous interval just in case (shouldn't be needed)
      if (this.respawnTimer2) clearInterval(this.respawnTimer2);

      // Assign interval ID correctly
      this.respawnTimer2 = window.setInterval(() => {
        this.respawnCountdown2--;
        logDebugEvent("Respawn countdown tick (snake 2)", { countdown: this.respawnCountdown2 });

        if (this.respawnCountdown2 <= 0) {
          clearInterval(this.respawnTimer2);
          this.respawnTimer2 = 0; // Clear the stored ID
          this.respawnSnake(true);
        }

        // Render to update countdown display (optional, depends on UI)
        // this.onGameRender(); // Might be too frequent, render loop handles it
      }, 1000);
    } else {
       // Ensure snake1 exists before proceeding (should always exist unless mid-initialization issue)
       if (!this.snake) {
        logDebugEvent("Attempted respawn countdown for non-existent snake 1", {}, "error");
        return;
       }
      // Decrement lives first
      this.lives--;
      this.onLivesChange(this.lives, this.isMultiplayer ? this.lives2 : undefined);
      logDebugEvent("Snake 1 lost a life", { remainingLives: this.lives });


      // Check if game over
      if (this.lives <= 0) {
        this.endGame();
        return;
      }

      this.respawnCountdown = RESPAWN_TIME;

      // Clear any previous interval just in case
      if (this.respawnTimer) clearInterval(this.respawnTimer);

      // Assign interval ID correctly
      this.respawnTimer = window.setInterval(() => {
        this.respawnCountdown--;
        logDebugEvent("Respawn countdown tick (snake 1)", { countdown: this.respawnCountdown });

        if (this.respawnCountdown <= 0) {
          clearInterval(this.respawnTimer);
          this.respawnTimer = 0; // Clear the stored ID
          this.respawnSnake(false);
        }

        // Render to update countdown display (optional)
        // this.onGameRender();
      }, 1000);
    }
  }

  // Update the gameStep method to notify the renderer when a snake grows
  gameStep() {
    const startTime = performance.now();

    // Skip if paused (redundant check, gameLoop handles this, but safe)
    // if (this.isPaused) return;

    let snake1Moved = false;
    let snake2Moved = false;

    // --- Snake 1 Logic ---
    // Only process if snake 1 exists and is not respawning
    if (this.snake && this.respawnCountdown === 0) {
      const newHead = this.snake.move();
      snake1Moved = true;

      // Check for wall collision
      if (this.snake.collidesWithWall()) {
        logDebugEvent("Snake 1 collided with wall");
        this.handleSnakeDeath(false); // Use handler function
        return; // Stop step processing for this snake
      }

      // Check for self collision
      if (this.snake.collidesWithSelf()) {
        logDebugEvent("Snake 1 collided with self");
        this.handleSnakeDeath(false);
        return;
      }

      // Check for fruit collision
      const eatenFruitIndex = this.fruitManager.checkFruitEaten(newHead);
      if (eatenFruitIndex >= 0) {
        this.fruitManager.removeFruit(eatenFruitIndex);
        logDebugEvent("Snake 1 ate fruit", { fruitIndex: eatenFruitIndex });

        this.score += 10;
        this.onScoreChange(this.score, this.isMultiplayer ? this.score2 : undefined);

        if (this.speed > MAX_SPEED) {
          this.speed = Math.max(MAX_SPEED, this.speed - SPEED_INCREMENT); // Prevent going below MAX_SPEED
          logDebugEvent("Game speed increased", { newSpeed: this.speed });
        }

        // Add new fruit (needs all current snake segments)
        const allSegments = [...this.snake.segments, ...(this.snake2 && this.respawnCountdown2 === 0 ? this.snake2.segments : [])];
        this.fruitManager.addFruit(allSegments);

        if (this.renderer) this.renderer.notifySnakeGrowing(false);
        // Snake grows implicitly by not calling removeTail()
      } else {
        this.snake.removeTail(); // Remove tail if no fruit eaten
      }
    }

    // --- Snake 2 Logic ---
    // Only process if multiplayer, snake 2 exists, and is not respawning
    if (this.isMultiplayer && this.snake2 && this.respawnCountdown2 === 0) {
      const newHead2 = this.snake2.move();
      snake2Moved = true;

      // Check for wall collision
      if (this.snake2.collidesWithWall()) {
        logDebugEvent("Snake 2 collided with wall");
        this.handleSnakeDeath(true);
        return; // Stop step processing if snake 2 died
      }

      // Check for self collision
      if (this.snake2.collidesWithSelf()) {
        logDebugEvent("Snake 2 collided with self");
        this.handleSnakeDeath(true);
        return;
      }

       // Check for fruit collision
       const eatenFruitIndex2 = this.fruitManager.checkFruitEaten(newHead2);
       if (eatenFruitIndex2 >= 0) {
         this.fruitManager.removeFruit(eatenFruitIndex2);
         logDebugEvent("Snake 2 ate fruit", { fruitIndex: eatenFruitIndex2 });

         this.score2 += 10;
         this.onScoreChange(this.score, this.score2); // Always pass both scores in multiplayer

         if (this.speed > MAX_SPEED) {
           this.speed = Math.max(MAX_SPEED, this.speed - SPEED_INCREMENT);
           logDebugEvent("Game speed increased", { newSpeed: this.speed });
         }

         // Add new fruit (needs all current snake segments)
         const allSegments = [...(this.snake && this.respawnCountdown === 0 ? this.snake.segments : []), ...this.snake2.segments];
         this.fruitManager.addFruit(allSegments);

         if (this.renderer) this.renderer.notifySnakeGrowing(true);
         // Snake grows implicitly
       } else {
         this.snake2.removeTail(); // Remove tail if no fruit eaten
       }
    }

    // --- Snake vs Snake Collision ---
    // Only check if multiplayer, both snakes exist, moved, and are not respawning
    if (this.isMultiplayer && this.snake && this.snake2 && snake1Moved && snake2Moved && this.respawnCountdown === 0 && this.respawnCountdown2 === 0) {
        // Check if snake 1 head hit snake 2 body/head
        if (this.snake.collidesWithSnake(this.snake2)) {
            logDebugEvent("Snake 1 collided with Snake 2");
            this.handleSnakeDeath(false); // Snake 1 dies
            return; // Stop step processing
        }
        // Check if snake 2 head hit snake 1 body/head
        // Note: This check might be redundant if collidesWithSnake checks head against all segments of the other
        if (this.snake2.collidesWithSnake(this.snake)) {
            logDebugEvent("Snake 2 collided with Snake 1");
            this.handleSnakeDeath(true); // Snake 2 dies
            return; // Stop step processing
        }
    }

    // --- Fruit Movement --- (If fruits move independently)
    // Currently, fruits seem static until eaten. If they move:
    // const activeSnakeSegments = [
    //   ...(this.snake && this.respawnCountdown === 0 ? this.snake.segments : []),
    //   ...(this.isMultiplayer && this.snake2 && this.respawnCountdown2 === 0 ? this.snake2.segments : []),
    // ];
    // this.fruitManager.moveFruits(activeSnakeSegments); // Implement this in FruitManager if needed


    // --- Performance Monitoring ---
    const gameStepTime = performance.now() - startTime;
    recordGameStepTime(gameStepTime);
    if (gameStepTime > 16) { // ~60fps threshold
      logDebugEvent("Game step took longer than 16ms", { gameStepTime });
    }
    this.lastGameStepTime = gameStepTime; // Store for potential debugging/display
  }

  // Centralized handler for snake death logic
  handleSnakeDeath(isSnake2: boolean) {
    const snakeId = isSnake2 ? 2 : 1;
    logDebugEvent(`Handling death for Snake ${snakeId}`);
    // Potentially add scoring changes here (e.g., opponent gets points)
    this.startRespawnCountdown(isSnake2);
  }

  endGame() {
    // Prevent multiple calls
    if (this.animationFrameId === null && !this.isPaused) return;

    logDebugEvent("Game over");
    this.stopGameLoop(); // Ensure everything stops
    // Optionally set a flag e.g., this.isGameOver = true;
    this.onGameOver(); // Notify UI/controller
  }

  // Apply settings changes during gameplay (if supported)
  applySettings(settings: {
    gridSize?: number;
    isMultiplayer?: boolean;
    noBoundaries?: boolean;
    allowCoiling?: boolean;
    isDarkTheme?: boolean;
    // Lives cannot typically be changed mid-game this way
  }) {
    logDebugEvent("Applying settings", settings);
    let needsReInitialize = false;

    // Update theme (safe during gameplay)
    if (settings.isDarkTheme !== undefined && settings.isDarkTheme !== this.isDarkTheme) {
      this.setTheme(settings.isDarkTheme);
    }

    // Settings that require game reset/careful handling
    if (settings.gridSize !== undefined && settings.gridSize !== this.gridSize) {
       logDebugEvent("Grid size change requires re-initialization.");
       // Potentially handle resizing dynamically later, complex
       needsReInitialize = true; // Simplest approach
       this.gridSize = settings.gridSize; // Store for re-init
    }

    if (settings.isMultiplayer !== undefined && settings.isMultiplayer !== this.isMultiplayer) {
       logDebugEvent("Multiplayer mode change requires re-initialization.");
       needsReInitialize = true; // Simplest approach
       this.isMultiplayer = settings.isMultiplayer; // Store for re-init
    }

    if (settings.noBoundaries !== undefined && settings.noBoundaries !== this.noBoundaries) {
       this.setNoBoundaries(settings.noBoundaries); // Can often be changed live
    }

    if (settings.allowCoiling !== undefined && settings.allowCoiling !== this.allowCoiling) {
      this.setAllowCoiling(settings.allowCoiling); // Can often be changed live
    }

    if (needsReInitialize) {
        // Optionally save score/lives before re-initializing if desired
        // this.initialize(); // Re-initialize the game with new settings
        logDebugEvent("Settings require game restart to take full effect.", {}, "warn");
        // Or notify UI to prompt for restart
    }

    // Render to show immediate changes (like theme, potentially boundaries)
    this.onGameRender();
  }

  getState(): GameState {
    // Ensure you update the GameState interface in types.ts to match this
    return {
      // Snake 1 state (check existence)
      snake: this.snake ? this.snake.segments : [],
      direction: this.snake ? this.snake.direction : { dx: 1, dy: 0 }, // Provide default/last direction
      nextDirection: this.snake ? this.snake.nextDirection : { dx: 1, dy: 0 },
      snakeColor: this.snake ? this.snake.color : "green",
      snakeHeadColor: this.snake ? this.snake.headColor : "#00ff00",
      respawning: this.respawnCountdown, // Countdown value

      // Snake 2 state (check existence)
      snake2: this.snake2 ? this.snake2.segments : undefined,
      direction2: this.snake2 ? this.snake2.direction : undefined,
      nextDirection2: this.snake2 ? this.snake2.nextDirection : undefined,
      snake2Color: this.snake2 ? this.snake2.color : undefined,
      snake2HeadColor: this.snake2 ? this.snake2.headColor : undefined,
      respawning2: this.respawnCountdown2, // Countdown value

      // Game state
      fruits: this.fruitManager.fruits,
      speed: this.speed,
      score: this.score,
      score2: this.score2, // Include even if single player (might be 0)
      lives: this.lives,
      lives2: this.lives2, // Include even if single player (might be same as lives)
      isMultiplayer: this.isMultiplayer,
      noBoundaries: this.noBoundaries,
      allowCoiling: this.allowCoiling,
      isDarkTheme: this.isDarkTheme,
      isPaused: this.isPaused,
      isGameLoopActive: this.animationFrameId !== null, // Correctly checks animation frame status
      gridSize: this.gridSize, // Add grid size to state if needed by renderer/UI
      // Add isGameOver flag if implemented: isGameOver: this.isGameOver,
    };
  }
}
