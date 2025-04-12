"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import type { Direction } from "@/lib/types"
import { DIRECTIONS } from "@/lib/constants"

interface MobileControlsProps {
  onDirectionChange: (direction: Direction) => void
  disabled?: boolean
}

export function MobileControls({ onDirectionChange, disabled = false }: MobileControlsProps) {
  const joystickRef = useRef<HTMLDivElement>(null)
  const knobRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [currentDirection, setCurrentDirection] = useState<Direction | null>(null)

  // Handle touch/mouse events
  const handleStart = (clientX: number, clientY: number) => {
    if (disabled || !joystickRef.current || !knobRef.current) return

    setIsDragging(true)

    const rect = joystickRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    setStartPos({ x: centerX, y: centerY })

    // Center the knob initially
    knobRef.current.style.transform = `translate(0px, 0px)`
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || !knobRef.current || !joystickRef.current) return

    const joystickRect = joystickRef.current.getBoundingClientRect()
    const radius = joystickRect.width / 2

    // Calculate distance from center
    const deltaX = clientX - startPos.x
    const deltaY = clientY - startPos.y

    // Calculate distance from center
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // Normalize to max radius
    const normalizedDistance = Math.min(distance, radius)
    const angle = Math.atan2(deltaY, deltaX)

    // Calculate new position
    const newX = normalizedDistance * Math.cos(angle)
    const newY = normalizedDistance * Math.sin(angle)

    // Move the knob
    knobRef.current.style.transform = `translate(${newX}px, ${newY}px)`

    // Determine direction based on angle
    let newDirection: Direction | null = null

    // Convert angle to degrees (0-360)
    const degrees = ((angle * 180) / Math.PI + 360) % 360

    // Only register direction if the joystick is moved enough
    if (normalizedDistance > radius * 0.3) {
      // Determine direction based on angle
      if (degrees >= 45 && degrees < 135) {
        newDirection = DIRECTIONS.DOWN
      } else if (degrees >= 135 && degrees < 225) {
        newDirection = DIRECTIONS.LEFT
      } else if (degrees >= 225 && degrees < 315) {
        newDirection = DIRECTIONS.UP
      } else {
        newDirection = DIRECTIONS.RIGHT
      }

      // Only trigger direction change if it's different
      if (newDirection !== currentDirection) {
        setCurrentDirection(newDirection)
        onDirectionChange(newDirection)
      }
    }
  }

  const handleEnd = () => {
    if (!isDragging || !knobRef.current) return

    setIsDragging(false)
    setCurrentDirection(null)

    // Reset knob position with animation
    knobRef.current.style.transition = "transform 0.2s ease-out"
    knobRef.current.style.transform = `translate(0px, 0px)`

    // Remove transition after animation completes
    setTimeout(() => {
      if (knobRef.current) {
        knobRef.current.style.transition = ""
      }
    }, 200)
  }

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    handleMove(touch.clientX, touch.clientY)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    handleEnd()
  }

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    handleStart(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault()
    handleMove(e.clientX, e.clientY)
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault()
    handleEnd()
  }

  // Handle swipe gestures for the entire game area
  useEffect(() => {
    if (disabled) return

    let touchStartX = 0
    let touchStartY = 0
    let touchEndX = 0
    let touchEndY = 0

    const handleSwipeStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
    }

    const handleSwipeEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].clientX
      touchEndY = e.changedTouches[0].clientY

      // Calculate swipe direction
      const deltaX = touchEndX - touchStartX
      const deltaY = touchEndY - touchStartY

      // Only register if it's a significant swipe
      if (Math.abs(deltaX) > 30 || Math.abs(deltaY) > 30) {
        // Determine primary direction (horizontal or vertical)
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal swipe
          if (deltaX > 0) {
            onDirectionChange(DIRECTIONS.RIGHT)
          } else {
            onDirectionChange(DIRECTIONS.LEFT)
          }
        } else {
          // Vertical swipe
          if (deltaY > 0) {
            onDirectionChange(DIRECTIONS.DOWN)
          } else {
            onDirectionChange(DIRECTIONS.UP)
          }
        }
      }
    }

    // Add event listeners to document for swipe detection
    document.addEventListener("touchstart", handleSwipeStart, { passive: false })
    document.addEventListener("touchend", handleSwipeEnd, { passive: false })

    return () => {
      document.removeEventListener("touchstart", handleSwipeStart)
      document.removeEventListener("touchend", handleSwipeEnd)
    }
  }, [disabled, onDirectionChange])

  return (
    <div className="mt-6 flex flex-col items-center">
      <div
        ref={joystickRef}
        className="relative w-32 h-32 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: "var(--grid-bg)",
          border: "2px solid var(--border)",
          touchAction: "none", // Prevent default touch actions
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          ref={knobRef}
          className="absolute w-16 h-16 rounded-full"
          style={{
            backgroundColor: "var(--primary)",
            opacity: disabled ? 0.5 : 1,
            pointerEvents: disabled ? "none" : "auto",
          }}
        />
      </div>
      <p className="mt-2 text-sm" style={{ color: "var(--text)" }}>
        {disabled ? "Game paused" : "Drag to move"}
      </p>
    </div>
  )
}
