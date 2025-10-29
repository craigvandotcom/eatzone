'use client';

import { useCallback } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Utensils } from 'lucide-react';
import { FoodCompositionBar } from '@/features/foods/components/food-composition-bar';
import { OrganicCompositionBar } from '@/features/foods/components/organic-composition-bar';
import { FoodZoneSummaryBar } from '@/features/foods/components/food-zone-summary-bar';
import { UnifiedTimeline } from './unified-timeline';
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
import { getCategoryInfo } from '@/lib/symptoms/symptom-index';

// Import types
import type { TimelineEntry, FoodStats, Ingredient } from '@/lib/types';

interface EntriesViewProps {
  entriesForSelectedDate?: TimelineEntry[];
  foodStatsForSelectedDate?: FoodStats;
  getIngredientsForSelectedDate: () => Ingredient[];
}

export function EntriesView({
  entriesForSelectedDate,
  foodStatsForSelectedDate,
  getIngredientsForSelectedDate,
}: EntriesViewProps) {
  const router = useRouter();

  const handleEditFood = useCallback(
    (foodId: string) => {
      router.push(`/app/foods/edit/${foodId}`);
    },
    [router]
  );

  const handleEditSymptom = useCallback(
    (symptomId: string) => {
      router.push(`/app/symptoms/edit/${symptomId}`);
    },
    [router]
  );

  return (
    <ErrorBoundary fallback={SupabaseErrorFallback}>
      {/* Unified Timeline with Zone Bars */}
      <div className="space-y-4">
        {entriesForSelectedDate === undefined ? (
          <div className="bg-muted rounded-lg p-4 h-32">
            <DataLoadingState message="Loading timeline..." />
          </div>
        ) : (
          <div className="space-y-4">
            <UnifiedTimeline entries={entriesForSelectedDate} />
            {/* Zone and Organic Bars directly under timeline */}
            {foodStatsForSelectedDate && (
              <FoodZoneSummaryBar
                ingredients={getIngredientsForSelectedDate()}
              />
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Entries</h2>
          <span className="text-muted-foreground text-sm">
            {entriesForSelectedDate?.length || 0}{' '}
            {entriesForSelectedDate?.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
        <div className="space-y-3">
          <EmptyOrLoadingState
            isLoading={entriesForSelectedDate === undefined}
            isEmpty={entriesForSelectedDate?.length === 0}
            loadingMessage="Loading entries for selected date..."
            emptyTitle="No entries logged for this date"
            emptyDescription="Tap the + button to add food or signal entries"
            EmptyIconComponent={Utensils}
          />
          {entriesForSelectedDate === undefined && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <FoodEntrySkeleton key={i} />
              ))}
            </div>
          )}
          {entriesForSelectedDate &&
            entriesForSelectedDate.length > 0 &&
            entriesForSelectedDate.map(entry => {
              // Render food entry
              if (entry.type === 'food') {
                const food = entry.data;
                return (
                  <Card
                    key={entry.id}
                    className="cursor-pointer hover:shadow-xl transition-shadow duration-200"
                    onClick={() => handleEditFood(food.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          {food.photo_url ? (
                            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-emerald-500">
                              <Image
                                src={food.photo_url || '/placeholder.svg'}
                                alt={food.name}
                                className="w-full h-full object-cover"
                                width={48}
                                height={48}
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 border-2 border-emerald-500 bg-transparent rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-foreground text-lg">
                                🍽️
                              </span>
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
                );
              }

              // Render signal entry
              if (entry.type === 'signal') {
                const symptom = entry.data;
                return (
                  <Card
                    key={entry.id}
                    className="cursor-pointer hover:shadow-xl transition-shadow duration-200"
                    onClick={() => handleEditSymptom(symptom.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 border-2 border-red-500 bg-transparent rounded-full flex items-center justify-center">
                            <span className="text-foreground text-lg">
                              {getCategoryInfo(symptom.category)?.icon || '⚡'}
                            </span>
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-foreground">
                              {symptom.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(symptom.timestamp).toLocaleString(
                                'en-US',
                                {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                                }
                              )}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">
                          {symptom.category}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              return null;
            })}
        </div>
      </div>
    </ErrorBoundary>
  );
}
