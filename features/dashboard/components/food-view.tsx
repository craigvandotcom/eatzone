'use client';

import { useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { FoodCompositionBar } from '@/features/foods/components/food-composition-bar';
import { OrganicCompositionBar } from '@/features/foods/components/organic-composition-bar';
import { FoodZoneSummaryBar } from '@/features/foods/components/food-zone-summary-bar';
import { AnimatedComponentErrorBoundary } from '@/components/animated-component-error-boundary';
import {
  FoodEntrySkeleton,
  EmptyOrLoadingState,
  DataLoadingState,
} from '@/components/ui/loading-states';
import {
  ErrorBoundary,
  SupabaseErrorFallback,
} from '@/components/error-boundary';

// Import types
import { Food, FoodStats } from '@/lib/types';

interface FoodViewProps {
  foodsForSelectedDate?: Food[];
  foodStatsForSelectedDate?: FoodStats;
  getIngredientsForSelectedDate: () => any[];
}

export function FoodView({
  foodsForSelectedDate,
  foodStatsForSelectedDate,
  getIngredientsForSelectedDate,
}: FoodViewProps) {
  const router = useRouter();

  const handleEditFood = useCallback(
    (food: Food) => {
      router.push(`/app/foods/edit/${food.id}`);
    },
    [router]
  );

  return (
    <ErrorBoundary fallback={SupabaseErrorFallback}>
      {/* Food Zone Summary Bar for Selected Date */}
      <div className="space-y-4">
        {foodStatsForSelectedDate === undefined ? (
          <div className="bg-muted rounded-lg p-4 h-32">
            <DataLoadingState message="Loading food data..." />
          </div>
        ) : (
          <FoodZoneSummaryBar ingredients={getIngredientsForSelectedDate()} />
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Food Entries
          </h2>
          <span className="text-muted-foreground text-sm">
            {foodsForSelectedDate?.length || 0} entries
          </span>
        </div>
        <div className="space-y-3">
          <EmptyOrLoadingState
            isLoading={foodsForSelectedDate === undefined}
            isEmpty={foodsForSelectedDate?.length === 0}
            loadingMessage="Loading foods for selected date..."
            emptyTitle="No foods logged for this date"
            emptyDescription="Tap the eat icon below to add a food entry"
            emptyIcon="🍽️"
          />
          {foodsForSelectedDate === undefined && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <FoodEntrySkeleton key={i} />
              ))}
            </div>
          )}
          {foodsForSelectedDate && foodsForSelectedDate.length > 0 && (
            <div className="space-y-3 overflow-hidden">
              {foodsForSelectedDate.map(food => (
                <Card
                  key={food.id}
                  className="cursor-pointer hover:shadow-xl transition-shadow duration-200"
                  onClick={() => handleEditFood(food)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {food.photo_url ? (
                          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                            <Image
                              src={food.photo_url || '/placeholder.svg'}
                              alt={food.name}
                              className="w-full h-full object-cover"
                              width={48}
                              height={48}
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-lg">🍽️</span>
                          </div>
                        )}
                        <div className="text-left flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {food.status === 'analyzing'
                              ? 'New Food'
                              : food.name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {food.ingredients
                              ?.map(ing => ing.name)
                              .join(', ') || 'No ingredients'}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex items-center space-x-2 ml-2">
                        <div className="w-16 sm:w-20 md:w-24 space-y-1.5">
                          <AnimatedComponentErrorBoundary>
                            <FoodCompositionBar
                              ingredients={food.ingredients || []}
                            />
                          </AnimatedComponentErrorBoundary>
                          <AnimatedComponentErrorBoundary>
                            <OrganicCompositionBar
                              ingredients={food.ingredients || []}
                            />
                          </AnimatedComponentErrorBoundary>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
