"use client"

import type React from "react"
import type { Liquid } from "@/types/liquid" // Declare the Liquid variable

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, ChevronUp } from "lucide-react"
import { format } from "date-fns"

interface AddLiquidDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddLiquid: (liquid: {
    name: string
    time: string
    date: string
    amount: number
    type: string
    notes?: string
  }) => void
  editingLiquid?: Liquid | null
}

export function AddLiquidDialog({ open, onOpenChange, onAddLiquid, editingLiquid }: AddLiquidDialogProps) {
  const [type, setType] = useState("")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [showNotes, setShowNotes] = useState(false)

  // Pre-populate form when editing
  useEffect(() => {
    if (editingLiquid) {
      setType(editingLiquid.type)
      setAmount(editingLiquid.amount.toString())
      setNotes(editingLiquid.notes || "")
      setShowNotes(!!editingLiquid.notes)
    }
  }, [editingLiquid])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!type || !amount) return

    const now = new Date()
    // Auto-generate name based on type and amount
    const name = `${type.charAt(0).toUpperCase() + type.slice(1)} - ${amount}ml`

    onAddLiquid({
      name,
      type,
      amount: Number.parseInt(amount),
      notes: notes || undefined,
      time: format(now, "HH:mm"),
      date: format(now, "yyyy-MM-dd"),
    })

    setType("")
    setAmount("")
    setNotes("")
    setShowNotes(false)
    onOpenChange(false)
  }

  const handleClose = () => {
    if (!editingLiquid) {
      setType("")
      setAmount("")
      setNotes("")
      setShowNotes(false)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingLiquid ? "Edit Liquid Intake" : "Add Liquid Intake"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={setType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="water">Water</SelectItem>
                <SelectItem value="coffee">Coffee</SelectItem>
                <SelectItem value="tea">Tea</SelectItem>
                <SelectItem value="juice">Juice</SelectItem>
                <SelectItem value="soda">Soda</SelectItem>
                <SelectItem value="alcohol">Alcohol</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="amount">Amount (ml)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 250"
              required
            />
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
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional details..."
                  rows={3}
                  autoFocus
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingLiquid ? "Update Liquid" : "Add Liquid"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
