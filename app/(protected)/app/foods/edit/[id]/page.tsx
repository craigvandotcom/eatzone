'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FoodEntryForm } from '@/features/foods/components/food-entry-form';
import { getFoodById, updateFood as dbUpdateFood, deleteFood } from '@/lib/db';
import { mutate } from 'swr';
import type { Food } from '@/lib/types';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';
import { processFoodSubmission } from '@/lib/services/food-submission';

export default function EditFoodPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    const loadFood = async () => {
      try {
        const resolvedParams = await params;

        // Check if component is still mounted before updating state
        if (!isMountedRef.current) return;

        const foodData = await getFoodById(resolvedParams.id);

        if (!isMountedRef.current) return;

        if (foodData) {
          setFood(foodData);
        } else {
          // If food not found, go back
          router.back();
        }
      } catch (error) {
        if (!isMountedRef.current) return;

        logger.error('Error loading food', error);
        router.back();
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadFood();
  }, [params, router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleUpdateFood = async (updatedFood: Omit<Food, 'id'>) => {
    if (food && isMountedRef.current) {
      try {
        // Process the food through the submission service to re-zone ingredients
        const submissionData = {
          name: updatedFood.name,
          ingredients: updatedFood.ingredients.map(ing => ({
            ...ing,
            // Mark ingredient as unzoned if it's been modified (organic status changed)
            // or if it's missing zone/category/group information
            zone:
              !ing.zone || ing.zone === 'unzoned' || !ing.category || !ing.group
                ? ('unzoned' as const)
                : ing.zone,
          })),
          currentIngredient: '',
          notes: updatedFood.notes || '',
          selectedDateTime: new Date(updatedFood.timestamp),
        };

        // Check if any ingredients need re-zoning
        const needsReZoning = submissionData.ingredients.some(
          ing => ing.zone === 'unzoned' || !ing.category || !ing.group
        );

        if (needsReZoning) {
          // Process through submission service to re-zone
          const result = await processFoodSubmission(submissionData);

          if (!result.success) {
            throw new Error(
              result.error?.message || 'Failed to process food update'
            );
          }

          if (result.food) {
            await dbUpdateFood(food.id, result.food);
          }
        } else {
          // No re-zoning needed, update directly
          await dbUpdateFood(food.id, updatedFood);
        }

        // Check if component is still mounted before state updates
        if (!isMountedRef.current) return;

        // Invalidate SWR cache to trigger immediate refresh
        await mutate('dashboard-data');

        toast.success('Food updated successfully');
        router.push('/app');
      } catch (error) {
        if (!isMountedRef.current) return;

        logger.error('Failed to update food', error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to update food. Please try again.';
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteFood = async () => {
    if (food && isMountedRef.current) {
      try {
        await deleteFood(food.id);

        // Check if component is still mounted before state updates
        if (!isMountedRef.current) return;

        // Invalidate SWR cache to trigger immediate refresh
        await mutate('dashboard-data');

        toast.success('Food deleted successfully');
        router.push('/app');
      } catch (error) {
        if (!isMountedRef.current) return;

        logger.error('Failed to delete food', error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to delete food. Please try again.';
        toast.error(errorMessage);
      }
    }
  };

  const handleClose = () => {
    router.push('/app');
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
    <div className="bg-background">
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
          onDelete={handleDeleteFood}
          editingFood={food}
        />
      </main>
    </div>
  );
}
