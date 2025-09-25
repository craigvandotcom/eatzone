'use client';

import type React from 'react';
import type { Food, Ingredient } from '@/lib/types';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Edit2,
  Trash2,
  Leaf,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getZoneColor,
  getZoneBgClass,
  getZoneTextClass,
} from '@/lib/utils/zone-colors';
import { DayTimePicker } from '@/components/ui/day-time-picker';
import {
  FormLoadingOverlay,
  LoadingSpinner,
} from '@/components/ui/loading-states';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { sanitizeIngredientName } from '@/lib/security/sanitization';
import {
  processFoodSubmission,
  type FoodSubmissionData,
} from '@/lib/services/food-submission';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface FoodEntryFormProps {
  onAddFood: (food: Omit<Food, 'id'>) => void;
  onClose: () => void;
  onDelete?: () => void;
  editingFood?: Food | null;
  imageData?: string; // Base64 image data for AI analysis (backward compatibility)
  capturedImages?: string[]; // Multiple images from camera capture
  className?: string;
}

export function FoodEntryForm({
  onAddFood,
  onClose: _onClose,
  onDelete,
  editingFood,
  imageData,
  capturedImages,
  className,
}: FoodEntryFormProps) {
  const [name, setName] = useState('');
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<Date>(new Date());

  // Image gallery state
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);

  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isZoning, setIsZoning] = useState(false);
  const analysisAbortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const analysisInitiatedRef = useRef(false);

  // Helper function to get image array from various sources
  const getImageArray = (): string[] => {
    // Priority 1: Multiple images from camera capture
    if (capturedImages?.length) return capturedImages;

    // Priority 2: Single image from camera capture (backward compatibility)
    if (imageData && !editingFood) return [imageData];

    // Priority 3: Editing existing food with multiple images
    if (editingFood?.image_urls?.length) return editingFood.image_urls;

    // Priority 4: Editing existing food with single image (backward compatibility)
    if (editingFood?.photo_url) return [editingFood.photo_url];

    return [];
  };

  // Handle image click for primary selection
  const handleImageClick = (clickedIndex: number) => {
    setPrimaryImageIndex(clickedIndex);
  };

  // Unified AI Analysis function that handles both single and multiple images
  const analyzeImages = useCallback(
    async (images: string[]) => {
      const imageCount = images.length;
      // Get current name value to avoid stale closure
      const currentName = name;
      logger.debug('analyzeImages called', {
        imageCount,
        currentName,
        isAnalyzing,
        hasAnalyzed,
      });

      // Cancel any existing analysis
      if (analysisAbortControllerRef.current) {
        analysisAbortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      const abortController = new AbortController();
      analysisAbortControllerRef.current = abortController;

      if (!isMountedRef.current) return;

      // Validate all images
      const invalidImages = images.filter(
        img => !img || !img.startsWith('data:image/')
      );
      if (invalidImages.length > 0) {
        logger.error('Invalid image data format', {
          totalImages: images.length,
          invalidCount: invalidImages.length,
        });
        setAnalysisError('Invalid image data. Please try capturing again.');
        toast.error('Invalid image data. Please try capturing again.');
        return;
      }

      setIsAnalyzing(true);
      setAnalysisError(null);

      try {
        logger.debug('Sending images to analyze-image API', {
          imageCount: images.length,
          imageSizes: images.map(img => img.length),
        });

        // Send single image or multiple images based on count
        const requestBody =
          imageCount === 1 ? { image: images[0] } : { images: images };

        const response = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: abortController.signal,
        });

        // Check if request was aborted
        if (abortController.signal.aborted) {
          logger.debug('Analysis request was aborted');
          return;
        }

        if (!response.ok) {
          const errorText = await response
            .text()
            .catch(() => 'Failed to read error response');
          let errorData = null;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText };
          }
          logger.error('Image analysis API error', {
            status: response.status,
            statusText: response.statusText,
            errorData,
            errorText: errorText.substring(0, 500), // Log first 500 chars
          });
          throw new Error(
            `Analysis failed with status ${response.status}: ${errorData?.error?.message || errorData?.message || 'Unknown error'}`
          );
        }

        const { mealSummary, ingredients: ingredientData } =
          await response.json();

        logger.debug('Analysis successful', {
          mealSummary,
          ingredientCount: ingredientData?.length,
        });

        // Check again if component is still mounted and request wasn't aborted
        if (!isMountedRef.current || abortController.signal.aborted) {
          return;
        }

        const aiIngredients: Ingredient[] = ingredientData.map(
          (ingredient: { name: string; organic: boolean }): Ingredient => ({
            name: ingredient.name,
            organic: ingredient.organic || false,
            group: 'other', // Default value
            zone: 'unzoned', // Default value - will be zoned later
          })
        );

        setIngredients(aiIngredients);
        // Set the meal summary as the default name if not already set
        if (!currentName && mealSummary) {
          setName(mealSummary);
        }
        setHasAnalyzed(true);

        // Provide better messaging based on number of ingredients found
        if (ingredientData.length === 0) {
          // No ingredients detected - not an error, just guidance
          const noIngredientsMessage =
            imageCount === 1
              ? 'No ingredients detected. Try retaking the photo or add ingredients manually.'
              : `No ingredients detected in ${imageCount} images. Try retaking photos or add ingredients manually.`;
          toast.info(noIngredientsMessage);
        } else {
          // Ingredients found - success message
          const successMessage =
            imageCount === 1
              ? `Found ${ingredientData.length} ingredients for review.`
              : `Found ${ingredientData.length} ingredients from ${imageCount} images for review.`;
          toast.success(successMessage);
        }
      } catch (error) {
        // Don't show error if request was aborted
        if (error instanceof Error && error.name === 'AbortError') {
          logger.debug('Analysis aborted by user');
          return;
        }

        if (!isMountedRef.current) return;

        logger.error('Image analysis failed', {
          error: error instanceof Error ? error.message : String(error),
          imageCount,
        });

        // More user-friendly error message for technical failures
        const errorMessage =
          imageCount === 1
            ? 'Unable to analyze image. Please try again or add ingredients manually.'
            : `Unable to analyze ${imageCount} images. Please try again or add ingredients manually.`;

        setAnalysisError(errorMessage);
        toast.error(errorMessage);
      } finally {
        if (isMountedRef.current) {
          setIsAnalyzing(false);
        }
        // Clear the abort controller reference only if it's still the current one
        // This prevents clearing a newer controller that might have been created
        if (analysisAbortControllerRef.current === abortController) {
          analysisAbortControllerRef.current = null;
        }
      }
    },
    [] // Empty dependency array for stable reference
  );

  // Pre-populate form when editing food
  useEffect(() => {
    if (editingFood) {
      logger.debug('Populating form for editing', { foodId: editingFood.id });
      setName(editingFood.name || '');
      setIngredients(editingFood.ingredients || []);
      setNotes(editingFood.notes || '');
      setShowNotes(!!editingFood.notes);
      setSelectedDateTime(new Date(editingFood.timestamp));
      setHasAnalyzed(false);
      setPrimaryImageIndex(0); // Reset to first image
      analysisInitiatedRef.current = false;
    } else {
      logger.debug('Resetting form for new entry');
      setName('');
      setIngredients([]);
      setNotes('');
      setShowNotes(false);
      setSelectedDateTime(new Date());
      setHasAnalyzed(false);
      setAnalysisError(null);
      setPrimaryImageIndex(0); // Reset to first image
      analysisInitiatedRef.current = false;
    }
  }, [editingFood]);

  // Separate effect for image analysis
  useEffect(() => {
    logger.debug('Image analysis effect triggered', {
      hasImageData: !!imageData,
      imageDataLength: imageData?.length,
      hasCapturedImages: !!capturedImages?.length,
      capturedImagesCount: capturedImages?.length,
      isEditingFood: !!editingFood,
      hasAnalyzed,
      analysisInitiated: analysisInitiatedRef.current,
    });

    // Determine which images to analyze (priority: capturedImages, fallback: imageData)
    const imagesToAnalyze = capturedImages?.length
      ? capturedImages
      : imageData
        ? [imageData]
        : null;

    if (
      imagesToAnalyze &&
      !editingFood &&
      !hasAnalyzed &&
      !analysisInitiatedRef.current
    ) {
      logger.debug('Starting image analysis', {
        imageCount: imagesToAnalyze.length,
        analysisType: imagesToAnalyze.length === 1 ? 'single' : 'multiple',
      });
      analysisInitiatedRef.current = true;

      // Use the unified analysis function
      analyzeImages(imagesToAnalyze);
    }
  }, [
    imageData,
    capturedImages,
    editingFood,
    hasAnalyzed,
    analyzeImages,
    name,
  ]);

  // Set mounted flag on mount and cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    logger.debug('Component mounted, isMountedRef set to true');

    return () => {
      isMountedRef.current = false;
      logger.debug('Component unmounting, isMountedRef set to false');
      // Cancel any ongoing analysis and clear the reference
      if (analysisAbortControllerRef.current) {
        try {
          analysisAbortControllerRef.current.abort();
        } catch (error) {
          // Ignore errors during abort - controller might already be aborted
          logger.debug('Error aborting analysis controller during cleanup', {
            error,
          });
        } finally {
          analysisAbortControllerRef.current = null;
        }
      }
    };
  }, []);

  const handleIngredientKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentIngredient.trim()) {
      e.preventDefault();
      const sanitizedName = sanitizeIngredientName(currentIngredient.trim());

      if (sanitizedName.length === 0) {
        toast.error('Please enter a valid ingredient name.');
        return;
      }

      setIngredients([
        ...ingredients,
        {
          name: sanitizedName,
          organic: false,
          group: 'other',
          zone: 'unzoned',
        },
      ]);
      setCurrentIngredient('');
    }
  };

  const handleDeleteIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleEditIngredient = (index: number) => {
    setEditingIndex(index);
    setEditingValue(ingredients[index].name);
  };

  const handleToggleOrganic = (index: number) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index].organic = !updatedIngredients[index].organic;
    // Mark the ingredient as needing re-zoning when organic status changes
    // This ensures it gets re-analyzed when updating
    if (editingFood && updatedIngredients[index].zone !== 'unzoned') {
      updatedIngredients[index].zone = 'unzoned';
      // Clear category and group to trigger full re-analysis
      updatedIngredients[index].category = undefined;
      updatedIngredients[index].group = 'other'; // Reset to default
    }
    setIngredients(updatedIngredients);
  };

  const handleSaveEdit = (index: number) => {
    if (editingValue.trim()) {
      const updatedIngredients = [...ingredients];
      const oldName = updatedIngredients[index].name;
      const newName = editingValue.trim();
      updatedIngredients[index].name = newName;

      // Mark as needing re-zoning if the name changed during edit
      if (
        editingFood &&
        oldName !== newName &&
        updatedIngredients[index].zone !== 'unzoned'
      ) {
        updatedIngredients[index].zone = 'unzoned';
        // Clear category and group to trigger full re-analysis
        updatedIngredients[index].category = undefined;
        updatedIngredients[index].group = 'other'; // Reset to default
      }

      setIngredients(updatedIngredients);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Client-side validation
    const hasIngredients = ingredients.length > 0;
    const hasCurrentIngredient = currentIngredient.trim().length > 0;

    if (!hasIngredients && !hasCurrentIngredient) {
      toast.error('Please add at least one ingredient before submitting.');
      return;
    }

    // Validate ingredient names are not empty
    const hasValidIngredients = ingredients.some(
      ing => ing.name.trim().length > 0
    );
    if (!hasValidIngredients && !hasCurrentIngredient) {
      toast.error('Please ensure all ingredients have valid names.');
      return;
    }

    setIsSubmitting(true);
    setIsZoning(true);

    try {
      // Use the new service to process the submission
      const submissionData: FoodSubmissionData = {
        name,
        ingredients,
        currentIngredient,
        notes,
        selectedDateTime,
      };

      const result = await processFoodSubmission(submissionData);

      if (!result.success) {
        if (result.error?.type === 'validation') {
          toast.error(result.error.message);
        } else {
          toast.error(result.error?.message || 'Failed to process food entry');
        }
        return;
      }

      // Show warnings if any
      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach(warning => toast.warning(warning));
      } else {
        toast.success('Food entry saved successfully!');
      }

      // Submit the processed food
      if (result.food) {
        onAddFood(result.food);
        // Don't call onClose() here - let onAddFood handle navigation to prevent double navigation
      }
    } catch (error) {
      logger.error('Submission failed', error);
      toast.error('Failed to save food entry.');
    } finally {
      setIsSubmitting(false);
      setIsZoning(false);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <FormLoadingOverlay
        isVisible={isSubmitting && isZoning}
        message="Analyzing ingredients with AI..."
      />
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Adaptive Image Gallery - Show for both editing and new entries with images */}
        {(() => {
          const images = getImageArray();
          if (images.length === 0) return null;

          return (
            <div className="mb-4">
              <Label>Food Image{images.length > 1 ? 's' : ''}</Label>
              <div className="mt-2 relative w-full">
                {images.length === 1 ? (
                  // Single image layout - full width
                  <img
                    src={images[0]}
                    alt="Food entry"
                    className="w-full h-48 object-cover rounded-lg border border-gray-200 shadow-sm cursor-pointer"
                    onClick={() => handleImageClick(0)}
                  />
                ) : (
                  // Multi-image layout - grid with primary and secondary images
                  <div className="grid grid-cols-[2.3fr_1fr] gap-2 h-48">
                    {/* Primary image - left side */}
                    <img
                      src={images[primaryImageIndex]}
                      alt={`Food entry - primary`}
                      className="w-full h-48 object-cover rounded-lg border border-gray-200 shadow-sm cursor-pointer"
                      onClick={() => handleImageClick(primaryImageIndex)}
                    />

                    {/* Secondary images - right side */}
                    <div
                      className={
                        images.length === 3 ? 'grid grid-rows-2 gap-2' : 'flex'
                      }
                    >
                      {images.map((image, index) => {
                        if (index === primaryImageIndex) return null; // Skip primary image

                        return (
                          <img
                            key={index}
                            src={image}
                            alt={`Food entry ${index + 1}`}
                            className={cn(
                              'object-cover rounded-lg border border-gray-200 shadow-sm cursor-pointer',
                              images.length === 2
                                ? 'w-full h-48'
                                : 'w-full h-24'
                            )}
                            onClick={() => handleImageClick(index)}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
        <div>
          <Label htmlFor="meal-summary">Meal Summary (optional)</Label>
          <Input
            id="meal-summary"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g., chicken salad, latte, steak & veg (auto-generated from AI analysis)"
          />
        </div>

        <div>
          <Label>Date & Time</Label>
          <DayTimePicker
            value={selectedDateTime}
            onChange={setSelectedDateTime}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="ingredient-input">Ingredients</Label>
          {isAnalyzing ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 bg-muted/10 border border-border/30 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Analyzing ingredients...
                </span>
              </div>
            </div>
          ) : (
            <>
              <Input
                id="ingredient-input"
                value={currentIngredient}
                onChange={e => setCurrentIngredient(e.target.value)}
                onKeyPress={handleIngredientKeyPress}
                placeholder="Type ingredient and press Enter"
                autoFocus={!imageData} // Don't autofocus if we're analyzing an image
              />
              <p className="text-xs text-muted-foreground mt-1">
                {hasAnalyzed
                  ? 'AI analysis complete! Add more ingredients or edit existing ones.'
                  : 'Press Enter to add each ingredient'}
              </p>
            </>
          )}

          {analysisError && (
            <div
              className={`flex items-center gap-2 p-3 ${getZoneBgClass('red', 'light')} rounded-md mt-2`}
            >
              <AlertCircle className={`h-4 w-4 ${getZoneTextClass('red')}`} />
              <span className={`text-sm ${getZoneTextClass('red')}`}>
                {analysisError}
              </span>
            </div>
          )}
        </div>

        {/* Ingredients List */}
        {(ingredients.length > 0 || isAnalyzing) && (
          <div>
            <Label>
              {isAnalyzing
                ? 'Analyzing ingredients...'
                : `Added Ingredients (${ingredients.length})`}
            </Label>
            {isAnalyzing ? (
              <div className="space-y-2 mt-2">
                {/* Skeleton ingredients with zone color bars to match final UI */}
                {[1, 2, 3, 4].map((_, index) => (
                  <div
                    key={index}
                    className="bg-muted/20 rounded-lg h-12 flex items-center overflow-hidden relative border border-border/30"
                  >
                    {/* Zone color indicator bar - shimmer effect */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 zone-bar-loading">
                      <div className="h-full w-full bg-gradient-to-b from-green-500/40 via-yellow-500/40 to-red-500/40 zone-bar-shimmer" />
                    </div>

                    {/* Content skeleton */}
                    <div className="flex items-center justify-between w-full px-4 ml-1">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="w-6 h-6 rounded-full bg-muted/40" />
                        <Skeleton className="h-4 w-24 bg-muted/40" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-6 w-12 rounded bg-muted/40" />
                        <Skeleton className="w-8 h-8 rounded bg-muted/40" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-2">
                <div className="space-y-2">
                  {ingredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className="bg-card rounded-md h-12 flex items-center overflow-hidden relative"
                    >
                      {/* Zone color indicator bar */}
                      <div
                        className={cn(
                          'absolute left-0 top-0 bottom-0 w-1',
                          ingredient.zone === 'unzoned' && 'zone-bar-loading'
                        )}
                        style={{
                          backgroundColor:
                            ingredient.zone === 'green'
                              ? getZoneColor('green', 'hex')
                              : ingredient.zone === 'yellow'
                                ? getZoneColor('yellow', 'hex')
                                : ingredient.zone === 'red'
                                  ? getZoneColor('red', 'hex')
                                  : ingredient.zone === 'unzoned'
                                    ? getZoneColor('unzoned', 'hex')
                                    : getZoneColor('unzoned', 'hex'),
                        }}
                        title={
                          ingredient.zone === 'unzoned'
                            ? 'Zone pending...'
                            : `Zone: ${ingredient.zone}`
                        }
                      >
                        {ingredient.zone === 'unzoned' && (
                          <div className="absolute inset-0 zone-bar-shimmer" />
                        )}
                      </div>

                      {/* Ingredient Row */}
                      {editingIndex === index ? (
                        <Input
                          value={editingValue}
                          onChange={e => setEditingValue(e.target.value)}
                          onKeyPress={e => handleEditKeyPress(e, index)}
                          onBlur={() => handleSaveEdit(index)}
                          className="flex-1 h-8 mx-2 ml-3"
                          autoFocus
                        />
                      ) : (
                        <div className="flex-1 pl-3 pr-2 flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground">
                            {ingredient.name}
                          </span>
                          {ingredient.organic && (
                            <span
                              className={`text-xs ${getZoneBgClass('green', 'light')} ${getZoneTextClass('green')} px-1.5 py-0.5 rounded-full`}
                            >
                              organic
                            </span>
                          )}
                          {/* Info icon for zoned ingredients */}
                          {ingredient.zone !== 'unzoned' &&
                            ingredient.group && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label="Ingredient classification info"
                                  >
                                    <Info className="h-3 w-3" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent
                                  side="top"
                                  align="center"
                                  className="text-xs space-y-1"
                                >
                                  <div>
                                    <strong>Category:</strong>{' '}
                                    {ingredient.category || 'Unknown'}
                                  </div>
                                  <div>
                                    <strong>Group:</strong> {ingredient.group}
                                  </div>
                                  <div>
                                    <strong>Zone:</strong>{' '}
                                    <span
                                      className={`capitalize ${getZoneTextClass(ingredient.zone)}`}
                                    >
                                      {ingredient.zone}
                                    </span>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                        </div>
                      )}
                      <div className="flex gap-1 px-2">
                        <button
                          type="button"
                          onClick={() => handleToggleOrganic(index)}
                          className={`p-1 transition-colors ${
                            ingredient.organic
                              ? `${getZoneTextClass('green')} hover:opacity-80`
                              : `text-muted-foreground hover:${getZoneTextClass('green')}`
                          }`}
                          title={
                            ingredient.organic
                              ? 'Mark as non-organic'
                              : 'Mark as organic'
                          }
                        >
                          <Leaf className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditIngredient(index)}
                          className="p-1 text-muted-foreground hover:text-blue-600 transition-colors"
                          title="Edit ingredient"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteIngredient(index)}
                          className={`p-1 text-muted-foreground hover:${getZoneTextClass('red')} transition-colors`}
                          title="Delete ingredient"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Collapsible Notes Section */}
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
                placeholder="Any additional details..."
                rows={3}
              />
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          {editingFood && onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="bg-transparent text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Food Entry</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this food entry? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || isAnalyzing}
            className="flex-1"
          >
            {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
            {isSubmitting
              ? isZoning
                ? 'Zoning ingredients...'
                : 'Saving...'
              : editingFood
                ? 'Update Food'
                : 'Add Food'}
          </Button>
        </div>
      </form>
    </div>
  );
}
