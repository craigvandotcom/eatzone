"use client";

import type React from "react";
import type { Stool } from "@/lib/types";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp } from "lucide-react";

interface AddStoolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddStool: (stool: Omit<Stool, "id" | "timestamp">) => void;
  onClose: () => void;
  editingStool?: Stool | null;
}

export function AddStoolDialog({
  open,
  onOpenChange,
  onAddStool,
  onClose,
  editingStool,
}: AddStoolDialogProps) {
  const [bristolScale, setBristolScale] = useState([4]); // Bristol stool scale
  const [color, setColor] = useState<Stool["color"]>("brown");
  const [hasBlood, setHasBlood] = useState(false);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  // Pre-populate form when editing
  useEffect(() => {
    if (editingStool) {
      setBristolScale([editingStool.bristolScale]);
      setColor(editingStool.color);
      setHasBlood(editingStool.hasBlood);
      setNotes(editingStool.notes || "");
      setShowNotes(!!editingStool.notes);
    } else {
      setBristolScale([4]);
      setColor("brown");
      setHasBlood(false);
      setNotes("");
      setShowNotes(false);
    }
  }, [editingStool]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!color) return;

    const stool: Omit<Stool, "id" | "timestamp"> = {
      bristolScale: bristolScale[0],
      color,
      hasBlood,
      notes: notes.trim() || undefined,
      image: editingStool?.image,
    };

    onAddStool(stool);

    // Reset form
    setBristolScale([4]);
    setColor("brown");
    setHasBlood(false);
    setNotes("");
    setShowNotes(false);
    onClose();
  };

  const getTypeDescription = (value: number) => {
    const descriptions = {
      1: "Hard lumps (constipated)",
      2: "Lumpy sausage (slightly constipated)",
      3: "Cracked sausage (normal)",
      4: "Smooth sausage (normal)",
      5: "Soft blobs (lacking fiber)",
      6: "Mushy consistency (mild diarrhea)",
      7: "Liquid consistency (severe diarrhea)",
    };
    return descriptions[value as keyof typeof descriptions];
  };

  const handleClose = () => {
    if (!editingStool) {
      setBristolScale([4]);
      setColor("brown");
      setHasBlood(false);
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
            {editingStool ? "Edit Bowel Movement" : "Add Bowel Movement"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="bristol-type">Bristol Stool Scale Type</Label>
            <div className="px-2 py-4">
              <Slider
                value={bristolScale}
                onValueChange={setBristolScale}
                max={7}
                min={1}
                step={1}
                className="w-full"
              />
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
                Type {bristolScale[0]}: {getTypeDescription(bristolScale[0])}
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="color">Color</Label>
            <Select
              value={color}
              onValueChange={value => setColor(value as Stool["color"])}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select color" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brown">Brown</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="yellow">Yellow</SelectItem>
                <SelectItem value="black">Black</SelectItem>
                <SelectItem value="white">White</SelectItem>
                <SelectItem value="red">Red</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="has-blood"
              checked={hasBlood}
              onCheckedChange={checked => setHasBlood(checked as boolean)}
            />
            <Label htmlFor="has-blood">Contains blood</Label>
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
                  id="stool-notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any additional observations..."
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
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingStool ? "Update Movement" : "Add Movement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
