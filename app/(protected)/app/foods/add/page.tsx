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

  useEffect(() => {
    // Check if there's a pending image from camera capture in sessionStorage
    const pendingImage = sessionStorage.getItem('pendingFoodImage');
    logger.debug('Checking for pending image', {
      hasPendingImage: !!pendingImage,
      imageLength: pendingImage?.length,
    });

    if (pendingImage) {
      try {
        // Validate it's a proper base64 image
        if (pendingImage.startsWith('data:image/')) {
          logger.debug('Valid image data found, setting imageData state');
          setImageData(pendingImage);
        } else {
          logger.error('Invalid image data retrieved from sessionStorage', {
            imageStart: pendingImage.substring(0, 50),
          });
          toast.error('Failed to load captured image. Please try again.');
        }
      } catch (error) {
        logger.error('Error processing pending image', error);
        toast.error('Failed to load captured image. Please try again.');
      }

      // Clear it after retrieval to prevent reuse
      sessionStorage.removeItem('pendingFoodImage');
    } else {
      logger.debug('No pending image found in sessionStorage');
    }
  }, []);

  const handleAddFood = async (food: Omit<Food, 'id' | 'timestamp'>) => {
    // Include image data if available
    const foodWithImage = imageData ? { ...food, image: imageData } : food;
    await dbAddFood(foodWithImage);

    // Invalidate SWR cache to trigger immediate refresh
    await mutate('dashboard-data');

    router.push('/app');
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
          <h1 className="text-xl font-semibold">Add Food</h1>
        </div>
      </header>

      {/* Form Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <FoodEntryForm
          onAddFood={handleAddFood}
          onClose={handleClose}
          imageData={imageData}
        />
      </main>
    </div>
  );
}
