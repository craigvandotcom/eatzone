'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FoodEntryForm } from '@/features/foods/components/food-entry-form';
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
    let foundMultipleImages = false;

    // Priority 1: Check for multiple images from camera capture
    const pendingImagesJson = sessionStorage.getItem('pendingFoodImages');

    if (pendingImagesJson) {
      try {
        const images = JSON.parse(pendingImagesJson);
        if (Array.isArray(images) && images.length > 0) {
          // Validate all images are proper base64
          const validImages = images.filter(
            img => typeof img === 'string' && img.startsWith('data:image/')
          );

          if (validImages.length > 0) {
            logger.debug('Valid multiple images found', {
              totalImages: images.length,
              validImages: validImages.length,
            });
            setCapturedImages(validImages);
            foundMultipleImages = true;
          }
        }
      } catch (error) {
        logger.error(
          'Error parsing multiple images from sessionStorage',
          error
        );
      }

      // Always clear multiple images data after processing
      sessionStorage.removeItem('pendingFoodImages');
    }

    // Priority 2: Single image (backward compatibility) - only if no multiple images found
    if (!foundMultipleImages) {
      const pendingImage = sessionStorage.getItem('pendingFoodImage');
      logger.debug('Checking for single pending image', {
        hasPendingImage: !!pendingImage,
        imageLength: pendingImage?.length,
      });

      if (pendingImage) {
        try {
          // Validate it's a proper base64 image
          if (pendingImage.startsWith('data:image/')) {
            logger.debug(
              'Valid single image data found, setting imageData state'
            );
            setImageData(pendingImage);
          } else {
            logger.error(
              'Invalid single image data retrieved from sessionStorage',
              {
                imageStart: pendingImage.substring(0, 50),
              }
            );
            toast.error('Failed to load captured image. Please try again.');
          }
        } catch (error) {
          logger.error('Error processing single pending image', error);
          toast.error('Failed to load captured image. Please try again.');
        }
      } else {
        logger.debug('No pending single image found in sessionStorage');
      }
    } else {
      logger.debug(
        'Skipping single image check since multiple images were found'
      );
    }

    // Always clear single image data to prevent conflicts and reuse
    sessionStorage.removeItem('pendingFoodImage');
  }, []);

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
        <FoodEntryForm
          onAddFood={handleAddFood}
          onClose={handleClose}
          imageData={imageData}
          capturedImages={capturedImages}
        />
      </main>
    </div>
  );
}
