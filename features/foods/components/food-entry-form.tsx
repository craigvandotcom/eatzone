"use client";

import type React from "react";
import type { Food, Ingredient } from "@/lib/types";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Edit2,
  Trash2,
  Leaf,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface FoodEntryFormProps {
  onAddFood: (food: Omit<Food, "id" | "timestamp">) => void;
  onClose: () => void;
  editingFood?: Food | null;
  imageData?: string; // Base64 image data for AI analysis
  className?: string;
}

export function FoodEntryForm({
  onAddFood,
  onClose,
  editingFood,
  imageData,
  className,
}: FoodEntryFormProps) {
  const [name, setName] = useState("");
  const [currentIngredient, setCurrentIngredient] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Analysis function
  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });

      if (!response.ok) throw new Error("Analysis failed");

      const { mealSummary, ingredients: ingredientData } = await response.json();

      const aiIngredients: Ingredient[] = ingredientData.map(
        (ingredient: { name: string; isOrganic: boolean }) => ({
          name: ingredient.name,
          isOrganic: ingredient.isOrganic,
          foodGroup: "other" as const, // Default value
          zone: "yellow" as const, // Default value
        })
      );

      setIngredients(aiIngredients);
      // Set the meal summary as the default name if not already set
      if (!name && mealSummary) {
        setName(mealSummary);
      }
      setHasAnalyzed(true);
      toast.success(`Found ${ingredientData.length} ingredients for review.`);
    } catch (error) {
      console.error("Image analysis failed:", error);
      setAnalysisError("AI analysis failed. Please add ingredients manually.");
      toast.error("AI analysis failed. Please add ingredients manually.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Pre-populate form when editing or analyze image when provided
  useEffect(() => {
    if (editingFood) {
      setName(editingFood.name || "");
      setIngredients(editingFood.ingredients || []);
      setNotes(editingFood.notes || "");
      setShowNotes(!!editingFood.notes);
      setHasAnalyzed(false);
    } else {
      setName("");
      setIngredients([]);
      setNotes("");
      setShowNotes(false);
      setHasAnalyzed(false);
      setAnalysisError(null);

      // Trigger AI analysis if image data is provided
      if (imageData && !hasAnalyzed) {
        analyzeImage(imageData);
      }
    }
  }, [editingFood, imageData]);

  const handleIngredientKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && currentIngredient.trim()) {
      e.preventDefault();
      setIngredients([
        ...ingredients,
        {
          name: currentIngredient.trim(),
          isOrganic: false,
          foodGroup: "other",
          zone: "yellow",
        },
      ]);
      setCurrentIngredient("");
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
    updatedIngredients[index].isOrganic = !updatedIngredients[index].isOrganic;
    setIngredients(updatedIngredients);
  };

  const handleSaveEdit = (index: number) => {
    if (editingValue.trim()) {
      const updatedIngredients = [...ingredients];
      updatedIngredients[index].name = editingValue.trim();
      setIngredients(updatedIngredients);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const finalIngredientsList = [...ingredients];
    if (currentIngredient.trim()) {
      finalIngredientsList.push({
        name: currentIngredient.trim(),
        isOrganic: false,
        foodGroup: "other",
        zone: "yellow",
      });
    }

    if (finalIngredientsList.length === 0) {
      toast.error("Please add at least one ingredient.");
      return;
    }

    setIsSubmitting(true);

    try {
      const ingredientNames = finalIngredientsList.map(ing => ing.name);

      const zoneResponse = await fetch("/api/zone-ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: ingredientNames }),
      });

      let enrichedIngredients = finalIngredientsList;

      if (zoneResponse.ok) {
        const { ingredients: zonedData } = await zoneResponse.json();
        const zonedMap = new Map(
          zonedData.map((item: any) => [item.name, item])
        );
        enrichedIngredients = finalIngredientsList.map(ing => {
          const zonedData = zonedMap.get(ing.name);
          return {
            ...ing,
            ...(zonedData || {}),
          };
        });
      } else {
        toast.warning(
          "Could not zone ingredients. Saving with default values."
        );
      }

      const foodName =
        name.trim() || `Meal with ${enrichedIngredients[0].name}`;

      onAddFood({
        name: foodName,
        ingredients: enrichedIngredients,
        notes: notes.trim(),
        status: "processed",
      });

      onClose();
    } catch (error) {
      console.error("Submission failed:", error);
      toast.error("Failed to save food entry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <Label htmlFor="ingredient-input">Ingredients</Label>
          {isAnalyzing ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-700">
                  Analyzing image...
                </span>
              </div>
              <Skeleton className="h-10 w-full" />
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
              <p className="text-xs text-gray-500 mt-1">
                {hasAnalyzed
                  ? "AI analysis complete! Add more ingredients or edit existing ones."
                  : "Press Enter to add each ingredient"}
              </p>
            </>
          )}

          {analysisError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-md mt-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">{analysisError}</span>
            </div>
          )}
        </div>

        {/* Ingredients List */}
        {(ingredients.length > 0 || isAnalyzing) && (
          <div>
            <Label>
              {isAnalyzing
                ? "Analyzing ingredients..."
                : `Added Ingredients (${ingredients.length})`}
            </Label>
            {isAnalyzing ? (
              <div className="space-y-2 mt-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <ScrollArea className="max-h-40 mt-2">
                <div className="space-y-2">
                  {ingredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-md h-12 flex items-center overflow-hidden"
                    >
                      {/* Ingredient Row */}
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
                            {ingredient.name}
                          </span>
                          {ingredient.isOrganic && (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                              organic
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex gap-1 px-2">
                        <button
                          type="button"
                          onClick={() => handleToggleOrganic(index)}
                          className={`p-1 transition-colors ${
                            ingredient.isOrganic
                              ? "text-green-600 hover:text-green-700"
                              : "text-gray-400 hover:text-green-600"
                          }`}
                          title={
                            ingredient.isOrganic
                              ? "Mark as non-organic"
                              : "Mark as organic"
                          }
                        >
                          <Leaf className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditIngredient(index)}
                          className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                          title="Edit ingredient"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteIngredient(index)}
                          className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                          title="Delete ingredient"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
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
          <Button type="submit" disabled={isSubmitting || isAnalyzing}>
            {isSubmitting ? "Saving..." : "Save Food"}
          </Button>
        </div>
      </form>
    </div>
  );
}
