'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Upload, X } from 'lucide-react';
import { logger } from '@/lib/utils/logger';
import { APP_CONFIG } from '@/lib/config/constants';
import { validateImageFile } from '@/lib/utils/file-validation';
import { smartCompressImage } from '@/lib/utils/image-compression';
import { ModeSelector, type CameraMode } from './mode-selector';

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
  title: _title,
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
  const [selectedMode, setSelectedMode] = useState<CameraMode>('camera');

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

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (capturedImages.length >= maxImages) return; // Prevent capture if at limit

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    try {
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data as base64 with higher initial quality
      const rawImageData = canvas.toDataURL('image/jpeg', 0.95);

      // Validate captured image before compression
      const validationResult = validateImageFile(rawImageData);
      if (!validationResult.valid) {
        logger.error(
          'Camera capture validation failed',
          validationResult.error
        );
        setError(validationResult.error?.message || 'Invalid image captured');
        return;
      }

      // Compress image to optimize storage
      const compressionResult = await smartCompressImage(rawImageData);

      logger.debug('Image captured and compressed', {
        originalSize: compressionResult.originalSize,
        compressedSize: compressionResult.compressedSize,
        quality: compressionResult.quality,
        compressionRatio: compressionResult.compressionRatio,
      });

      // Add compressed image to captured images
      const newImages = [...capturedImages, compressionResult.compressedImage];
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
    } catch (error) {
      logger.error('Failed to capture and compress image', error);
      setError('Failed to capture image. Please try again.');
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

  const handleModeChange = (mode: CameraMode) => {
    setSelectedMode(mode);

    switch (mode) {
      case 'cancel':
        handleClose();
        break;
      case 'manual':
        handleManualEntry();
        break;
      case 'upload':
        // Mode changed to upload - user can now click the upload area
        break;
      case 'camera':
        // Multi-camera mode - user can tap to capture multiple photos
        break;
      case 'barcode':
        // Placeholder - not implemented yet
        break;
      case 'label':
        // Placeholder - not implemented yet
        break;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Camera View or Image Gallery */}
      <div className="relative h-full bg-black">
        {/* Image thumbnails */}
        {capturedImages.length > 0 && (
          <div className="absolute top-6 left-0 right-0 z-20 px-4">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {capturedImages.map((img, index) => (
                <div key={index} className="relative flex-shrink-0 group">
                  <img
                    src={img}
                    alt={`Captured ${index + 1}`}
                    className="h-20 w-20 object-cover rounded-xl border-2 border-white/40 shadow-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute -top-1 -right-1 bg-red-500/90 text-white rounded-full p-1 hover:bg-red-600 hover:scale-110 transition-all duration-200 shadow-md backdrop-blur-sm"
                  >
                    <X className="h-3.5 w-3.5 stroke-2" />
                  </button>
                </div>
              ))}
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

            {/* Capture Overlay - only active in camera mode */}
            {selectedMode === 'camera' && (
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
                      {maxImages > 1 ? ' photos' : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Overlay - only active in upload mode */}
            {selectedMode === 'upload' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-32 h-32"
                    disabled={capturedImages.length >= maxImages}
                  />
                  <div className="w-32 h-32 rounded-full border-4 border-white/80 bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg cursor-pointer hover:bg-white/30 transition-colors">
                    <Upload className="h-12 w-12 text-white" />
                  </div>
                </div>
              </div>
            )}
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

      {/* Mode Selector Overlay - Always visible at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-60 p-4 bg-gradient-to-t from-black/80 via-black/60 to-transparent backdrop-blur-sm">
        <ModeSelector
          selectedMode={selectedMode}
          onModeChange={handleModeChange}
          hasImages={capturedImages.length > 0}
          onSubmit={handleDone}
          isSubmitting={isPending}
        />
      </div>
    </div>
  );
}
