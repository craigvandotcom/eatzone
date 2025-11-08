'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { SymptomTimeline } from '@/features/symptoms/components/symptom-timeline';
import {
  SymptomEntrySkeleton,
  EmptyOrLoadingState,
  DataLoadingState,
} from '@/components/ui/loading-states';
import {
  ErrorBoundary,
  SupabaseErrorFallback,
} from '@/components/error-boundary';
import { getCategoryInfo } from '@/lib/symptoms/symptom-index';

// Import types
import { Symptom } from '@/lib/types';

interface SignalsViewProps {
  symptomsForSelectedDate?: Symptom[];
}

export function SignalsView({ symptomsForSelectedDate }: SignalsViewProps) {
  return (
    <ErrorBoundary fallback={SupabaseErrorFallback}>
      {/* Symptom Timeline for Selected Date */}
      <div className="space-y-4">
        {symptomsForSelectedDate === undefined ? (
          <div className="bg-muted rounded-lg p-4 h-32">
            <DataLoadingState message="Loading symptom data..." />
          </div>
        ) : (
          <SymptomTimeline symptoms={symptomsForSelectedDate} />
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Entries</h2>
          <span className="text-muted-foreground text-sm">
            {symptomsForSelectedDate?.length || 0} entries
          </span>
        </div>
        <div className="space-y-3">
          <EmptyOrLoadingState
            isLoading={symptomsForSelectedDate === undefined}
            isEmpty={symptomsForSelectedDate?.length === 0}
            loadingMessage="Loading symptoms for selected date..."
            emptyTitle="No signals logged for this date"
            emptyDescription="Tap the + button to add a symptom entry"
            EmptyIconComponent={Activity}
          />
          {symptomsForSelectedDate === undefined && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SymptomEntrySkeleton key={i} />
              ))}
            </div>
          )}
          {symptomsForSelectedDate &&
            symptomsForSelectedDate.length > 0 &&
            symptomsForSelectedDate.map(symptom => (
              <Link
                key={symptom.id}
                href={`/app/symptoms/edit/${symptom.id}`}
                prefetch={true}
              >
                <Card className="cursor-pointer hover:shadow-xl transition-shadow duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 border-2 border-primary bg-transparent rounded-full flex items-center justify-center">
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
              </Link>
            ))}
        </div>
      </div>
    </ErrorBoundary>
  );
}
