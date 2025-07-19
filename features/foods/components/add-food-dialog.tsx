"use client";

import type { Food } from "@/lib/types";

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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { FoodEntryForm } from "./food-entry-form";

interface AddFoodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddFood: (food: Omit<Food, "id" | "timestamp">) => void;
  onClose: () => void;
  editingFood?: Food | null;
  imageData?: string;
}

export function AddFoodDialog({
  open,
  onOpenChange,
  onAddFood,
  onClose,
  editingFood,
  imageData,
}: AddFoodDialogProps) {
  const isMobile = useIsMobile();

  const handleClose = () => {
    onOpenChange(false);
    onClose();
  };

  const title = editingFood ? "Edit Food" : "Add Food";

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left flex-shrink-0">
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="flex-1 px-4">
            <div className="pb-4">
              <FoodEntryForm
                onAddFood={onAddFood}
                onClose={handleClose}
                editingFood={editingFood}
                imageData={imageData}
              />
            </div>
          </ScrollArea>
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
        <FoodEntryForm
          onAddFood={onAddFood}
          onClose={handleClose}
          editingFood={editingFood}
          imageData={imageData}
        />
      </DialogContent>
    </Dialog>
  );
}
