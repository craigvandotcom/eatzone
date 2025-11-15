'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FoodEntryForm } from '@/features/foods/components/food-entry-form';
import { ImageProcessingErrorBoundary } from '@/features/camera/components/image-processing-error-boundary';
import { addFood as dbAddFood } from '@/lib/db';
import { mutate } from 'swr';
import type { Food } from '@/lib/types';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';
import { useIsMobile } from '@/components/ui/use-mobile';
import { useKeyboardAwareScroll } from '@/components/ui/use-keyboard-aware-scroll';

// Note: Image processing simplified to use only multiple images flow

export default function AddFoodPage() {
  const router = useRouter();
  const [capturedImages, setCapturedImages] = useState<string[] | undefined>();
  const isMobile = useIsMobile();

  // Enable keyboard-aware scrolling on mobile to prevent keyboard from hiding inputs
  useKeyboardAwareScroll({ enabled: isMobile });

  // Prefetch dashboard route for faster navigation back
  useEffect(() => {
    router.prefetch('/app');
  }, [router]);

  useEffect(() => {
    // Process captured images from sessionStorage
    const processSessionStorageImages = () => {
      // Retrieve and clear images data
      const pendingImagesJson = sessionStorage.getItem('pendingFoodImages');
      if (pendingImagesJson) {
        sessionStorage.removeItem('pendingFoodImages');

        try {
          const images = JSON.parse(pendingImagesJson);
          if (Array.isArray(images) && images.length > 0) {
            // Fix D: Comprehensive validation of retrieved images
            logger.debug('Images retrieved from sessionStorage', {
              totalImages: images.length,
              firstImageStart: images[0]?.substring(0, 100),
              imageTypes: images.map(img => {
                if (!img || typeof img !== 'string') return 'invalid-type';
                if (img.startsWith('data:image/')) return 'data-url';
                if (img.startsWith('http')) return 'http-url';
                return 'unknown';
              }),
            });

            // Validate all images are proper base64 data URLs
            const validImages = images.filter(img => {
              // Check type
              if (!img || typeof img !== 'string') {
                logger.warn('Invalid image type detected', {
                  type: typeof img,
                  value: String(img).substring(0, 50),
                });
                return false;
              }

              // Check format
              if (!img.startsWith('data:image/')) {
                logger.warn('Image does not start with data:image/', {
                  start: img.substring(0, 50),
                });
                return false;
              }

              // Check structure (must have comma separator)
              if (!img.includes(',') || !img.includes(';base64,')) {
                logger.warn('Image missing base64 separator', {
                  hasComma: img.includes(','),
                  hasBase64Marker: img.includes(';base64,'),
                });
                return false;
              }

              // Basic sanity check - data URL should be reasonably long
              if (img.length < 100) {
                logger.warn('Image data URL suspiciously short', {
                  length: img.length,
                });
                return false;
              }

              return true;
            });

            logger.debug('Image validation results', {
              totalImages: images.length,
              validImages: validImages.length,
              invalidCount: images.length - validImages.length,
            });

            if (validImages.length > 0) {
              logger.debug('Valid images found', {
                totalImages: images.length,
                validImages: validImages.length,
              });
              setCapturedImages(validImages);
            } else {
              // Fix D: Better error messaging when no valid images found
              logger.error('No valid images after filtering', {
                totalImages: images.length,
                sampleImageStart: images[0]?.substring(0, 100),
              });
              toast.error('No valid images found. Please recapture.');
              router.push('/app');
            }
          } else {
            logger.warn('Invalid images array from sessionStorage', {
              isArray: Array.isArray(images),
              length: images?.length,
            });
            toast.error('Invalid image data. Please try again.');
            router.push('/app');
          }
        } catch (error) {
          logger.error('Error parsing images from sessionStorage', error);
          toast.error('Failed to load captured images. Please try again.');
          router.push('/app');
        }
      }
    };

    // Execute the atomic processing
    try {
      processSessionStorageImages();
    } catch (error) {
      logger.error('Error processing session storage images', error);
      toast.error('Failed to load captured image. Please try again.');
      router.push('/app'); // Prevent form submission by redirecting back on error
    }
  }, [router]);

  const handleAddFood = async (food: Omit<Food, 'id' | 'timestamp'>) => {
    try {
      // Include image data if available
      if (capturedImages?.length) {
        await dbAddFood({ ...food, images: capturedImages });
      } else {
        await dbAddFood(food);
      }

      // Invalidate SWR cache to trigger immediate refresh
      await mutate('dashboard-data');

      router.push('/app');
    } catch (error) {
      logger.error('Failed to add food entry', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to save food entry. Please try again.';
      toast.error(errorMessage);
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
          <h1 className="text-xl font-semibold">Add Food</h1>
        </div>
      </header>

      {/* Form Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <ImageProcessingErrorBoundary
          onRetry={() => {
            // Retry by refreshing the page state
            window.location.reload();
          }}
          onCancel={() => {
            // Cancel by going back
            router.back();
          }}
          onError={(error, errorInfo) => {
            logger.error('Food entry form error boundary caught error:', {
              error: error.message,
              stack: error.stack,
              componentStack: errorInfo.componentStack,
            });
          }}
        >
          <FoodEntryForm
            onAddFood={handleAddFood}
            onClose={handleClose}
            capturedImages={capturedImages}
          />
        </ImageProcessingErrorBoundary>
      </main>
    </div>
  );
}
