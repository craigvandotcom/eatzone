'use client';

import type React from 'react';
import type { Symptom, MSQScore } from '@/lib/types';

import { useState, useEffect, useMemo } from 'react';
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
  type SearchResult
} from '@/lib/msq/search';
import { debounce } from '@/lib/utils/debounce';
import { cn } from '@/lib/utils';

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

  // Add symptom to selection
  const addSymptom = (symptomId: string) => {
    const symptom = getSymptomById(symptomId);
    if (!symptom) return;

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

  // Set score for a symptom
  const setSymptomScore = (symptomId: string, score: MSQScore) => {
    setSelectedSymptoms(symptoms => 
      symptoms.map(s => 
        s.symptom_id === symptomId ? { ...s, score } : s
      )
    );
  };

  // Remove symptom from selection
  const removeSymptom = (symptomId: string) => {
    setSelectedSymptoms(symptoms => 
      symptoms.filter(s => s.symptom_id !== symptomId)
    );
  };

  // Get score button styling based on score value
  const getScoreButtonStyle = (score: number, currentScore?: number) => {
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
  };

  // Submit symptoms
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validSymptoms = selectedSymptoms.filter(s => s.score !== undefined);
    if (validSymptoms.length === 0) return;

    // Submit each symptom individually (current behavior for backward compatibility)
    validSymptoms.forEach(symptom => {
      const symptomData: Omit<Symptom, 'id' | 'timestamp'> = {
        symptom_id: symptom.symptom_id,
        category: symptom.category,
        name: symptom.name,
        score: symptom.score!,
        notes: notes.trim() || undefined,
      };
      onAddSymptom(symptomData);
    });

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
    <div className={cn("flex flex-col h-full", className)}>
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Search Input - Fixed Header */}
        <div className="flex-shrink-0 pb-4">
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

        {/* Main Content Area - Scrollable */}
        <div className="flex-1 min-h-0 space-y-4">
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="flex flex-col min-h-0">
              <Label className="text-sm text-gray-600 flex-shrink-0">Matching symptoms:</Label>
              <div className="flex-1 mt-2 min-h-0">
                <div className="h-full overflow-y-auto space-y-2 pr-1" style={{ maxHeight: '300px' }}>
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
            <div className="flex flex-col min-h-0 space-y-4">
              {!msqMode && (
                <div className="text-center py-4 flex-shrink-0">
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
              
              <div className="flex flex-col min-h-0">
                <Label className="text-sm text-gray-600 flex-shrink-0">Quick Categories:</Label>
                <div className="overflow-y-auto mt-2" style={{ maxHeight: '400px' }}>
                  <div className="grid grid-cols-2 gap-2">
                    {categoryOverview.map(({ category }) => (
                      <div
                        key={category.name}
                        className="p-2 bg-gray-50 rounded-lg text-center hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => {
                          const query = category.name.toLowerCase();
                          setSearchQuery(query);
                          setIsSearching(true);
                          debouncedSearch(query);
                        }}
                      >
                        <div className="text-lg mb-1">{category.icon}</div>
                        <div className="text-xs font-medium">{category.name}</div>
                        <div className="text-xs text-gray-500">({category.count})</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Selected Symptoms */}
          {selectedSymptoms.length > 0 && (
            <div className="flex flex-col min-h-0">
              <Label className="flex-shrink-0">Selected Symptoms ({selectedSymptoms.length})</Label>
              <div className="overflow-y-auto mt-2" style={{ maxHeight: '200px' }}>
                <div className="space-y-2 pr-1">
                  {selectedSymptoms.map((symptom) => (
                    <div
                      key={symptom.symptom_id}
                      className="bg-blue-50 border border-blue-200 rounded-lg p-3"
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
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section - Fixed */}
        <div className="flex-shrink-0 space-y-4 pt-4 border-t">
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
          <div className="flex gap-2">
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
        </div>
      </form>
    </div>
  );
}