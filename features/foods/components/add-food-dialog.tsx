"use client";

import type React from "react";
import type { Food, Ingredient } from "@/lib/types";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Edit2,
  Trash2,
  Leaf,
  ChevronDown,
  ChevronUp,
  Flame,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface AddFoodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddFood: (food: Omit<Food, "id" | "timestamp">) => void;
  onClose: () => void;
  editingFood?: Food | null;
  imageData?: string; // Base64 image data for AI analysis
}

const cookingMethods = [
  { value: "raw", label: "Raw", color: "bg-green-100 text-green-700" },
  { value: "steamed", label: "Steamed", color: "bg-blue-100 text-blue-700" },
  { value: "boiled", label: "Boiled", color: "bg-cyan-100 text-cyan-700" },
  {
    value: "grilled",
    label: "Grilled",
    color: "bg-orange-100 text-orange-700",
  },
  { value: "fried", label: "Fried", color: "bg-red-100 text-red-700" },
  {
    value: "sauteed",
    label: "Sautéed",
    color: "bg-yellow-100 text-yellow-700",
  },
  { value: "baked", label: "Baked", color: "bg-amber-100 text-amber-700" },
  {
    value: "roasted",
    label: "Roasted",
    color: "bg-orange-100 text-orange-800",
  },
  { value: "poached", label: "Poached", color: "bg-teal-100 text-teal-700" },
  {
    value: "braised",
    label: "Braised",
    color: "bg-purple-100 text-purple-700",
  },
];

export function AddFoodDialog({
  open,
  onOpenChange,
  onAddFood,
  onClose,
  editingFood,
  imageData,
}: AddFoodDialogProps) {
  const [name, setName] = useState("");
  const [currentIngredient, setCurrentIngredient] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [cookingSelectionIndex, setCookingSelectionIndex] = useState<
    number | null
  >(null);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  
  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // AI Analysis function
  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      const response = await fetch("/api/analyze-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: imageData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Analysis failed");
      }

      const data = await response.json();
      
      // Convert AI ingredient strings to full Ingredient objects
      const aiIngredients: Ingredient[] = data.ingredients.map((name: string) => ({
        name,
        isOrganic: false,
        cookingMethod: "raw" as const,
        foodGroup: "other" as const,
        zone: "yellow" as const,
      }));

      // Pre-populate the ingredients list
      setIngredients(aiIngredients);
      setHasAnalyzed(true);
      
      // Show success toast
      toast.success(`Found ${aiIngredients.length} ingredients! Review and adjust as needed.`);
      
    } catch (error) {
      console.error("Image analysis failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Analysis failed";
      setAnalysisError(errorMessage);
      toast.error(`Analysis failed: ${errorMessage}. Please add ingredients manually.`);
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
          cookingMethod: "raw",
          foodGroup: "other",
          zone: "yellow",
        },
      ]);
      setCurrentIngredient("");
    }
  };

  const handleDeleteIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
    setCookingSelectionIndex(null);
  };

  const handleEditIngredient = (index: number) => {
    setEditingIndex(index);
    setEditingValue(ingredients[index].name);
    setCookingSelectionIndex(null);
  };

  const handleToggleOrganic = (index: number) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index].isOrganic = !updatedIngredients[index].isOrganic;
    setIngredients(updatedIngredients);
  };

  const handleToggleCookingSelection = (index: number) => {
    setCookingSelectionIndex(cookingSelectionIndex === index ? null : index);
  };

  const handleSelectCookingMethod = (index: number, method: string) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index].cookingMethod =
      method as Ingredient["cookingMethod"];
    setIngredients(updatedIngredients);
    setCookingSelectionIndex(null);
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

  const getCookingMethodStyle = (method?: string) => {
    const cookingMethod = cookingMethods.find(m => m.value === method);
    return cookingMethod?.color || "bg-gray-100 text-gray-700";
  };

  const getCookingMethodLabel = (method?: string) => {
    const cookingMethod = cookingMethods.find(m => m.value === method);
    return cookingMethod?.label || method;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ingredients.length === 0) return;

    // Create food name from ingredients if not provided
    const foodName =
      name.trim() ||
      (() => {
        const ingredientNames = ingredients.map(ing => ing.name);
        return ingredientNames.length > 3
          ? `${ingredientNames.slice(0, 3).join(", ")} + ${ingredientNames.length - 3} more`
          : ingredientNames.join(", ");
      })();

    const food: Omit<Food, "id" | "timestamp"> = {
      name: foodName,
      ingredients,
      notes: notes.trim() || undefined,
      status: editingFood ? editingFood.status : "pending_review",
      image: editingFood?.image,
    };

    onAddFood(food);

    // Reset form
    setName("");
    setCurrentIngredient("");
    setIngredients([]);
    setNotes("");
    setShowNotes(false);
    setEditingIndex(null);
    setEditingValue("");
    setCookingSelectionIndex(null);
    onClose();
  };

  const handleClose = () => {
    if (!editingFood) {
      setName("");
      setCurrentIngredient("");
      setIngredients([]);
      setNotes("");
      setShowNotes(false);
      setEditingIndex(null);
      setEditingValue("");
      setCookingSelectionIndex(null);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingFood ? "Edit Food" : "Add Food"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="food-name">Food Name (optional)</Label>
            <Input
              id="food-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Lunch, Breakfast (auto-generated if empty)"
            />
          </div>

          <div>
            <Label htmlFor="ingredient-input">Ingredients</Label>
            {isAnalyzing ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-blue-700">Analyzing image...</span>
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
                <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                {ingredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-md h-12 flex items-center overflow-hidden"
                  >
                    {/* Normal Ingredient Row */}
                    {cookingSelectionIndex !== index && (
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
                              {ingredient.name}
                            </span>
                            {ingredient.isOrganic && (
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                                organic
                              </span>
                            )}
                            {ingredient.cookingMethod &&
                              ingredient.cookingMethod !== "raw" && (
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded-full ${getCookingMethodStyle(ingredient.cookingMethod)}`}
                                >
                                  {getCookingMethodLabel(
                                    ingredient.cookingMethod
                                  )}
                                </span>
                              )}
                          </div>
                        )}
                        <div className="flex gap-1 px-2">
                          <button
                            type="button"
                            onClick={() => handleToggleCookingSelection(index)}
                            className={`p-1 transition-colors ${
                              ingredient.cookingMethod &&
                              ingredient.cookingMethod !== "raw"
                                ? "text-orange-600 hover:text-orange-700"
                                : "text-gray-400 hover:text-orange-600"
                            }`}
                            title="Select cooking method"
                          >
                            <Flame className="h-3 w-3" />
                          </button>
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
                      </>
                    )}

                    {/* Cooking Method Selection Row - Same Height, Pure Focus */}
                    {cookingSelectionIndex === index && (
                      <div className="flex-1 min-w-0 px-2 flex items-center overflow-hidden">
                        <div className="flex gap-2 overflow-x-auto scrollbar-none min-w-0 max-w-full">
                          {cookingMethods.map(method => (
                            <button
                              key={method.value}
                              type="button"
                              onClick={() =>
                                handleSelectCookingMethod(index, method.value)
                              }
                              className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full transition-all duration-200 hover:scale-110 whitespace-nowrap ${
                                ingredient.cookingMethod === method.value
                                  ? `${method.color} ring-2 ring-blue-300 scale-110`
                                  : `${method.color} hover:ring-1 hover:ring-gray-300`
                              }`}
                            >
                              {method.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
              onClick={handleClose}
              className="flex-1 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={ingredients.length === 0 || isAnalyzing}
              className="flex-1"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : editingFood ? (
                `Update Food (${ingredients.length} ingredients)`
              ) : (
                `Add Food (${ingredients.length} ingredients)`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
