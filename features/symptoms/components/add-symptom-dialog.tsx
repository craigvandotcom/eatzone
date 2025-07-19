"use client";

import type { Symptom } from "@/lib/types";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { SymptomEntryForm } from "./symptom-entry-form";

interface AddSymptomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSymptom: (symptom: Omit<Symptom, "id" | "timestamp">) => void;
  onClose: () => void;
  editingSymptom?: Symptom | null;
}

export function AddSymptomDialog({
  open,
  onOpenChange,
  onAddSymptom,
  onClose,
  editingSymptom,
}: AddSymptomDialogProps) {
  const isMobile = useIsMobile();

  const handleClose = () => {
    onOpenChange(false);
    onClose();
  };

  const title = editingSymptom ? "Edit Symptom" : "Add Symptoms";

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <SymptomEntryForm
              onAddSymptom={onAddSymptom}
              onClose={handleClose}
              editingSymptom={editingSymptom}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <SymptomEntryForm
          onAddSymptom={onAddSymptom}
          onClose={handleClose}
          editingSymptom={editingSymptom}
        />
      </DialogContent>
    </Dialog>
  );
}
