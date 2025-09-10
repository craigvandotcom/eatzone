'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SymptomEntryForm } from '@/features/symptoms/components/symptom-entry-form';
import { addSymptoms as dbAddSymptoms } from '@/lib/db';
import { mutate } from 'swr';
import type { Symptom } from '@/lib/types';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

export default function AddSymptomPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSymptoms = async (
    symptoms: Omit<Symptom, 'id' | 'timestamp'>[],
    timestamps?: Date[]
  ) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Add timestamps to symptoms
      const symptomsWithTimestamps = symptoms.map((symptom, index) => ({
        ...symptom,
        timestamp:
          timestamps?.[index]?.toISOString() || new Date().toISOString(),
      }));

      await dbAddSymptoms(symptomsWithTimestamps);

      // Invalidate SWR cache to trigger immediate refresh
      await mutate('dashboard-data');

      const count = symptoms.length;
      toast.success(
        `${count} symptom${count > 1 ? 's' : ''} added successfully`
      );
      router.push('/app');
    } catch (error) {
      logger.error('Failed to add symptoms', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to add symptoms. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    router.push('/app');
  };

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
          <h1 className="text-xl font-semibold">Add Symptoms</h1>
        </div>
      </header>

      {/* Form Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <SymptomEntryForm
          onAddSymptom={handleAddSymptoms}
          onClose={handleClose}
          isSubmitting={isSubmitting}
        />
      </main>
    </div>
  );
}
