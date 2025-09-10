'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Edit3, Upload, X, Check, Plus } from 'lucide-react';
import { logger } from '@/lib/utils/logger';
import { APP_CONFIG } from '@/lib/config/constants';

interface MultiCameraCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (images: string[]) => void;
  onManualEntry: () => void;
  title: string;
  maxImages?: number;
}

export function MultiCameraCapture({
  open,
  onOpenChange,
  onCapture,
  onManualEntry,
  title,
  maxImages = APP_CONFIG.IMAGE.MAX_CAMERA_IMAGES,
}: MultiCameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [showCamera, setShowCamera] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      startCamera();
      setCapturedImages([]);
      setShowCamera(true);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [open]);

  // Attach video stream to video element when stream is available
  useEffect(() => {
    if (stream && videoRef.current && showCamera) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        logger.error('Error playing video', err);
      });
    }
  }, [stream, showCamera]);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
      });

      setStream(mediaStream);
      setIsLoading(false);
    } catch (err) {
      logger.error('Error accessing camera', err);
      setError('Unable to access camera. Please check permissions.');
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (capturedImages.length >= maxImages) return; // Prevent capture if at limit

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data as base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    // Add to captured images
    const newImages = [...capturedImages, imageData];
    setCapturedImages(newImages);

    // Auto-submit after reaching max images
    if (newImages.length >= maxImages) {
      // Small delay to show the final image in collection, then navigate smoothly
      setTimeout(() => {
        stopCamera();
        // Use React 19 transition to coordinate navigation and modal closing
        startTransition(() => {
          onCapture(newImages);
          onOpenChange(false);
        });
      }, 500);
    }
  };

  const removeImage = (index: number) => {
    const newImages = capturedImages.filter((_, i) => i !== index);
    setCapturedImages(newImages);
    // Camera always stays visible - no need to manage showCamera state
  };

  const handleManualEntry = () => {
    stopCamera();
    onOpenChange(false);
    onManualEntry();
  };

  const handleClose = () => {
    stopCamera();
    onOpenChange(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = maxImages - capturedImages.length;
    const filesToProcess = files.slice(0, remainingSlots);

    try {
      // First validate all files on server-side
      const validationPromises = filesToProcess.map(async file => {
        // Convert file to base64 for validation
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Validate with server
        const response = await fetch('/api/upload-validation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type,
            size: file.size,
            base64Data,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'File validation failed');
        }

        return base64Data;
      });

      // Wait for all validations to complete
      const validatedImages = await Promise.all(validationPromises);

      const updatedImages = [...capturedImages, ...validatedImages];
      setCapturedImages(updatedImages);

      if (updatedImages.length >= maxImages) {
        setShowCamera(false);
      }
    } catch (error) {
      logger.error('File upload validation failed', error);
      setError(
        error instanceof Error ? error.message : 'File validation failed'
      );
    }
  };

  const handleDone = () => {
    if (capturedImages.length > 0) {
      stopCamera();
      // Use React 19 transition to coordinate navigation and modal closing
      startTransition(() => {
        onCapture(capturedImages);
        onOpenChange(false);
      });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/70">
            {isPending ? (
              'Processing...'
            ) : (
              <>
                {capturedImages.length}/{maxImages} photos
                {capturedImages.length >= maxImages && ' - Auto-submitting...'}
              </>
            )}
          </span>
        </div>
      </div>

      {/* Camera View or Image Gallery */}
      <div className="relative h-full bg-black">
        {/* Image thumbnails */}
        {capturedImages.length > 0 && (
          <div className="absolute top-20 left-0 right-0 z-20 px-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {capturedImages.map((img, index) => (
                <div key={index} className="relative flex-shrink-0">
                  <img
                    src={img}
                    alt={`Captured ${index + 1}`}
                    className="h-20 w-20 object-cover rounded-lg border-2 border-white/50"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {capturedImages.length < maxImages && (
                <button
                  onClick={() => setShowCamera(true)}
                  className="h-20 w-20 flex items-center justify-center rounded-lg border-2 border-dashed border-white/30 hover:border-white/50"
                >
                  <Plus className="h-6 w-6 text-white/50" />
                </button>
              )}
            </div>
          </div>
        )}

        {!isLoading && !error && (
          <div className="relative h-full overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />

            {/* Camera overlay grid */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full border-2 border-white/20">
                <div className="w-full h-1/3 border-b border-white/20"></div>
                <div className="w-full h-1/3 border-b border-white/20"></div>
              </div>
              <div className="absolute inset-0">
                <div className="w-1/3 h-full border-r border-white/20 float-left"></div>
                <div className="w-1/3 h-full border-r border-white/20 float-left"></div>
              </div>
            </div>

            {/* Full-screen Tap-to-Capture Overlay */}
            <div
              className="absolute inset-0 cursor-pointer bg-black/5 hover:bg-black/10 active:bg-black/20 transition-colors"
              onClick={captureImage}
            >
              {/* Centered camera icon with counter */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full border-4 border-white/40 bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <Camera className="h-8 w-8 text-white/70" />
                  </div>
                  {/* Simple counter display */}
                  <p className="text-white/80 text-sm font-medium mt-2 bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
                    {capturedImages.length}/{maxImages}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-300">Starting camera...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-4">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-300 text-sm">{error}</p>
              <div className="flex flex-col gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={startCamera}>
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* This preview mode is no longer needed - camera stays active */}

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-black/50 backdrop-blur-sm">
        <div className="flex gap-3">
          <Button
            onClick={handleClose}
            variant="outline"
            className="w-16 h-12 border-red-500/30 text-red-400 hover:bg-red-500/20"
            size="lg"
          >
            Cancel
          </Button>

          <div className="relative flex-1">
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={capturedImages.length >= maxImages}
            />
            <Button
              variant="outline"
              className="w-full h-12 text-white border-white/50"
              size="lg"
              disabled={capturedImages.length >= maxImages}
            >
              <Upload className="h-5 w-5 mr-2" />
              Upload
            </Button>
          </div>

          <Button
            onClick={handleManualEntry}
            variant="outline"
            className="flex-1 text-white border-white/50"
            size="lg"
          >
            <Edit3 className="h-5 w-5 mr-2" />
            Manual
          </Button>

          <Button
            onClick={handleDone}
            className="w-20 h-12 bg-green-500 hover:bg-green-600 text-white"
            size="lg"
            disabled={capturedImages.length === 0 || isPending}
          >
            <Check className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
