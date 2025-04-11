"use client"
import { SnakeGame } from "@/components/snake-game"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black p-4">
      <h1 className="mb-6 text-4xl font-bold text-yellow-400">Snake Chase</h1>
      <SnakeGame />
    </main>
  )
}
