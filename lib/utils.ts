import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import type { Position } from "./types"
import { GRID_SIZE } from "./constants"

// Check if two positions are the same
export function isSamePosition(pos1: Position, pos2: Position): boolean {
  return pos1.x === pos2.x && pos1.y === pos2.y
}

// Check if a position is out of bounds
export function isOutOfBounds(position: Position, gridSize: number = GRID_SIZE): boolean {
  return position.x < 0 || position.x >= gridSize || position.y < 0 || position.y >= gridSize
}

// Check if a position overlaps with any segment in an array of positions
export function overlapsWithAny(position: Position, segments: Position[]): boolean {
  return segments.some((segment) => isSamePosition(segment, position))
}

// Get a random position within the grid
export function getRandomPosition(gridSize: number = GRID_SIZE): Position {
  return {
    x: Math.floor(Math.random() * gridSize),
    y: Math.floor(Math.random() * gridSize),
  }
}

// Get a random item from an array
export function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
