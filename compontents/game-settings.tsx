"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GRID_SIZE_OPTIONS } from "@/lib/constants"
import { Settings } from 'lucide-react'

interface GameSettingsProps {
  settings: {
    gridSize: number
    isMultiplayer: boolean
    noBoundaries: boolean
  }
  onSettingsChange: (settings: { gridSize: number; isMultiplayer: boolean; noBoundaries: boolean }) => void
  disabled?: boolean
}

export function GameSettings({ settings, onSettingsChange, disabled = false }: GameSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings)
  const [open, setOpen] = useState(false)

  const handleSave = () => {
    onSettingsChange(localSettings)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="absolute right-4 top-4 z-10" disabled={disabled}>
          <Settings className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Game Settings</DialogTitle>
          <DialogDescription>
            Adjust the game settings to your preference. Changes will apply to the next game.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="grid-size" className="col-span-2">
              Grid Size
            </Label>
            <Select
              value={localSettings.gridSize.toString()}
              onValueChange={(value) => setLocalSettings({ ...localSettings, gridSize: Number.parseInt(value) })}
            >
              <SelectTrigger id="grid-size" className="col-span-2">
                <SelectValue placeholder="Select grid size" />
              </SelectTrigger>
              <SelectContent>
                {GRID_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size} x {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="multiplayer" className="col-span-2">
              Multiplayer Mode
            </Label>
            <div className="col-span-2 flex items-center space-x-2">
              <Switch
                id="multiplayer"
                checked={localSettings.isMultiplayer}
                onCheckedChange={(checked) => setLocalSettings({ ...localSettings, isMultiplayer: checked })}
              />
              <Label htmlFor="multiplayer">{localSettings.isMultiplayer ? "On" : "Off"}</Label>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="no-boundaries" className="col-span-2">
              No Boundaries
            </Label>
            <div className="col-span-2 flex items-center space-x-2">
              <Switch
                id="no-boundaries"
                checked={localSettings.noBoundaries}
                onCheckedChange={(checked) => setLocalSettings({ ...localSettings, noBoundaries: checked })}
              />
              <Label htmlFor="no-boundaries">{localSettings.noBoundaries ? "On" : "Off"}</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
