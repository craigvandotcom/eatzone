'use client';

import type React from 'react';
import type { Symptom, MSQScore } from '@/lib/types';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  X,
  FileText
} from 'lucide-react';
import { getZoneBgClass, getZoneTextClass } from '@/lib/utils/zone-colors';
import { 
  searchSymptoms,
  getSymptomsByCategories,
  getSymptomById,
  isValidSymptomId,
  type SearchResult
} from '@/lib/msq/search';
import { debounce } from '@/lib/utils/debounce';
import { cn } from '@/lib/utils';
import DOMPurify from 'isomorphic-dompurify';

interface SelectedSymptom {
  symptom_id: string;
  category: string;
  name: string;
  score?: MSQScore;
}

interface MSQSymptomEntryFormProps {
  onAddSymptom: (symptom: Omit<Symptom, 'id' | 'timestamp'>) => void;
  onClose: () => void;
  editingSymptom?: Symptom | null;
  className?: string;
  isSubmitting?: boolean;
}

export function MSQSymptomEntryForm({
  onAddSymptom,
  onClose,
  editingSymptom,
  className,
  isSubmitting = false,
}: MSQSymptomEntryFormProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Selected symptoms state
  const [selectedSymptoms, setSelectedSymptoms] = useState<SelectedSymptom[]>([]);
  
  // UI state
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [msqMode, setMSQMode] = useState(false);
  
  // Error handling state
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Get category overview for empty state
  const categoryOverview = useMemo(() => getSymptomsByCategories(), []);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      if (query.trim().length === 0) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      
      if (query.trim().length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      const results = searchSymptoms(query.trim(), 15);
      setSearchResults(results);
      setIsSearching(false);
    }, 300),
    []
  );

  // Cleanup debounced search on unmount
  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  // Pre-populate form when editing
  useEffect(() => {
    if (editingSymptom) {
      // Convert existing symptom to MSQ format for editing
      setSelectedSymptoms([{
        symptom_id: editingSymptom.symptom_id,
        category: editingSymptom.category,
        name: editingSymptom.name,
        score: editingSymptom.score
      }]);
      setNotes(editingSymptom.notes || '');
      setShowNotes(!!editingSymptom.notes);
    } else {
      // Reset form for new entry
      setSelectedSymptoms([]);
      setNotes('');
      setShowNotes(false);
    }
  }, [editingSymptom]);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsSearching(query.trim().length >= 2);
    debouncedSearch(query);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  // Add symptom to selection with validation
  const addSymptom = (symptomId: string) => {
    // Validate symptom ID
    if (!isValidSymptomId(symptomId)) {
      setError(`Invalid symptom ID: ${symptomId}`);
      return;
    }
    
    const symptom = getSymptomById(symptomId);
    if (!symptom) {
      setError(`Symptom not found: ${symptomId}`);
      return;
    }
    
    // Clear error on successful operation
    setError(null);

    // Check if already selected
    const existing = selectedSymptoms.find(s => s.symptom_id === symptomId);
    if (existing) return;

    const newSymptom: SelectedSymptom = {
      symptom_id: symptom.id,
      category: symptom.category,
      name: symptom.name,
      score: undefined // Will be set when user clicks score
    };

    setSelectedSymptoms([...selectedSymptoms, newSymptom]);
    
    // Clear search after selection to show category overview
    if (!msqMode) {
      clearSearch();
    }
  };

  // Set score for a symptom with validation
  const setSymptomScore = (symptomId: string, score: MSQScore) => {
    // Validate score range (0-4)
    if (score < 0 || score > 4 || !Number.isInteger(score)) {
      setError(`Invalid score: ${score}. Score must be between 0 and 4.`);
      return;
    }
    
    // Validate symptom ID
    if (!isValidSymptomId(symptomId)) {
      setError(`Invalid symptom ID: ${symptomId}`);
      return;
    }
    
    setSelectedSymptoms(symptoms => 
      symptoms.map(s => 
        s.symptom_id === symptomId ? { ...s, score } : s
      )
    );
    
    // Clear error on successful operation
    setError(null);
    
    // Clear validation error for this symptom if it exists
    if (validationErrors[symptomId]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[symptomId];
        return updated;
      });
    }
  };

  // Remove symptom from selection
  const removeSymptom = (symptomId: string) => {
    setSelectedSymptoms(symptoms => 
      symptoms.filter(s => s.symptom_id !== symptomId)
    );
  };

  // Get score button styling based on score value (memoized for performance)
  const getScoreButtonStyle = useCallback((score: number, currentScore?: number) => {
    const isSelected = currentScore === score;
    
    let baseStyle = 'w-10 h-8 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105 border-2 ';
    
    if (score === 0) {
      baseStyle += isSelected 
        ? 'bg-gray-200 text-gray-800 border-gray-400'
        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100';
    } else if (score <= 2) {
      baseStyle += isSelected
        ? `${getZoneBgClass('yellow', 'medium')} ${getZoneTextClass('yellow')} border-yellow-400`
        : `${getZoneBgClass('yellow', 'light')} ${getZoneTextClass('yellow')} border-yellow-200 hover:${getZoneBgClass('yellow', 'medium')}`;
    } else {
      baseStyle += isSelected
        ? `${getZoneBgClass('red', 'medium')} ${getZoneTextClass('red')} border-red-400`
        : `${getZoneBgClass('red', 'light')} ${getZoneTextClass('red')} border-red-200 hover:${getZoneBgClass('red', 'medium')}`;
    }
    
    return baseStyle;
  }, []);

  // Submit symptoms with comprehensive validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    setValidationErrors({});
    
    // Validate selected symptoms
    const newValidationErrors: Record<string, string> = {};
    const validSymptoms = selectedSymptoms.filter(s => {
      // Check if symptom has a score
      if (s.score === undefined) {
        newValidationErrors[s.symptom_id] = 'Score is required';
        return false;
      }
      
      // Validate symptom ID
      if (!isValidSymptomId(s.symptom_id)) {
        newValidationErrors[s.symptom_id] = 'Invalid symptom ID';
        return false;
      }
      
      // Validate score range
      if (s.score < 0 || s.score > 4 || !Number.isInteger(s.score)) {
        newValidationErrors[s.symptom_id] = 'Score must be between 0 and 4';
        return false;
      }
      
      return true;
    });
    
    // If there are validation errors, show them and return
    if (Object.keys(newValidationErrors).length > 0) {
      setValidationErrors(newValidationErrors);
      setError('Please fix the validation errors before submitting.');
      return;
    }
    
    if (validSymptoms.length === 0) {
      setError('Please select at least one symptom and set its score.');
      return;
    }

    try {
      // Sanitize notes input
      const sanitizedNotes = notes.trim() ? DOMPurify.sanitize(notes.trim()) : undefined;
      
      // Submit symptoms with Promise.all for better error handling
      const symptomPromises = validSymptoms.map(async (symptom) => {
        const symptomData: Omit<Symptom, 'id' | 'timestamp'> = {
          symptom_id: symptom.symptom_id,
          category: symptom.category,
          name: symptom.name,
          score: symptom.score!,
          notes: sanitizedNotes,
        };
        return onAddSymptom(symptomData);
      });
      
      await Promise.all(symptomPromises);
    } catch (err) {
      setError('Failed to submit symptoms. Please try again.');
      console.error('Error submitting symptoms:', err);
      return;
    }

    // Reset form
    setSelectedSymptoms([]);
    setSearchQuery('');
    setSearchResults([]);
    setNotes('');
    setShowNotes(false);
    setMSQMode(false);
    onClose();
  };

  return (
    <div className={cn(className)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <div className="text-red-600 text-sm">
                <strong>Error:</strong> {error}
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
                title="Dismiss error"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        
        {/* Search Input */}
        <div>
          <Label htmlFor="symptom-search">Search Symptoms</Label>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="symptom-search"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search symptoms... (e.g., headache, fatigue, bloating)"
              className="pl-10 pr-10"
              autoFocus={!editingSymptom}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div>
            <Label className="text-sm text-gray-600">Matching symptoms:</Label>
            <div className="mt-2">
              <div className="space-y-2">
                  {searchResults.map((result) => {
                    const isSelected = selectedSymptoms.some(s => s.symptom_id === result.symptom.id);
                    const selectedSymptom = selectedSymptoms.find(s => s.symptom_id === result.symptom.id);
                    
                    return (
                      <div
                        key={result.symptom.id}
                        className={`p-3 rounded-lg border transition-colors ${
                          isSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1">
                            <span className="text-lg">{result.symptom.categoryIcon}</span>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{result.symptom.name}</div>
                              <div className="text-xs text-gray-500">{result.symptom.category} category</div>
                            </div>
                          </div>
                          
                          {/* Score Buttons */}
                          {!isSelected ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addSymptom(result.symptom.id)}
                              className="ml-2"
                            >
                              Add
                            </Button>
                          ) : (
                            <div className="flex gap-1 ml-2">
                              {[0, 1, 2, 3, 4].map(score => (
                                <button
                                  key={score}
                                  type="button"
                                  onClick={() => setSymptomScore(result.symptom.id, score as MSQScore)}
                                  className={getScoreButtonStyle(score, selectedSymptom?.score)}
                                  title={`Score: ${score}`}
                                >
                                  {score}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Empty State - Category Overview */}
        {!isSearching && searchQuery.trim().length === 0 && searchResults.length === 0 && (
          <div className="space-y-4">
            {!msqMode && (
              <div className="text-center py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMSQMode(true)}
                  className="mb-4"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Complete MSQ Assessment (65+ symptoms)
                </Button>
              </div>
            )}
            
            <div>
              <Label className="text-sm text-gray-600">Quick Categories:</Label>
              <div className="mt-2">
                <div className="space-y-2">
                    {categoryOverview
                      .sort((a, b) => a.category.name.localeCompare(b.category.name))
                      .map(({ category }) => (
                      <div
                        key={category.name}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => {
                          const query = category.name.toLowerCase();
                          setSearchQuery(query);
                          setIsSearching(true);
                          debouncedSearch(query);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{category.icon}</span>
                          <span className="text-sm font-medium flex-1">{category.name}</span>
                          <span className="text-xs text-gray-500">({category.count})</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selected Symptoms */}
        {selectedSymptoms.length > 0 && (
          <div>
            <Label>Selected Symptoms ({selectedSymptoms.length})</Label>
            <div className="mt-2">
              <div className="space-y-2">
                  {selectedSymptoms.map((symptom) => (
                    <div
                      key={symptom.symptom_id}
                      className={`bg-blue-50 rounded-lg p-3 ${
                        validationErrors[symptom.symptom_id] 
                          ? 'border-2 border-red-300' 
                          : 'border border-blue-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1">
                          <span className="font-medium text-sm">{symptom.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {symptom.category}
                          </Badge>
                          {symptom.score !== undefined && (
                            <Badge 
                              className={`text-xs ${
                                symptom.score === 0 ? 'bg-gray-100 text-gray-700' :
                                symptom.score <= 2 ? `${getZoneBgClass('yellow', 'light')} ${getZoneTextClass('yellow')}` :
                                `${getZoneBgClass('red', 'light')} ${getZoneTextClass('red')}`
                              }`}
                            >
                              {symptom.score}/4
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {/* Score Buttons */}
                          <div className="flex gap-1">
                            {[0, 1, 2, 3, 4].map(score => (
                              <button
                                key={score}
                                type="button"
                                onClick={() => setSymptomScore(symptom.symptom_id, score as MSQScore)}
                                className={getScoreButtonStyle(score, symptom.score)}
                                title={`Score: ${score}`}
                              >
                                {score}
                              </button>
                            ))}
                          </div>
                          
                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => removeSymptom(symptom.symptom_id)}
                            className={`p-1 ml-2 text-gray-400 hover:${getZoneTextClass('red')} transition-colors`}
                            title="Remove symptom"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Validation Error for this symptom */}
                      {validationErrors[symptom.symptom_id] && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                          {validationErrors[symptom.symptom_id]}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
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

        {/* Submit Buttons */}
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
              disabled={selectedSymptoms.filter(s => s.score !== undefined).length === 0 || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                editingSymptom ? 'Updating...' : 'Adding Symptoms...'
              ) : (
                editingSymptom
                  ? 'Update Symptom'
                  : `Add Symptoms (${selectedSymptoms.filter(s => s.score !== undefined).length})`
              )}
            </Button>
        </div>
      </form>
    </div>
  );
}