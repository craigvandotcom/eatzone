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

// Note: Image size validation is now handled in SecureImageStorage

export default function AddFoodPage() {
  const router = useRouter();
  const [imageData, setImageData] = useState<string | undefined>();
  const [capturedImages, setCapturedImages] = useState<string[] | undefined>();

  useEffect(() => {
    // Atomic sessionStorage operations to prevent race conditions
    const processSessionStorageImages = () => {
      let foundMultipleImages = false;
      let validImages: string[] = [];
      let singleImage: string | undefined;

      // Atomically retrieve and clear multiple images data
      const pendingImagesJson = sessionStorage.getItem('pendingFoodImages');
      if (pendingImagesJson) {
        sessionStorage.removeItem('pendingFoodImages');

        try {
          const images = JSON.parse(pendingImagesJson);
          if (Array.isArray(images) && images.length > 0) {
            // Validate all images are proper base64
            validImages = images.filter(
              img => typeof img === 'string' && img.startsWith('data:image/')
            );

            if (validImages.length > 0) {
              logger.debug('Valid multiple images found', {
                totalImages: images.length,
                validImages: validImages.length,
              });
              foundMultipleImages = true;
            }
          }
        } catch (error) {
          logger.error(
            'Error parsing multiple images from sessionStorage',
            error
          );
        }
      }

      // Atomically retrieve and clear single image data (backward compatibility)
      const pendingImage = sessionStorage.getItem('pendingFoodImage');
      if (pendingImage) {
        sessionStorage.removeItem('pendingFoodImage');

        if (!foundMultipleImages) {
          logger.debug('Checking for single pending image', {
            hasPendingImage: !!pendingImage,
            imageLength: pendingImage?.length,
          });

          // Validate it's a proper base64 image
          if (pendingImage.startsWith('data:image/')) {
            logger.debug(
              'Valid single image data found, setting imageData state'
            );
            singleImage = pendingImage;
          } else {
            logger.error(
              'Invalid single image data retrieved from sessionStorage',
              {
                imageStart: pendingImage.substring(0, 50),
              }
            );
            // Return early to prevent form submission with invalid data
            toast.error('Failed to load captured image. Please try again.');
            router.push('/app'); // Prevent form submission by redirecting back
            return;
          }
        } else {
          logger.debug(
            'Skipping single image processing since multiple images were found'
          );
        }
      } else if (!foundMultipleImages) {
        logger.debug('No pending single image found in sessionStorage');
      }

      // Set state atomically after all validation
      if (foundMultipleImages && validImages.length > 0) {
        setCapturedImages(validImages);
      } else if (singleImage) {
        setImageData(singleImage);
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
    // Include image data if available (prioritize captured images, fallback to single image)
    if (capturedImages?.length) {
      // Multiple images from camera
      await dbAddFood({ ...food, images: capturedImages });
    } else if (imageData) {
      // Single image (backward compatibility)
      await dbAddFood({ ...food, image: imageData });
    } else {
      // No images
      await dbAddFood(food);
    }

    // Invalidate SWR cache to trigger immediate refresh
    await mutate('dashboard-data');

    router.push('/app');
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
            imageData={imageData}
            capturedImages={capturedImages}
          />
        </ImageProcessingErrorBoundary>
      </main>
    </div>
  );
}
