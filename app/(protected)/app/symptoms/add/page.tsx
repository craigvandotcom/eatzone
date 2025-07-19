"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SymptomEntryForm } from "@/features/symptoms/components/symptom-entry-form";
import { addSymptom as dbAddSymptom } from "@/lib/db";
import type { Symptom } from "@/lib/types";

export default function AddSymptomPage() {
  const router = useRouter();

  const handleAddSymptom = async (
    symptom: Omit<Symptom, "id" | "timestamp">
  ) => {
    await dbAddSymptom(symptom);
    router.back();
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-background">
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
          <h1 className="text-xl font-semibold">Add Symptoms</h1>
        </div>
      </header>

      {/* Form Content */}
      <main className="px-4 py-6">
        <SymptomEntryForm
          onAddSymptom={handleAddSymptom}
          onClose={handleClose}
        />
      </main>
    </div>
  );
}
