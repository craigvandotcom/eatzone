"use client";

import type React from "react";
import type { Meal } from "@/lib/types";

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
import {
  Edit2,
  Trash2,
  Leaf,
  ChevronDown,
  ChevronUp,
  Flame,
} from "lucide-react";
import { format } from "date-fns";

interface Ingredient {
  name: string;
  isOrganic: boolean;
  cookingMethod?: string;
}

interface AddMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddMeal: (meal: {
    name: string;
    time: string;
    date: string;
    category: string;
    notes?: string;
    healthCategory?: "green" | "yellow" | "red" | "analyzing";
    ingredients?: Ingredient[];
  }) => void;
  editingMeal?: Meal | null;
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

export function AddMealDialog({
  open,
  onOpenChange,
  onAddMeal,
  editingMeal,
}: AddMealDialogProps) {
  const [currentIngredient, setCurrentIngredient] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [cookingSelectionIndex, setCookingSelectionIndex] = useState<
    number | null
  >(null);
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  // Pre-populate form when editing
  useEffect(() => {
    if (editingMeal) {
      setIngredients(editingMeal.ingredients || []);
      setNotes(editingMeal.notes || "");
      setShowNotes(!!editingMeal.notes);
    }
  }, [editingMeal]);

  const handleIngredientKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && currentIngredient.trim()) {
      e.preventDefault();
      setIngredients([
        ...ingredients,
        {
          name: currentIngredient.trim(),
          isOrganic: false,
          cookingMethod: "raw",
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
    updatedIngredients[index].cookingMethod = method;
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

    const now = new Date();
    // Create name from ingredients list
    const ingredientNames = ingredients.map(ing => ing.name);
    const name =
      ingredientNames.length > 3
        ? `${ingredientNames.slice(0, 3).join(", ")} + ${ingredientNames.length - 3} more`
        : ingredientNames.join(", ");

    onAddMeal({
      name,
      category: "meal", // Default category
      healthCategory: "analyzing", // Will be analyzed by AI
      ingredients,
      notes: notes || undefined,
      time: format(now, "HH:mm"),
      date: format(now, "yyyy-MM-dd"),
    });

    // Reset form
    setCurrentIngredient("");
    setIngredients([]);
    setNotes("");
    setShowNotes(false);
    setEditingIndex(null);
    setEditingValue("");
    setCookingSelectionIndex(null);
    onOpenChange(false);
  };

  const handleClose = () => {
    if (!editingMeal) {
      setCurrentIngredient("");
      setIngredients([]);
      setNotes("");
      setShowNotes(false);
      setEditingIndex(null);
      setEditingValue("");
      setCookingSelectionIndex(null);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingMeal ? "Edit Food" : "Add Food"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="ingredient-input">Ingredients</Label>
            <Input
              id="ingredient-input"
              value={currentIngredient}
              onChange={e => setCurrentIngredient(e.target.value)}
              onKeyPress={handleIngredientKeyPress}
              placeholder="Type ingredient and press Enter"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Press Enter to add each ingredient
            </p>
          </div>

          {/* Ingredients List */}
          {ingredients.length > 0 && (
            <div>
              <Label>Added Ingredients ({ingredients.length})</Label>
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
                  autoFocus
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
              disabled={ingredients.length === 0}
              className="flex-1"
            >
              {editingMeal
                ? `Update Food (${ingredients.length} ingredients)`
                : `Add Food (${ingredients.length} ingredients)`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
