"use client"

import type React from "react"
import type { Stool } from "@/lib/types"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { format } from "date-fns"
import { ChevronDown, ChevronUp } from "lucide-react"

interface AddStoolDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddStool: (stool: {
    time: string
    date: string
    type: number
    color: string
    consistency: string
    notes?: string
  }) => void
  editingStool?: Stool | null
}

export function AddStoolDialog({ open, onOpenChange, onAddStool, editingStool }: AddStoolDialogProps) {
  const [type, setType] = useState([4]) // Bristol stool scale
  const [color, setColor] = useState("")
  const [consistency, setConsistency] = useState("")
  const [notes, setNotes] = useState("")
  const [showNotes, setShowNotes] = useState(false)

  // Pre-populate form when editing
  useEffect(() => {
    if (editingStool) {
      setType([editingStool.type])
      setColor(editingStool.color)
      setConsistency(editingStool.consistency)
      setNotes(editingStool.notes || "")
      setShowNotes(!!editingStool.notes)
    }
  }, [editingStool])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!color || !consistency) return

    const now = new Date()
    onAddStool({
      type: type[0],
      color,
      consistency,
      notes: notes || undefined,
      time: format(now, "HH:mm"),
      date: format(now, "yyyy-MM-dd"),
    })

    setType([4])
    setColor("")
    setConsistency("")
    setNotes("")
    setShowNotes(false)
    onOpenChange(false)
  }

  const getTypeDescription = (value: number) => {
    const descriptions = {
      1: "Hard lumps (constipated)",
      2: "Lumpy sausage (slightly constipated)",
      3: "Cracked sausage (normal)",
      4: "Smooth sausage (normal)",
      5: "Soft blobs (lacking fiber)",
      6: "Mushy consistency (mild diarrhea)",
      7: "Liquid consistency (severe diarrhea)",
    }
    return descriptions[value as keyof typeof descriptions]
  }

  const handleClose = () => {
    if (!editingStool) {
      setType([4])
      setColor("")
      setConsistency("")
      setNotes("")
      setShowNotes(false)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingStool ? "Edit Bowel Movement" : "Add Bowel Movement"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="bristol-type">Bristol Stool Scale Type</Label>
            <div className="px-2 py-4">
              <Slider value={type} onValueChange={setType} max={7} min={1} step={1} className="w-full" />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
                <span>6</span>
                <span>7</span>
              </div>
              <p className="text-center mt-2 text-sm text-gray-700">
                Type {type[0]}: {getTypeDescription(type[0])}
              </p>
            </div>
          </div>
          <div>
            <Label htmlFor="color">Color</Label>
            <Select value={color} onValueChange={setColor} required>
              <SelectTrigger>
                <SelectValue placeholder="Select color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brown">Brown</SelectItem>
                <SelectItem value="light-brown">Light Brown</SelectItem>
                <SelectItem value="dark-brown">Dark Brown</SelectItem>
                <SelectItem value="yellow">Yellow</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="black">Black</SelectItem>
                <SelectItem value="red">Red</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="consistency">Consistency</Label>
            <Select value={consistency} onValueChange={setConsistency} required>
              <SelectTrigger>
                <SelectValue placeholder="Select consistency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="very-hard">Very Hard</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="soft">Soft</SelectItem>
                <SelectItem value="very-soft">Very Soft</SelectItem>
                <SelectItem value="liquid">Liquid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Collapsible Notes Section */}
          <div>
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              {showNotes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Add notes (optional)
            </button>
            {showNotes && (
              <div className="mt-2">
                <Textarea
                  id="stool-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional observations..."
                  rows={3}
                  autoFocus
                />
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => handleClose()} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingStool ? "Update Movement" : "Add Movement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
