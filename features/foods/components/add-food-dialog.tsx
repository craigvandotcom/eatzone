'use client';

import type { Food } from '@/lib/types';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/components/ui/use-mobile';
import { useKeyboardAwareScroll } from '@/components/ui/use-keyboard-aware-scroll';
import { FoodEntryForm } from './food-entry-form';

interface AddFoodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddFood: (food: Omit<Food, 'id' | 'timestamp'>) => void;
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [availableHeight, setAvailableHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 0
  );
  const contentRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    onOpenChange(false);
    onClose();
  };

  const title = editingFood ? 'Edit Food' : 'Add Food';

  // Enable keyboard-aware scrolling for mobile drawer
  useKeyboardAwareScroll({ enabled: isMobile && open });

  // Handle viewport changes and keyboard detection
  useEffect(() => {
    if (!isMobile || !open) return;

    const updateHeights = () => {
      // Use visualViewport API for accurate keyboard detection
      const viewport = window.visualViewport;
      if (viewport) {
        const keyboardOffset = window.innerHeight - viewport.height;
        setKeyboardHeight(keyboardOffset);
        setAvailableHeight(viewport.height);
      } else {
        // Fallback for browsers without visualViewport
        setAvailableHeight(window.innerHeight);
      }
    };

    // Initial setup
    updateHeights();

    // Listen for viewport changes
    const handleResize = () => updateHeights();
    const handleScroll = () => updateHeights();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleScroll);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobile, open]);

  if (isMobile) {
    // Calculate dynamic max height based on available space
    const maxDrawerHeight =
      keyboardHeight > 0
        ? `${availableHeight - 20}px` // Leave small gap when keyboard is visible
        : '90vh'; // Use most of screen when keyboard is hidden

    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          className="flex flex-col drawer-content"
          style={
            {
              maxHeight: maxDrawerHeight,
              // Override base drawer styles
              marginTop: 0,
              height: 'auto',
            } as React.CSSProperties
          }
        >
          <DrawerHeader className="flex-shrink-0 text-left">
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div
            ref={contentRef}
            className="flex-1 overflow-y-auto px-4 pb-4 drawer-scrollable"
            style={
              {
                // Ensure smooth scrolling
                WebkitOverflowScrolling: 'touch',
                // Prevent overscroll bounce that can interfere with drawer
                overscrollBehavior: 'contain',
              } as React.CSSProperties
            }
          >
            <FoodEntryForm
              onAddFood={onAddFood}
              onClose={handleClose}
              editingFood={editingFood}
              imageData={imageData}
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
