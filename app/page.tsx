"use client"
import { SnakeGame } from "@/components/SnakeGame"
import "./theme.css"

export default function Home() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center p-4"
      style={{ backgroundColor: "var(--background)" }}
    >
      <h1 className="mb-6 text-4xl font-bold" style={{ color: "var(--accent)" }}>
        Snake Chase
      </h1>
      <SnakeGame />
    </main>
  )
}
