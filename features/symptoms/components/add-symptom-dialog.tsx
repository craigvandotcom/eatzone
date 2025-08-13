'use client';

import type { Symptom } from '@/lib/types';

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
import { MSQSymptomEntryForm } from './msq-symptom-entry-form';

interface AddSymptomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSymptom: (symptom: Omit<Symptom, 'id' | 'timestamp'>) => void;
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [availableHeight, setAvailableHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 0
  );
  const contentRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    onOpenChange(false);
    onClose();
  };

  const title = editingSymptom ? 'Edit Symptom' : 'Add Symptoms';

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

  // Ensure active input stays visible when keyboard appears
  useEffect(() => {
    if (!isMobile || !open) return;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Small delay to ensure keyboard is fully shown
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
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
            <MSQSymptomEntryForm
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
        <MSQSymptomEntryForm
          onAddSymptom={onAddSymptom}
          onClose={handleClose}
          editingSymptom={editingSymptom}
        />
      </DialogContent>
    </Dialog>
  );
}
