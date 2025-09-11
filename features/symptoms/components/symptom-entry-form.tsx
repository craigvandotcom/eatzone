'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Symptom, SymptomCategory } from '@/lib/types';
import {
  SYMPTOMS,
  SYMPTOM_CATEGORIES,
  SymptomDefinition,
} from '@/lib/symptoms/symptom-index';
import { TimestampEditor } from '@/components/shared/timestamp-editor';

interface SymptomEntryFormProps {
  onAddSymptom: (
    symptoms: Omit<Symptom, 'id' | 'timestamp'>[],
    timestamps?: Date[]
  ) => Promise<void>;
  onClose?: () => void;
  onDelete?: () => Promise<void>;
  editingSymptom?: Symptom;
  className?: string;
}

export function SymptomEntryForm({
  onAddSymptom,
  onClose,
  onDelete,
  editingSymptom,
  className = '',
}: SymptomEntryFormProps) {
  // State management
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<
    Array<{
      symptom_id: string;
      category: SymptomCategory;
      name: string;
      startTime: Date;
    }>
  >([]);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with editing symptom data
  useEffect(() => {
    if (editingSymptom) {
      setSelectedSymptoms([
        {
          symptom_id: editingSymptom.symptom_id,
          category: editingSymptom.category,
          name: editingSymptom.name,
          startTime: new Date(editingSymptom.timestamp),
        },
      ]);
      setNotes(editingSymptom.notes || '');
      if (editingSymptom.notes) {
        setShowNotes(true);
      }
    }
  }, [editingSymptom]);

  // Category overview for quick access
  const categoryOverview = useMemo(() => {
    return SYMPTOM_CATEGORIES.map(category => ({
      category,
      symptoms: SYMPTOMS.filter(s => s.category === category.name),
    }));
  }, []);

  // Toggle category accordion
  const toggleCategory = useCallback((categoryName: string) => {
    setExpandedCategory(prev => (prev === categoryName ? null : categoryName));
  }, []);

  // Add symptom to selection staging area
  const addSymptom = useCallback(
    (symptom: SymptomDefinition) => {
      // Check if already selected
      if (selectedSymptoms.some(s => s.symptom_id === symptom.id)) {
        setError(`${symptom.name} is already selected.`);
        return;
      }

      const newSymptom = {
        symptom_id: symptom.id,
        category: symptom.category,
        name: symptom.name,
        startTime: new Date(), // Default to now, user can adjust
      };

      setSelectedSymptoms(prev => [...prev, newSymptom]);
      setExpandedCategory(null); // Close accordion after selection
      setError(null);
    },
    [selectedSymptoms]
  );

  // Update symptom start time
  const updateSymptomStartTime = useCallback(
    (symptomId: string, startTime: Date) => {
      setSelectedSymptoms(symptoms =>
        symptoms.map(s =>
          s.symptom_id === symptomId ? { ...s, startTime } : s
        )
      );
    },
    []
  );

  // Remove symptom from selection
  const removeSymptom = useCallback((symptomId: string) => {
    setSelectedSymptoms(symptoms =>
      symptoms.filter(s => s.symptom_id !== symptomId)
    );
  }, []);

  // Submit symptoms
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setError(null);

    if (selectedSymptoms.length === 0) {
      setError('Please select at least one symptom.');
      return;
    }

    try {
      const symptomsToSubmit = selectedSymptoms.map(s => ({
        symptom_id: s.symptom_id,
        category: s.category,
        name: s.name,
        notes: notes.trim() || undefined,
      }));

      const timestamps = selectedSymptoms.map(s => s.startTime);

      await onAddSymptom(symptomsToSubmit, timestamps);

      // Reset form
      setSelectedSymptoms([]);
      setNotes('');
      setShowNotes(false);
      setError(null);
      setExpandedCategory(null);

      onClose?.();
    } catch (error) {
      console.error('Error submitting symptoms:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to save symptoms. Please try again.'
      );
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Accordion Category Selection - Only show when no symptoms selected */}
          {selectedSymptoms.length === 0 && (
            <div>
              <Label className="text-sm text-muted-foreground">
                Browse by Category:
              </Label>
              <div className="mt-2 space-y-2">
                {categoryOverview.map(({ category, symptoms }) => (
                  <div key={category.name} className="space-y-2">
                    {/* Category Header */}
                    <div
                      className="p-3 bg-muted rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => toggleCategory(category.name)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{category.icon}</span>
                          <div className="flex-1">
                            <div className="text-base font-semibold">
                              {category.displayName}
                            </div>
                          </div>
                        </div>
                        {expandedCategory === category.name ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Symptoms */}
                    {expandedCategory === category.name && (
                      <div className="ml-6 space-y-1">
                        {symptoms.map(symptom => (
                          <div
                            key={symptom.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                            onClick={() => addSymptom(symptom)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {symptom.categoryIcon}
                              </span>
                              <span className="text-sm font-medium">
                                {symptom.name}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Symptoms */}
          {selectedSymptoms.length > 0 && (
            <div>
              <Label>Selected Symptoms</Label>
              <div className="mt-2 space-y-3">
                {selectedSymptoms.map(symptom => {
                  // Get the category info to access the emoji
                  const categoryInfo = SYMPTOM_CATEGORIES.find(
                    c => c.name === symptom.category
                  );
                  return (
                    <div
                      key={symptom.symptom_id}
                      className="bg-card rounded-lg p-4 border border-border/50"
                    >
                      {/* Inline Symptom Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">
                            {categoryInfo?.icon || '⚡'}
                          </div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {symptom.name}
                            </h3>
                            <Badge variant="outline" className="text-xs border-green-500 text-green-400">
                              {symptom.category}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSymptom(symptom.symptom_id)}
                          className="text-xs"
                        >
                          Change
                        </Button>
                      </div>

                      {/* Start Time Editor */}
                      <TimestampEditor
                        value={symptom.startTime}
                        onChange={date =>
                          updateSymptomStartTime(symptom.symptom_id, date)
                        }
                        label="When did this symptom start?"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes Section */}
          <div>
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
                  placeholder="Any additional context about these symptoms..."
                  className="min-h-[80px]"
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            {onDelete && (
              <Button
                type="button"
                variant="outline"
                onClick={onDelete}
                className="bg-transparent text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                Delete
              </Button>
            )}
            <Button
              type="submit"
              disabled={selectedSymptoms.length === 0}
              className="flex-1"
            >
              {editingSymptom ? 'Update Symptom' : 'Save Symptoms'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
