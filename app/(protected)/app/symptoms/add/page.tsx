'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MSQSymptomEntryForm } from '@/features/symptoms/components/msq-symptom-entry-form';
import { addSymptom as dbAddSymptom } from '@/lib/db';
import { mutate } from 'swr';
import type { Symptom } from '@/lib/types';
import { toast } from 'sonner';

export default function AddSymptomPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSymptom = async (
    symptom: Omit<Symptom, 'id' | 'timestamp'>
  ) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await dbAddSymptom(symptom);

      // Invalidate SWR cache to trigger immediate refresh
      await mutate('dashboard-data');

      toast.success('Symptom added successfully');
      router.push('/app');
    } catch (error) {
      console.error('Failed to add symptom:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add symptom. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    router.back();
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
        <MSQSymptomEntryForm
          onAddSymptom={handleAddSymptom}
          onClose={handleClose}
          isSubmitting={isSubmitting}
        />
      </main>
    </div>
  );
}
