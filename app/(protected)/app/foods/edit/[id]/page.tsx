"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FoodEntryForm } from "@/features/foods/components/food-entry-form";
import { getFoodById, updateFood as dbUpdateFood } from "@/lib/db";
import type { Food } from "@/lib/types";

export default function EditFoodPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFood = async () => {
      try {
        const resolvedParams = await params;
        const foodData = await getFoodById(resolvedParams.id);
        if (foodData) {
          setFood(foodData);
        } else {
          // If food not found, go back
          router.back();
        }
      } catch (error) {
        console.error("Error loading food:", error);
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadFood();
  }, [params, router]);

  const handleUpdateFood = async (
    updatedFood: Omit<Food, "id" | "timestamp">
  ) => {
    if (food) {
      await dbUpdateFood(food.id, updatedFood);
      router.back();
    }
  };

  const handleClose = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!food) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Edit Food</h1>
        </div>
      </header>

      {/* Form Content */}
      <main className="px-4 py-6">
        <FoodEntryForm
          onAddFood={handleUpdateFood}
          onClose={handleClose}
          editingFood={food}
        />
      </main>
    </div>
  );
}
