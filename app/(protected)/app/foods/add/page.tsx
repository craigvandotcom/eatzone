"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FoodEntryForm } from "@/features/foods/components/food-entry-form";
import { addFood as dbAddFood } from "@/lib/db";
import type { Food } from "@/lib/types";

export default function AddFoodPage() {
  const router = useRouter();
  const [imageData, setImageData] = useState<string | undefined>();

  useEffect(() => {
    // Check if there's a pending image from camera capture
    const pendingImage = sessionStorage.getItem("pendingFoodImage");
    if (pendingImage) {
      setImageData(pendingImage);
      // Clear it after retrieval to prevent reuse
      sessionStorage.removeItem("pendingFoodImage");
    }
  }, []);

  const handleAddFood = async (food: Omit<Food, "id" | "timestamp">) => {
    // Include image data if available
    const foodWithImage = imageData ? { ...food, image: imageData } : food;
    await dbAddFood(foodWithImage);
    router.back();
  };

  const handleClose = () => {
    router.back();
  };

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
          <h1 className="text-xl font-semibold">Add Food</h1>
        </div>
      </header>

      {/* Form Content */}
      <main className="px-4 py-6">
        <FoodEntryForm
          onAddFood={handleAddFood}
          onClose={handleClose}
          imageData={imageData}
        />
      </main>
    </div>
  );
}
