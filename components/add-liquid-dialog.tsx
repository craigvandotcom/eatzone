"use client";

import type React from "react";
import type { Liquid } from "@/lib/types";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronUp } from "lucide-react";

interface AddLiquidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddLiquid: (liquid: Omit<Liquid, "id" | "timestamp">) => void;
  onClose: () => void;
  editingLiquid?: Liquid | null;
}

export function AddLiquidDialog({
  open,
  onOpenChange,
  onAddLiquid,
  onClose,
  editingLiquid,
}: AddLiquidDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<Liquid["type"]>("water");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  // Pre-populate form when editing
  useEffect(() => {
    if (editingLiquid) {
      setName(editingLiquid.name || "");
      setType(editingLiquid.type);
      setAmount(editingLiquid.amount.toString());
      setNotes(editingLiquid.notes || "");
      setShowNotes(!!editingLiquid.notes);
    } else {
      setName("");
      setType("water");
      setAmount("");
      setNotes("");
      setShowNotes(false);
    }
  }, [editingLiquid]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !amount) return;

    // Auto-generate name based on type and amount if not provided
    const liquidName =
      name.trim() ||
      `${type.charAt(0).toUpperCase() + type.slice(1)} - ${amount}ml`;

    const liquid: Omit<Liquid, "id" | "timestamp"> = {
      name: liquidName,
      type,
      amount: Number.parseInt(amount),
      notes: notes.trim() || undefined,
      image: editingLiquid?.image,
    };

    onAddLiquid(liquid);

    // Reset form
    setName("");
    setType("water");
    setAmount("");
    setNotes("");
    setShowNotes(false);
    onClose();
  };

  const handleClose = () => {
    if (!editingLiquid) {
      setName("");
      setType("water");
      setAmount("");
      setNotes("");
      setShowNotes(false);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingLiquid ? "Edit Liquid Intake" : "Add Liquid Intake"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="liquid-name">Name (optional)</Label>
            <Input
              id="liquid-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Morning Coffee (auto-generated if empty)"
            />
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <Select
              value={type}
              onValueChange={value => setType(value as Liquid["type"])}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="water">Water</SelectItem>
                <SelectItem value="coffee">Coffee</SelectItem>
                <SelectItem value="tea">Tea</SelectItem>
                <SelectItem value="juice">Juice</SelectItem>
                <SelectItem value="soda">Soda</SelectItem>
                <SelectItem value="dairy">Dairy</SelectItem>
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
              onChange={e => setAmount(e.target.value)}
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
              {showNotes ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              Add notes (optional)
            </button>
            {showNotes && (
              <div className="mt-2">
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any additional details..."
                  rows={3}
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 bg-transparent"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingLiquid ? "Update Liquid" : "Add Liquid"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
