'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Search, X, ChevronDown, ChevronUp, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Symptom, SymptomScore, SymptomCategory } from '@/lib/types';
import {
  SYMPTOMS,
  SYMPTOM_CATEGORIES,
  SymptomDefinition,
  searchSymptoms,
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
  isSubmitting?: boolean;
}

export function SymptomEntryForm({
  onAddSymptom,
  onClose,
  onDelete,
  editingSymptom,
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

  // Add symptom to selection (automatically sets as present)
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
      setSearchQuery(''); // Clear search after adding
      setError(null);
    },
    [selectedSymptoms]
  );

  // Update symptom start time
  const updateSymptomStartTime = useCallback(
    (symptomId: string, startTime: Date) => {
      setSelectedSymptoms(symptoms =>
        symptoms.map(s => (s.symptom_id === symptomId ? { ...s, startTime } : s))
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
        score: 1 as SymptomScore, // Always 1 (present) since selection = presence
        notes: notes.trim() || undefined,
      }));
      
      const timestamps = selectedSymptoms.map(s => s.startTime);

      await onAddSymptom(symptomsToSubmit, timestamps);

      // Reset form
      setSelectedSymptoms([]);
      setNotes('');
      setSearchQuery('');
      setShowNotes(false);
      setError(null);

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
                Add symptoms you're currently experiencing
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
                {searchResults.map(symptom => {
                  const isSelected = selectedSymptoms.some(
                    s => s.symptom_id === symptom.id
                  );
                  return (
                    <div
                      key={symptom.id}
                      className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                        isSelected 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{symptom.categoryIcon}</span>
                        <span className="text-sm font-medium">
                          {symptom.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {symptom.category}
                        </Badge>
                        {isSelected && (
                          <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                            <Check className="h-3 w-3 mr-1" />
                            Added
                          </Badge>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant={isSelected ? "secondary" : "outline"}
                        onClick={() => addSymptom(symptom)}
                        disabled={isSelected}
                      >
                        {isSelected ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Plus className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  );
                })}
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
                    className="bg-green-50 rounded-lg p-4 border border-green-200"
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
                        <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                          Present
                        </Badge>
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

                    {/* Start Time Editor */}
                    <TimestampEditor
                      value={symptom.startTime}
                      onChange={(date) => updateSymptomStartTime(symptom.symptom_id, date)}
                      label="When did this symptom start?"
                      description="Select when you first noticed this symptom"
                    />
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
              {isSubmitting
                ? 'Saving...'
                : editingSymptom
                  ? 'Update Symptom'
                  : 'Save Symptoms'}
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