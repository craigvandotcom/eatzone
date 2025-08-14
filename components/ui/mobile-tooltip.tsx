'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/components/ui/use-mobile';

const MobileTooltipProvider = TooltipPrimitive.Provider;

interface MobileTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

/**
 * A tooltip component that works on both desktop (hover) and mobile (click/touch).
 * On desktop, it behaves like a normal tooltip with hover interactions.
 * On mobile, it shows on click and can be dismissed by clicking outside or on the trigger again.
 */
const MobileTooltip = React.forwardRef<
  HTMLDivElement,
  MobileTooltipProps
>(({ children, content, side = 'top', align = 'center' }, ref) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = React.useState(false);
  const [shouldUseClick, setShouldUseClick] = React.useState(false);

  // Determine interaction method based on device capabilities
  React.useEffect(() => {
    // Check for touch capability and mobile screen size
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setShouldUseClick(isMobile || hasTouch);
  }, [isMobile]);

  const handleTriggerClick = React.useCallback(
    (event: React.MouseEvent) => {
      if (shouldUseClick) {
        event.preventDefault();
        event.stopPropagation();
        setIsOpen(prev => !prev);
      }
    },
    [shouldUseClick]
  );

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (!shouldUseClick) {
        setIsOpen(open);
      }
    },
    [shouldUseClick]
  );

  // Close tooltip when clicking outside on mobile
  React.useEffect(() => {
    if (!shouldUseClick || !isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const tooltipElement = document.querySelector('[data-radix-tooltip-content]');
      const triggerElement = document.querySelector('[data-radix-tooltip-trigger]');
      
      if (
        tooltipElement &&
        !tooltipElement.contains(target) &&
        triggerElement &&
        !triggerElement.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [shouldUseClick, isOpen]);

  if (shouldUseClick) {
    // Mobile/touch implementation with click interaction
    return (
      <TooltipPrimitive.Root
        open={isOpen}
        onOpenChange={setIsOpen}
        disableHoverableContent
      >
        <TooltipPrimitive.Trigger
          asChild
          onClick={handleTriggerClick}
          data-radix-tooltip-trigger=""
        >
          <div ref={ref} className="inline-flex">
            {children}
          </div>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={8}
          data-radix-tooltip-content=""
          className={cn(
            'z-50 overflow-hidden rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg',
            'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            'max-w-xs touch-manipulation select-none'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-popover" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Root>
    );
  }

  // Desktop implementation with hover interaction
  return (
    <TooltipPrimitive.Root onOpenChange={handleOpenChange}>
      <TooltipPrimitive.Trigger asChild>
        <div ref={ref} className="inline-flex">
          {children}
        </div>
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Content
        side={side}
        align={align}
        sideOffset={4}
        className={cn(
          'z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md',
          'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2'
        )}
      >
        {content}
        <TooltipPrimitive.Arrow className="fill-popover" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Root>
  );
});
MobileTooltip.displayName = 'MobileTooltip';

export { MobileTooltip, MobileTooltipProvider };