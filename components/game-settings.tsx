"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GRID_SIZE_OPTIONS, LIVES_OPTIONS } from "@/lib/constants"
import { Settings, X } from "lucide-react"

interface GameSettingsProps {
  settings: {
    gridSize: number
    isMultiplayer: boolean
    noBoundaries: boolean
    allowCoiling: boolean
    isDarkTheme: boolean
    lives: number
  }
  onSettingsChange: (settings: {
    gridSize: number
    isMultiplayer: boolean
    noBoundaries: boolean
    allowCoiling: boolean
    isDarkTheme: boolean
    lives: number
  }) => void
  disabled?: boolean
}

export function GameSettings({ settings, onSettingsChange, disabled = false }: GameSettingsProps) {
  const [open, setOpen] = useState(false)
  const [localSettings, setLocalSettings] = useState(settings)

  // Apply settings immediately when they change
  useEffect(() => {
    onSettingsChange(localSettings)
  }, [localSettings, onSettingsChange])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="flex items-center" disabled={disabled}>
          <Settings className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px]"
        style={{ backgroundColor: "var(--background)", color: "var(--text)", borderColor: "var(--border)" }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: "var(--text)" }}>Game Settings</DialogTitle>
          <DialogDescription style={{ color: "var(--text)", opacity: 0.8 }}>
            Adjust the game settings to your preference. Changes will apply to the next game.
          </DialogDescription>
        </DialogHeader>
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="grid-size" className="col-span-2" style={{ color: "var(--text)" }}>
              Grid Size
            </Label>
            <Select
              value={localSettings.gridSize.toString()}
              onValueChange={(value) => setLocalSettings({ ...localSettings, gridSize: Number.parseInt(value) })}
            >
              <SelectTrigger
                id="grid-size"
                className="col-span-2"
                style={{ backgroundColor: "var(--grid-bg)", color: "var(--text)", borderColor: "var(--border)" }}
              >
                <SelectValue placeholder="Select grid size" />
              </SelectTrigger>
              <SelectContent
                style={{ backgroundColor: "var(--background)", color: "var(--text)", borderColor: "var(--border)" }}
              >
                {GRID_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={size.toString()} style={{ color: "var(--text)" }}>
                    {size} x {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="lives" className="col-span-2" style={{ color: "var(--text)" }}>
              Lives
            </Label>
            <Select
              value={localSettings.lives.toString()}
              onValueChange={(value) => setLocalSettings({ ...localSettings, lives: Number.parseInt(value) })}
            >
              <SelectTrigger
                id="lives"
                className="col-span-2"
                style={{ backgroundColor: "var(--grid-bg)", color: "var(--text)", borderColor: "var(--border)" }}
              >
                <SelectValue placeholder="Select number of lives" />
              </SelectTrigger>
              <SelectContent
                style={{ backgroundColor: "var(--background)", color: "var(--text)", borderColor: "var(--border)" }}
              >
                {LIVES_OPTIONS.map((lives) => (
                  <SelectItem key={lives} value={lives.toString()} style={{ color: "var(--text)" }}>
                    {lives}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="allow-coiling" className="col-span-2" style={{ color: "var(--text)" }}>
              Snake Coiling
            </Label>
            <div className="col-span-2 flex items-center space-x-2">
              <Switch
                id="allow-coiling"
                checked={localSettings.allowCoiling}
                onCheckedChange={(checked) => setLocalSettings({ ...localSettings, allowCoiling: checked })}
                className="data-[state=checked]:bg-primary"
              />
              <Label htmlFor="allow-coiling" style={{ color: "var(--text)" }}>
                {localSettings.allowCoiling ? "On" : "Off"}
              </Label>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="no-boundaries" className="col-span-2" style={{ color: "var(--text)" }}>
              No Boundaries
            </Label>
            <div className="col-span-2 flex items-center space-x-2">
              <Switch
                id="no-boundaries"
                checked={localSettings.noBoundaries}
                onCheckedChange={(checked) => setLocalSettings({ ...localSettings, noBoundaries: checked })}
                className="data-[state=checked]:bg-primary"
              />
              <Label htmlFor="no-boundaries" style={{ color: "var(--text)" }}>
                {localSettings.noBoundaries ? "On" : "Off"}
              </Label>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="multiplayer" className="col-span-2" style={{ color: "var(--text)" }}>
              Multiplayer Mode
            </Label>
            <div className="col-span-2 flex items-center space-x-2">
              <Switch
                id="multiplayer"
                checked={localSettings.isMultiplayer}
                onCheckedChange={(checked) => setLocalSettings({ ...localSettings, isMultiplayer: checked })}
                className="data-[state=checked]:bg-primary"
              />
              <Label htmlFor="multiplayer" style={{ color: "var(--text)" }}>
                {localSettings.isMultiplayer ? "On" : "Off"}
              </Label>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dark-theme" className="col-span-2" style={{ color: "var(--text)" }}>
              Dark Theme
            </Label>
            <div className="col-span-2 flex items-center space-x-2">
              <Switch
                id="dark-theme"
                checked={localSettings.isDarkTheme}
                onCheckedChange={(checked) => setLocalSettings({ ...localSettings, isDarkTheme: checked })}
                className="data-[state=checked]:bg-primary"
              />
              <Label htmlFor="dark-theme" style={{ color: "var(--text)" }}>
                {localSettings.isDarkTheme ? "On" : "Off"}
              </Label>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
