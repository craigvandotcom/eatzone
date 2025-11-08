'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SymptomEntryForm } from '@/features/symptoms/components/symptom-entry-form';
import {
  getSymptomById,
  updateSymptom as dbUpdateSymptom,
  deleteSymptom,
} from '@/lib/db';
import { mutate } from 'swr';
import type { Symptom } from '@/lib/types';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';
import { useIsMobile } from '@/components/ui/use-mobile';
import { useKeyboardAwareScroll } from '@/components/ui/use-keyboard-aware-scroll';

export default function EditSymptomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [symptom, setSymptom] = useState<Symptom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [symptomId, setSymptomId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Enable keyboard-aware scrolling on mobile to prevent keyboard from hiding inputs
  useKeyboardAwareScroll({ enabled: isMobile });

  // Prefetch dashboard route for faster navigation back
  useEffect(() => {
    router.prefetch('/app');
  }, [router]);

  // First resolve params
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolvedParams = await params;
        setSymptomId(resolvedParams.id);
      } catch (error) {
        console.error('Error resolving params:', error);
        setError('Failed to load page parameters');
        setLoading(false);
      }
    };

    resolveParams();
  }, [params]);

  // Then load symptom data
  useEffect(() => {
    if (!symptomId) return;

    const loadSymptom = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Loading symptom with ID:', symptomId);

        const symptomData = await getSymptomById(symptomId);
        console.log('Symptom data loaded:', symptomData);

        if (symptomData) {
          setSymptom(symptomData);
        } else {
          console.log('Symptom not found, navigating back');
          router.back();
          return;
        }
      } catch (error) {
        console.error('Error loading symptom:', error);
        logger.error('Error loading symptom', error);
        setError(
          error instanceof Error ? error.message : 'Failed to load symptom'
        );
      } finally {
        setLoading(false);
      }
    };

    loadSymptom();
  }, [symptomId, router]);

  const handleUpdateSymptom = async (updatedSymptom: Omit<Symptom, 'id'>) => {
    try {
      if (symptom) {
        await dbUpdateSymptom(symptom.id, updatedSymptom);

        // Invalidate SWR cache to trigger immediate refresh
        await mutate('dashboard-data');

        toast.success('Symptom updated successfully');
        router.push('/app');
      }
    } catch (error) {
      logger.error('Failed to update symptom', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to update symptom. Please try again.';
      toast.error(errorMessage);
    }
  };

  const handleDeleteSymptom = async () => {
    if (symptom) {
      try {
        await deleteSymptom(symptom.id);

        // Invalidate SWR cache to trigger immediate refresh
        await mutate('dashboard-data');

        toast.success('Symptom deleted successfully');
        router.push('/app');
      } catch (error) {
        logger.error('Failed to delete symptom', error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to delete symptom. Please try again.';
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
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading symptom...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!symptom) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Symptom not found
          </p>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen-dynamic bg-background flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 z-10 bg-background border-b">
        <div className="flex items-center px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Edit Signal</h1>
        </div>
      </header>

      {/* Form Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <SymptomEntryForm
          onAddSymptom={async (symptoms, timestamps) => {
            // Handle single symptom update - use first symptom with its timestamp
            if (symptoms.length > 0 && timestamps && timestamps.length > 0) {
              const symptomWithTimestamp = {
                ...symptoms[0],
                timestamp: timestamps[0].toISOString(),
              };
              await handleUpdateSymptom(symptomWithTimestamp);
            }
          }}
          onClose={handleClose}
          onDelete={handleDeleteSymptom}
          editingSymptom={symptom}
        />
      </main>
    </div>
  );
}
