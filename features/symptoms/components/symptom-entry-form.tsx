"use client";

import type React from "react";
import type { Symptom } from "@/lib/types";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit2, Trash2, ChevronDown, ChevronUp, Target } from "lucide-react";
import { getZoneBgClass, getZoneTextClass } from "@/lib/utils/zone-colors";
import type { ZoneType } from "@/lib/utils/zone-colors";

interface LocalSymptom {
  name: string;
  severity: number;
}

interface SymptomEntryFormProps {
  onAddSymptom: (symptom: Omit<Symptom, "id" | "timestamp">) => void;
  onClose: () => void;
  editingSymptom?: Symptom | null;
  className?: string;
}

export function SymptomEntryForm({
  onAddSymptom,
  onClose,
  editingSymptom,
  className,
}: SymptomEntryFormProps) {
  const [currentSymptom, setCurrentSymptom] = useState("");
  const [symptoms, setSymptoms] = useState<LocalSymptom[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [severitySelectionIndex, setSeveritySelectionIndex] = useState<
    number | null
  >(null);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  // Pre-populate form when editing
  useEffect(() => {
    if (editingSymptom) {
      setSymptoms([
        {
          name: editingSymptom.name,
          severity: editingSymptom.severity,
        },
      ]);
      setNotes(editingSymptom.notes || "");
      setShowNotes(!!editingSymptom.notes);
    } else {
      setSymptoms([]);
      setNotes("");
      setShowNotes(false);
    }
  }, [editingSymptom]);

  const handleSymptomKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && currentSymptom.trim()) {
      e.preventDefault();
      setSymptoms([
        ...symptoms,
        {
          name: currentSymptom.trim(),
          severity: 0, // Set to 0 to indicate it needs to be set
        },
      ]);
      setCurrentSymptom("");
      // Automatically open severity selection for the new symptom
      setSeveritySelectionIndex(symptoms.length);
    }
  };

  const handleDeleteSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
    setSeveritySelectionIndex(null);
  };

  const handleEditSymptom = (index: number) => {
    setEditingIndex(index);
    setEditingValue(symptoms[index].name);
    setSeveritySelectionIndex(null);
  };

  const handleToggleSeveritySelection = (index: number) => {
    setSeveritySelectionIndex(severitySelectionIndex === index ? null : index);
  };

  const handleSelectSeverity = (index: number, severity: number) => {
    const updatedSymptoms = [...symptoms];
    updatedSymptoms[index].severity = severity;
    setSymptoms(updatedSymptoms);
    setSeveritySelectionIndex(null); // Close severity selection
  };

  const handleSaveEdit = (index: number) => {
    if (editingValue.trim()) {
      const updatedSymptoms = [...symptoms];
      updatedSymptoms[index].name = editingValue.trim();
      setSymptoms(updatedSymptoms);
    }
    setEditingIndex(null);
    setEditingValue("");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingValue("");
  };

  const handleEditKeyPress = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveEdit(index);
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const getSeverityZone = (severity: number): ZoneType => {
    if (severity <= 2) return "green";
    if (severity <= 4) return "yellow";
    return "red";
  };

  const getSeverityColor = (severity: number) => {
    const zone = getSeverityZone(severity);
    return `${getZoneBgClass(zone, "light")} ${getZoneTextClass(zone)}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validSymptoms = symptoms.filter(symptom => symptom.severity > 0);
    if (validSymptoms.length === 0) return;

    // Submit each valid symptom individually
    validSymptoms.forEach(localSymptom => {
      const symptom: Omit<Symptom, "id" | "timestamp"> = {
        name: localSymptom.name,
        severity: localSymptom.severity,
        notes: notes.trim() || undefined,
      };
      onAddSymptom(symptom);
    });

    // Reset form
    setCurrentSymptom("");
    setSymptoms([]);
    setNotes("");
    setShowNotes(false);
    setEditingIndex(null);
    setEditingValue("");
    setSeveritySelectionIndex(null);
    onClose();
  };

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="symptom-input">Symptoms</Label>
          <Input
            id="symptom-input"
            value={currentSymptom}
            onChange={e => setCurrentSymptom(e.target.value)}
            onKeyPress={handleSymptomKeyPress}
            placeholder="Type symptom and press Enter"
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-1">
            Press Enter to add each symptom
          </p>
        </div>

        {/* Symptoms List */}
        {symptoms.length > 0 && (
          <div>
            <Label>Added Symptoms ({symptoms.length})</Label>
            <ScrollArea className="max-h-40 mt-2">
              <div className="space-y-2">
                {symptoms.map((symptom, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-md h-12 flex items-center overflow-hidden"
                  >
                    {/* Normal Symptom Row */}
                    {severitySelectionIndex !== index &&
                      symptom.severity > 0 && (
                        <>
                          {editingIndex === index ? (
                            <Input
                              value={editingValue}
                              onChange={e => setEditingValue(e.target.value)}
                              onKeyPress={e => handleEditKeyPress(e, index)}
                              onBlur={() => handleSaveEdit(index)}
                              className="flex-1 h-8 mx-2"
                              autoFocus
                            />
                          ) : (
                            <div className="flex-1 px-2 flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">
                                {symptom.name}
                              </span>
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded-full ${getSeverityColor(symptom.severity)}`}
                              >
                                {symptom.severity}/5
                              </span>
                            </div>
                          )}
                          <div className="flex gap-1 px-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleSeveritySelection(index)
                              }
                              className={`p-1 transition-colors ${
                                symptom.severity >= 4
                                  ? getZoneTextClass("red")
                                  : symptom.severity >= 3
                                    ? getZoneTextClass("yellow")
                                    : getZoneTextClass("green")
                              } hover:opacity-80`}
                              title="Adjust severity"
                            >
                              <Target className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditSymptom(index)}
                              className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                              title="Edit symptom"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSymptom(index)}
                              className={`p-1 text-gray-500 hover:${getZoneTextClass("red")} transition-colors`}
                              title="Delete symptom"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </>
                      )}

                    {/* Severity Selection Row - Horizontal Multiple Choice */}
                    {severitySelectionIndex === index && (
                      <div className="flex-1 min-w-0 px-3 flex items-center justify-center">
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map(level => (
                            <button
                              key={level}
                              type="button"
                              onClick={() => handleSelectSeverity(index, level)}
                              className={`w-10 h-8 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-110 ${
                                level <= 2
                                  ? `${getZoneBgClass("green", "light")} ${getZoneTextClass("green")} hover:${getZoneBgClass("green", "medium")} border-2 border-zone-green/30`
                                  : level <= 4
                                    ? `${getZoneBgClass("yellow", "light")} ${getZoneTextClass("yellow")} hover:${getZoneBgClass("yellow", "medium")} border-2 border-zone-yellow/30`
                                    : `${getZoneBgClass("red", "light")} ${getZoneTextClass("red")} hover:${getZoneBgClass("red", "medium")} border-2 border-zone-red/30`
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

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
            onClick={onClose}
            className="flex-1 bg-transparent"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={symptoms.filter(s => s.severity > 0).length === 0}
            className="flex-1"
          >
            {editingSymptom
              ? "Update Symptom"
              : `Add Symptoms (${symptoms.filter(s => s.severity > 0).length})`}
          </Button>
        </div>
      </form>
    </div>
  );
}
