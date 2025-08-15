'use client';

import type React from 'react';
import type { Symptom } from '@/lib/types';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit2, Trash2, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { getZoneBgClass, getZoneTextClass } from '@/lib/utils/zone-colors';
import type { ZoneType } from '@/lib/utils/zone-colors';

interface LocalSymptom {
  name: string;
  score: number;
}

interface SymptomEntryFormProps {
  onAddSymptom: (symptom: Omit<Symptom, 'id' | 'timestamp'>) => void;
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
  const [currentSymptom, setCurrentSymptom] = useState('');
  const [symptoms, setSymptoms] = useState<LocalSymptom[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [scoreSelectionIndex, setScoreSelectionIndex] = useState<number | null>(
    null
  );
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  // Pre-populate form when editing
  useEffect(() => {
    if (editingSymptom) {
      setSymptoms([
        {
          name: editingSymptom.name,
          score: editingSymptom.score,
        },
      ]);
      setNotes(editingSymptom.notes || '');
      setShowNotes(!!editingSymptom.notes);
    } else {
      setSymptoms([]);
      setNotes('');
      setShowNotes(false);
    }
  }, [editingSymptom]);

  const handleSymptomKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentSymptom.trim()) {
      e.preventDefault();
      setSymptoms([
        ...symptoms,
        {
          name: currentSymptom.trim(),
          score: 0, // Set to 0 to indicate it needs to be set
        },
      ]);
      setCurrentSymptom('');
      // Automatically open score selection for the new symptom
      setScoreSelectionIndex(symptoms.length);
    }
  };

  const handleDeleteSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
    setScoreSelectionIndex(null);
  };

  const handleEditSymptom = (index: number) => {
    setEditingIndex(index);
    setEditingValue(symptoms[index].name);
    setScoreSelectionIndex(null);
  };

  const handleToggleScoreSelection = (index: number) => {
    setScoreSelectionIndex(scoreSelectionIndex === index ? null : index);
  };

  const handleSelectScore = (index: number, score: number) => {
    const updatedSymptoms = [...symptoms];
    updatedSymptoms[index].score = score;
    setSymptoms(updatedSymptoms);
    setScoreSelectionIndex(null); // Close score selection
  };

  const handleSaveEdit = (index: number) => {
    if (editingValue.trim()) {
      const updatedSymptoms = [...symptoms];
      updatedSymptoms[index].name = editingValue.trim();
      setSymptoms(updatedSymptoms);
    }
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleEditKeyPress = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit(index);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const getScoreZone = (score: number): ZoneType => {
    if (score === 0) return 'green';
    if (score <= 2) return 'yellow';
    return 'red';
  };

  const getScoreColor = (score: number) => {
    const zone = getScoreZone(score);
    return `${getZoneBgClass(zone, 'light')} ${getZoneTextClass(zone)}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validSymptoms = symptoms.filter(symptom => symptom.score > 0);
    if (validSymptoms.length === 0) return;

    // Submit each valid symptom individually
    validSymptoms.forEach(localSymptom => {
      const symptom: Omit<Symptom, 'id' | 'timestamp'> = {
        symptom_id: 'other_custom', // Legacy form - custom symptom
        category: 'Other',
        name: localSymptom.name,
        score: localSymptom.score as 0 | 1 | 2 | 3 | 4,
        notes: notes.trim() || undefined,
      };
      onAddSymptom(symptom);
    });

    // Reset form
    setCurrentSymptom('');
    setSymptoms([]);
    setNotes('');
    setShowNotes(false);
    setEditingIndex(null);
    setEditingValue('');
    setScoreSelectionIndex(null);
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
                    {scoreSelectionIndex !== index && symptom.score > 0 && (
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
                              className={`text-xs px-1.5 py-0.5 rounded-full ${getScoreColor(symptom.score)}`}
                            >
                              {symptom.score}/4
                            </span>
                          </div>
                        )}
                        <div className="flex gap-1 px-2">
                          <button
                            type="button"
                            onClick={() => handleToggleScoreSelection(index)}
                            className={`p-1 transition-colors ${
                              symptom.score >= 4
                                ? getZoneTextClass('red')
                                : symptom.score >= 3
                                  ? getZoneTextClass('yellow')
                                  : getZoneTextClass('green')
                            } hover:opacity-80`}
                            title="Adjust score"
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
                            className={`p-1 text-gray-500 hover:${getZoneTextClass('red')} transition-colors`}
                            title="Delete symptom"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </>
                    )}

                    {/* Severity Selection Row - Horizontal Multiple Choice */}
                    {scoreSelectionIndex === index && (
                      <div className="flex-1 min-w-0 px-3 flex items-center justify-center">
                        <div className="flex gap-2">
                          {[0, 1, 2, 3, 4].map(level => (
                            <button
                              key={level}
                              type="button"
                              onClick={() => handleSelectScore(index, level)}
                              className={`w-10 h-8 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-110 ${
                                level <= 2
                                  ? `${getZoneBgClass('green', 'light')} ${getZoneTextClass('green')} hover:${getZoneBgClass('green', 'medium')} border-2 border-zone-green/30`
                                  : level <= 4
                                    ? `${getZoneBgClass('yellow', 'light')} ${getZoneTextClass('yellow')} hover:${getZoneBgClass('yellow', 'medium')} border-2 border-zone-yellow/30`
                                    : `${getZoneBgClass('red', 'light')} ${getZoneTextClass('red')} hover:${getZoneBgClass('red', 'medium')} border-2 border-zone-red/30`
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
            disabled={symptoms.filter(s => s.score > 0).length === 0}
            className="flex-1 relative"
          >
            {editingSymptom
              ? 'Update Symptom'
              : `Add Symptoms (${symptoms.filter(s => s.score > 0).length})`}
          </Button>
        </div>
      </form>
    </div>
  );
}
