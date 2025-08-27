'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Search, X, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Symptom, DeltaScore, SymptomCategory } from '@/lib/types';
import {
  SYMPTOMS,
  SYMPTOM_CATEGORIES,
  SymptomDefinition,
  searchSymptoms,
  DELTA_SCORE_LABELS,
  DELTA_SCORE_DESCRIPTIONS,
} from '@/lib/symptoms/symptom-index';
import { getZoneBgClass, getZoneTextClass } from '@/lib/utils/zone-colors';

interface SymptomEntryFormProps {
  onAddSymptom: (
    symptoms: Omit<Symptom, 'id' | 'timestamp'>[]
  ) => Promise<void>;
  onClose?: () => void;
  onDelete?: () => Promise<void>;
  editingSymptom?: Symptom;
  className?: string;
  isSubmitting?: boolean;
}

export function SymptomEntryForm({
  onAddSymptom,
  onClose,
  onDelete,
  editingSymptom: _editingSymptom,
  className = '',
  isSubmitting = false,
}: SymptomEntryFormProps) {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<
    Array<{
      symptom_id: string;
      category: SymptomCategory;
      name: string;
      score?: DeltaScore;
    }>
  >([]);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchSymptoms(searchQuery);
  }, [searchQuery]);

  // Category overview for quick access
  const categoryOverview = useMemo(() => {
    return SYMPTOM_CATEGORIES.map(category => ({
      category,
      symptoms: SYMPTOMS.filter(s => s.category === category.name),
    }));
  }, []);

  // Add symptom to selection
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
        score: undefined as DeltaScore | undefined,
      };

      setSelectedSymptoms(prev => [...prev, newSymptom]);
      setSearchQuery(''); // Clear search after adding
      setError(null);
    },
    [selectedSymptoms]
  );

  // Set score for a symptom
  const setSymptomScore = useCallback(
    (symptomId: string, score: DeltaScore) => {
      setSelectedSymptoms(symptoms =>
        symptoms.map(s => (s.symptom_id === symptomId ? { ...s, score } : s))
      );

      // Clear validation error for this symptom if it exists
      if (validationErrors[symptomId]) {
        setValidationErrors(prev => {
          const updated = { ...prev };
          delete updated[symptomId];
          return updated;
        });
      }
    },
    [validationErrors]
  );

  // Remove symptom from selection
  const removeSymptom = useCallback((symptomId: string) => {
    setSelectedSymptoms(symptoms =>
      symptoms.filter(s => s.symptom_id !== symptomId)
    );
  }, []);

  // Get score button styling based on delta value
  const getDeltaButtonStyle = useCallback(
    (score: number, currentScore?: number) => {
      const isSelected = currentScore === score;

      let baseStyle =
        'min-w-[3rem] h-8 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 border-2 ';

      if (score < 0) {
        // Negative scores (worse)
        baseStyle += isSelected
          ? `${getZoneBgClass('red', 'medium')} ${getZoneTextClass('red')} border-red-400`
          : `${getZoneBgClass('red', 'light')} ${getZoneTextClass('red')} border-red-200 hover:${getZoneBgClass('red', 'medium')}`;
      } else if (score === 0) {
        // Baseline
        baseStyle += isSelected
          ? 'bg-gray-200 text-gray-800 border-gray-400'
          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100';
      } else {
        // Positive scores (better)
        baseStyle += isSelected
          ? `${getZoneBgClass('green', 'medium')} ${getZoneTextClass('green')} border-green-400`
          : `${getZoneBgClass('green', 'light')} ${getZoneTextClass('green')} border-green-200 hover:${getZoneBgClass('green', 'medium')}`;
      }

      return baseStyle;
    },
    []
  );

  // Submit symptoms
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setError(null);
    setValidationErrors({});

    // Validate selected symptoms
    const newValidationErrors: Record<string, string> = {};
    const validSymptoms = selectedSymptoms.filter(s => {
      if (s.score === undefined) {
        newValidationErrors[s.symptom_id] = 'Score is required';
        return false;
      }
      return true;
    });

    if (Object.keys(newValidationErrors).length > 0) {
      setValidationErrors(newValidationErrors);
      setError('Please set a score for all selected symptoms.');
      return;
    }

    if (validSymptoms.length === 0) {
      setError('Please select at least one symptom and set its score.');
      return;
    }

    try {
      const symptomsToSubmit = validSymptoms.map(s => ({
        symptom_id: s.symptom_id,
        category: s.category,
        name: s.name,
        score: s.score!,
        notes: notes.trim() || undefined,
      }));

      await onAddSymptom(symptomsToSubmit);

      // Reset form
      setSelectedSymptoms([]);
      setNotes('');
      setSearchQuery('');
      setShowNotes(false);
      setError(null);
      setValidationErrors({});

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
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Track Symptoms</h3>
              <p className="text-sm text-gray-600">
                Rate how you feel compared to your normal baseline
              </p>
            </div>
            {onClose && (
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Search */}
          <div>
            <Label htmlFor="symptom-search">Search Symptoms</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="symptom-search"
                type="text"
                placeholder="Search for symptoms (e.g., nausea, fatigue, bloating...)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div>
              <Label className="text-sm text-gray-600">Search Results:</Label>
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {searchResults.map(symptom => (
                  <div
                    key={symptom.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{symptom.categoryIcon}</span>
                      <span className="text-sm font-medium">
                        {symptom.name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {symptom.category}
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => addSymptom(symptom)}
                      disabled={selectedSymptoms.some(
                        s => s.symptom_id === symptom.id
                      )}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Overview (when no search) */}
          {!searchQuery.trim() && (
            <div>
              <Label className="text-sm text-gray-600">
                Browse by Category:
              </Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {categoryOverview.map(({ category }) => (
                  <div
                    key={category.name}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() =>
                      setSearchQuery(category.displayName.toLowerCase())
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{category.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {category.displayName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {category.count} symptoms
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Symptoms */}
          {selectedSymptoms.length > 0 && (
            <div>
              <Label>Selected Symptoms ({selectedSymptoms.length})</Label>
              <div className="mt-2 space-y-3">
                {selectedSymptoms.map(symptom => (
                  <div
                    key={symptom.symptom_id}
                    className={`bg-blue-50 rounded-lg p-4 ${
                      validationErrors[symptom.symptom_id]
                        ? 'border-2 border-red-300'
                        : 'border border-blue-200'
                    }`}
                  >
                    {/* Symptom Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {symptom.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {symptom.category}
                        </Badge>
                        {symptom.score !== undefined && (
                          <Badge
                            className={`text-xs ${
                              symptom.score < 0
                                ? `${getZoneBgClass('red', 'light')} ${getZoneTextClass('red')}`
                                : symptom.score === 0
                                  ? 'bg-gray-100 text-gray-700'
                                  : `${getZoneBgClass('green', 'light')} ${getZoneTextClass('green')}`
                            }`}
                          >
                            {symptom.score > 0 ? '+' : ''}
                            {symptom.score} (
                            {
                              DELTA_SCORE_LABELS[
                                symptom.score.toString() as keyof typeof DELTA_SCORE_LABELS
                              ]
                            }
                            )
                          </Badge>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSymptom(symptom.symptom_id)}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Delta Scale Rating */}
                    <div className="space-y-2">
                      <div className="text-xs text-gray-600 font-medium">
                        How does this feel compared to your normal baseline?
                      </div>
                      <div className="flex gap-1 justify-center">
                        {[-2, -1, 0, 1, 2].map(score => (
                          <button
                            key={score}
                            type="button"
                            onClick={() =>
                              setSymptomScore(
                                symptom.symptom_id,
                                score as DeltaScore
                              )
                            }
                            className={getDeltaButtonStyle(
                              score,
                              symptom.score
                            )}
                            title={`${score > 0 ? '+' : ''}${score}: ${DELTA_SCORE_LABELS[score.toString() as keyof typeof DELTA_SCORE_LABELS]} - ${DELTA_SCORE_DESCRIPTIONS[score.toString() as keyof typeof DELTA_SCORE_DESCRIPTIONS]}`}
                          >
                            {score > 0 ? '+' : ''}
                            {score}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 px-1">
                        <span>Much Worse</span>
                        <span>Baseline</span>
                        <span>Much Better</span>
                      </div>
                    </div>

                    {/* Validation Error */}
                    {validationErrors[symptom.symptom_id] && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                        {validationErrors[symptom.symptom_id]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes Section */}
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
              disabled={selectedSymptoms.length === 0 || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Saving...' : 'Save Symptoms'}
            </Button>
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
