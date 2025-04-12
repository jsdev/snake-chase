export type Position = {
  x: number
  y: number
}

export type Direction = {
  x: number
  y: number
}

export type Fruit = {
  position: Position
  type: string
  direction: Direction
  moveCounter: number
}

export type GameState = {
  snake: Position[]
  snake2?: Position[]
  direction: Direction
  direction2?: Direction
  nextDirection: Direction
  nextDirection2?: Direction
  fruits: Fruit[]
  speed: number
  gameLoop: number
  score: number
  score2?: number
  lives: number
  lives2?: number
  isMultiplayer?: boolean
  noBoundaries?: boolean
  allowCoiling?: boolean
  isDarkTheme?: boolean
  snakeColor?: string
  snakeHeadColor?: string
  snake2Color?: string
  snake2HeadColor?: string
  respawning?: number // Snake 1 respawn countdown (0 = not respawning)
  respawning2?: number // Snake 2 respawn countdown (0 = not respawning)
  isPaused?: boolean
}

export type GameSettings = {
  gridSize: number
  isMultiplayer: boolean
  noBoundaries: boolean
  allowCoiling: boolean
  isDarkTheme: boolean
  lives: number
}
