'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Utensils, MoreVertical, Copy, Edit, Trash2 } from 'lucide-react';
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
import { getCategoryInfoSafe } from '@/lib/symptoms/symptom-index';
import { duplicateFood, deleteFood } from '@/lib/db';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const [deletingFoodId, setDeletingFoodId] = useState<string | null>(null);
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);

  const handleDuplicateFood = async (foodId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isDuplicating) return;

    setIsDuplicating(foodId);
    try {
      // Navigate to today's entries view immediately
      router.push('/app?view=entries');

      // Duplicate the food entry (creates new entry with current timestamp)
      const newFoodId = await duplicateFood(foodId);

      // Refresh dashboard data
      await mutate('dashboard-data');

      // Navigate to edit page for the new duplicated entry
      router.push(`/app/foods/edit/${newFoodId}`);

      toast.success('Food entry duplicated successfully');
    } catch (error) {
      logger.error('Failed to duplicate food', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to duplicate food entry. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsDuplicating(null);
    }
  };

  const handleEditFood = (foodId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/app/foods/edit/${foodId}`);
  };

  const handleDeleteFood = async (foodId: string) => {
    try {
      await deleteFood(foodId);
      await mutate('dashboard-data');
      toast.success('Food entry deleted successfully');
      setDeletingFoodId(null);
    } catch (error) {
      logger.error('Failed to delete food', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to delete food entry. Please try again.';
      toast.error(errorMessage);
    }
  };

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
                showTitle={false}
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
          {entriesForSelectedDate && entriesForSelectedDate.length > 0 && (
            <div className="flex flex-col gap-2">
              {entriesForSelectedDate.map(entry => {
                // Render food entry
                if (entry.type === 'food') {
                  const food = entry.data;
                  return (
                    <div key={entry.id} className="relative">
                      <Link
                        href={`/app/foods/edit/${food.id}`}
                        prefetch={true}
                        className="block"
                      >
                        <Card className="cursor-pointer active:shadow-xl active:scale-[0.99] transition-all duration-200">
                          <CardContent className="!py-3 !px-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                {food.photo_url ? (
                                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-zone-green">
                                    <Image
                                      src={food.photo_url || '/placeholder.svg'}
                                      alt={food.name}
                                      className="w-full h-full object-cover"
                                      width={48}
                                      height={48}
                                    />
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 border-2 border-zone-green bg-transparent rounded-full flex items-center justify-center flex-shrink-0">
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
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-10 w-10 text-muted-foreground touch-manipulation [&_svg]:!h-[24px] [&_svg]:!w-[24px] active:text-foreground active:scale-95"
                                      onClick={e => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                      }}
                                      aria-label="Entry options"
                                    >
                                      <MoreVertical />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <DropdownMenuItem
                                      onClick={e =>
                                        handleDuplicateFood(food.id, e)
                                      }
                                      disabled={isDuplicating === food.id}
                                    >
                                      <Copy className="mr-2 h-4 w-4" />
                                      {isDuplicating === food.id
                                        ? 'Duplicating...'
                                        : 'Duplicate'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={e => handleEditFood(food.id, e)}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={e => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setDeletingFoodId(food.id);
                                      }}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </div>
                  );
                }

                // Render signal entry
                if (entry.type === 'signal') {
                  const symptom = entry.data;
                  return (
                    <Link
                      key={entry.id}
                      href={`/app/symptoms/edit/${symptom.id}`}
                      prefetch={true}
                      className="block"
                    >
                      <Card className="cursor-pointer active:shadow-xl active:scale-[0.99] transition-all duration-200">
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 border-2 border-destructive bg-transparent rounded-full flex items-center justify-center">
                                <span className="text-foreground text-lg">
                                  {getCategoryInfoSafe(symptom.category)
                                    ?.icon || '⚡'}
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
                            <Badge
                              variant="outline"
                              className="text-xs capitalize"
                            >
                              {symptom.category}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                }

                return null;
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deletingFoodId !== null}
        onOpenChange={open => {
          if (!open) setDeletingFoodId(null);
        }}
      >
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
              onClick={() => {
                if (deletingFoodId) {
                  handleDeleteFood(deletingFoodId);
                }
              }}
              className="bg-destructive text-destructive-foreground active:bg-destructive/90 active:scale-95"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ErrorBoundary>
  );
}
