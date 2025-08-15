'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FoodEntryForm } from '@/features/foods/components/food-entry-form';
import { getFoodById, updateFood as dbUpdateFood, deleteFood } from '@/lib/db';
import { mutate } from 'swr';
import type { Food } from '@/lib/types';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

export default function EditFoodPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
        logger.error('Error loading food', error);
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadFood();
  }, [params, router]);

  const handleUpdateFood = async (updatedFood: Omit<Food, 'id'>) => {
    if (food) {
      await dbUpdateFood(food.id, updatedFood);

      // Invalidate SWR cache to trigger immediate refresh
      await mutate('dashboard-data');

      toast.success('Food updated successfully');
      router.push('/app');
    }
  };

  const handleDeleteFood = async () => {
    if (food) {
      try {
        await deleteFood(food.id);

        // Invalidate SWR cache to trigger immediate refresh
        await mutate('dashboard-data');

        toast.success('Food deleted successfully');
        router.push('/app');
      } catch (error) {
        console.error('Failed to delete food:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete food. Please try again.';
        toast.error(errorMessage);
      }
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
