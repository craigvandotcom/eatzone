'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MSQSymptomEntryForm } from '@/features/symptoms/components/msq-symptom-entry-form';
import { getSymptomById, updateSymptom as dbUpdateSymptom } from '@/lib/db';
import { mutate } from 'swr';
import type { Symptom } from '@/lib/types';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

export default function EditSymptomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [symptom, setSymptom] = useState<Symptom | null>(null);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    const loadSymptom = async () => {
      try {
        const resolvedParams = await params;
        
        // Check if component is still mounted before updating state
        if (!isMountedRef.current) return;
        
        const symptomData = await getSymptomById(resolvedParams.id);
        
        if (!isMountedRef.current) return;
        
        if (symptomData) {
          setSymptom(symptomData);
        } else {
          // If symptom not found, go back
          router.back();
        }
      } catch (error) {
        if (!isMountedRef.current) return;
        
        logger.error('Error loading symptom', error);
        router.back();
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadSymptom();
  }, [params, router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleUpdateSymptom = async (
    updatedSymptom: Omit<Symptom, 'id' | 'timestamp'>
  ) => {
    try {
      if (symptom) {
        await dbUpdateSymptom(symptom.id, updatedSymptom);

        // Invalidate SWR cache to trigger immediate refresh
        await mutate('dashboard-data');

        toast.success('Symptom updated successfully');
        router.push('/app');
      }
    } catch (error) {
      console.error('Failed to update symptom:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update symptom. Please try again.';
      toast.error(errorMessage);
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

  if (!symptom) {
    return null;
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
          <h1 className="text-xl font-semibold">Edit Symptom</h1>
        </div>
      </header>

      {/* Form Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <MSQSymptomEntryForm
          onAddSymptom={handleUpdateSymptom}
          onClose={handleClose}
          editingSymptom={symptom}
        />
      </main>
    </div>
  );
}
