'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, X } from 'lucide-react';
import { logger } from '@/lib/utils/logger';
import { APP_CONFIG } from '@/lib/config/constants';
import { validateImageFile } from '@/lib/utils/file-validation';
import { compressImageWithWorker } from '@/lib/utils/worker-compression';
import { ModeSelector, type CameraMode } from './mode-selector';
import { ImageProcessingErrorBoundary } from './image-processing-error-boundary';
import { useErrorHandler } from '@/components/error-boundary';
import { CameraCycleButton } from './camera-cycle-button';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { toast } from 'sonner';

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
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [showCamera, setShowCamera] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [selectedMode, setSelectedMode] = useState<CameraMode>('camera');
  const { handleError } = useErrorHandler();

  // Camera cycling state
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>(
    []
  );
  const [currentCameraIndex, setCurrentCameraIndex] = useState<number>(0);
  const isInitialCameraLoadRef = useRef<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Compress image using Web Worker with smart compression strategy
   * Uses the same logic as smartCompressImage but with Web Worker support
   *
   * Fix A: Ensures compression respects Vercel API body size limits (1MB per image)
   * Fix B: Verifies compression actually reduced size and re-compresses if needed
   */
  const compressImageSmart = async (
    base64Data: string,
    maxSizeBytes: number = APP_CONFIG.IMAGE.MAX_FILE_SIZE
  ) => {
    const { getBase64ImageSize } = await import('@/lib/utils/image-utils');
    const originalSize = getBase64ImageSize(base64Data);

    // Fix A: Cap maxSizeBytes to Vercel API-safe limit (1MB per image)
    // Vercel has a 4.5MB hard limit for serverless function request bodies
    // With JSON overhead and multiple images, 1MB per image ensures we stay under limit
    // Example: 3 images @ 1MB each = ~3MB + JSON overhead = ~3.5MB (safe)
    const VERCEL_API_SAFE_LIMIT = 1 * 1024 * 1024; // 1MB per image
    const effectiveMaxSize = Math.min(maxSizeBytes, VERCEL_API_SAFE_LIMIT);

    // If image is already small enough, return as-is
    if (originalSize <= effectiveMaxSize) {
      return {
        compressedImage: base64Data,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
        quality: 1,
      };
    }

    // Determine compression strategy based on size
    const options: Parameters<typeof compressImageWithWorker>[1] = {
      format: 'image/jpeg',
    };

    // Convert maxSizeBytes to targetSizeKB for worker
    options.targetSizeKB = Math.ceil(effectiveMaxSize / 1024);

    // For very large images, also reduce dimensions
    if (originalSize > effectiveMaxSize * 4) {
      options.maxWidth = 1920;
      options.maxHeight = 1920;
      options.quality = 0.8;
    } else if (originalSize > effectiveMaxSize * 2) {
      options.maxWidth = 2048;
      options.maxHeight = 2048;
      options.quality = 0.85;
    } else {
      options.quality = 0.9;
    }

    // First compression attempt
    let compressionResult = await compressImageWithWorker(base64Data, options);
    const compressedSize = getBase64ImageSize(
      compressionResult.compressedImage
    );

    // Fix B: Verify compression actually reduced size - re-compress if needed
    if (compressedSize > effectiveMaxSize) {
      logger.warn(
        'Compression did not meet target size, re-compressing more aggressively',
        {
          target: effectiveMaxSize,
          actual: compressedSize,
          originalSize,
        }
      );

      // Re-compress with more aggressive settings
      const aggressiveOptions: Parameters<typeof compressImageWithWorker>[1] = {
        format: 'image/jpeg',
        targetSizeKB: Math.ceil(effectiveMaxSize / 1024),
        quality: Math.max(0.5, (options.quality || 0.9) * 0.7), // Reduce quality by 30%
        maxWidth: Math.floor((options.maxWidth || 2048) * 0.8), // Reduce dimensions by 20%
        maxHeight: Math.floor((options.maxHeight || 2048) * 0.8),
      };

      compressionResult = await compressImageWithWorker(
        base64Data,
        aggressiveOptions
      );
      const finalSize = getBase64ImageSize(compressionResult.compressedImage);

      // If still too large after aggressive compression, log warning but proceed
      // (Some images may not compress well, but we'll catch this in storage validation)
      if (finalSize > effectiveMaxSize) {
        logger.warn(
          'Image still exceeds target size after aggressive compression',
          {
            target: effectiveMaxSize,
            finalSize,
            originalSize,
          }
        );
      }
    }

    // Verify compressed image is still a valid data URL
    if (
      !compressionResult.compressedImage.startsWith('data:image/') ||
      !compressionResult.compressedImage.includes(',')
    ) {
      logger.error('Compression produced invalid data URL format', {
        resultStart: compressionResult.compressedImage.substring(0, 100),
      });
      throw new Error('Compression produced invalid image format');
    }

    return compressionResult;
  };

  useEffect(() => {
    if (open) {
      // Only restart camera if currentCameraIndex changed after initial load
      // On initial load, startCamera will be called once, and if preferred camera
      // is found during enumeration, we skip the restart to avoid double initialization
      if (isInitialCameraLoadRef.current) {
        // First time opening - just start camera once
        startCamera();
        setCapturedImages([]);
        setShowCamera(true);
      } else {
        // Camera index changed after initial load (user manually cycled cameras)
        // Safe to restart camera with new device
        startCamera();
      }
    } else {
      stopCamera();
      // Reset the initial camera load flag when modal closes
      // so the next time it opens, we can load preferred camera again
      isInitialCameraLoadRef.current = true;
    }

    return () => {
      stopCamera();
    };
  }, [open, currentCameraIndex]);

  // Attach video stream to video element when stream is available
  useEffect(() => {
    if (stream && videoRef.current && showCamera) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        logger.error('Error playing video', err);
      });
    }
  }, [stream, showCamera]);

  /**
   * Enumerate all available video input devices (cameras)
   * Filters for rear-facing cameras and loads preferred camera from localStorage
   */
  const enumerateCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        device => device.kind === 'videoinput'
      );

      logger.debug('Available video devices', {
        count: videoDevices.length,
        devices: videoDevices.map(d => ({
          id: d.deviceId,
          label: d.label,
        })),
      });

      setAvailableCameras(videoDevices);

      // Only load preferred camera on the first enumeration to avoid camera restart
      // After that, camera changes only happen through manual cycling
      if (isInitialCameraLoadRef.current) {
        // Load preferred camera from localStorage with error handling
        let preferredDeviceId: string | null = null;
        try {
          preferredDeviceId = localStorage.getItem(
            APP_CONFIG.CAMERA.PREFERRED_CAMERA_KEY
          );
        } catch (err) {
          logger.warn('Failed to access localStorage for camera preference', {
            error: err instanceof Error ? err.message : String(err),
          });
          // Continue with default camera if localStorage is unavailable
        }

        if (preferredDeviceId) {
          const preferredIndex = videoDevices.findIndex(
            d => d.deviceId === preferredDeviceId
          );
          // Only switch to preferred camera if it's different from current
          // and the camera is actually available
          if (preferredIndex !== -1 && preferredIndex !== currentCameraIndex) {
            // Mark initial load as complete BEFORE changing camera index
            // This prevents the useEffect from restarting the camera
            isInitialCameraLoadRef.current = false;

            setCurrentCameraIndex(preferredIndex);
            logger.debug('Loaded preferred camera', {
              index: preferredIndex,
              deviceId: preferredDeviceId,
            });
          } else {
            // No camera change needed, just mark initial load as complete
            isInitialCameraLoadRef.current = false;
          }
        } else {
          // No preferred camera, just mark initial load as complete
          isInitialCameraLoadRef.current = false;
        }
      }
    } catch (err) {
      logger.error('Error enumerating cameras', err);
      // Continue with default camera if enumeration fails
    }
  };

  /**
   * Cycle to the next available camera
   */
  const cycleCamera = () => {
    if (availableCameras.length <= 1) return;

    const nextIndex = (currentCameraIndex + 1) % availableCameras.length;
    setCurrentCameraIndex(nextIndex);

    // Save preference to localStorage with error handling
    const selectedDevice = availableCameras[nextIndex];
    if (selectedDevice) {
      try {
        localStorage.setItem(
          APP_CONFIG.CAMERA.PREFERRED_CAMERA_KEY,
          selectedDevice.deviceId
        );
        logger.debug('Saved camera preference', {
          index: nextIndex,
          deviceId: selectedDevice.deviceId,
        });
      } catch (err) {
        logger.warn('Failed to save camera preference to localStorage', {
          error: err instanceof Error ? err.message : String(err),
        });
        // Continue without saving preference if localStorage is unavailable
      }
    }

    // Restart camera with new device
    stopCamera();
  };

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Determine which camera to use
      const selectedCamera = availableCameras[currentCameraIndex];
      const constraints: MediaStreamConstraints = {
        video: selectedCamera?.deviceId
          ? {
              deviceId: { exact: selectedCamera.deviceId },
              width: { ideal: 1280 },
              height: { ideal: 1280 },
            }
          : {
              facingMode: APP_CONFIG.CAMERA.DEFAULT_FACING_MODE,
              width: { ideal: 1280 },
              height: { ideal: 1280 },
            },
      };

      logger.debug('Starting camera with constraints', {
        deviceId: selectedCamera?.deviceId,
        hasDevice: !!selectedCamera,
      });

      const mediaStream =
        await navigator.mediaDevices.getUserMedia(constraints);

      setStream(mediaStream);
      setIsLoading(false);

      // Enumerate cameras after permission is granted and stream is active
      // This ensures device labels are available (browser security requirement)
      await enumerateCameras();
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

    // Check if video is ready - videoWidth and videoHeight must be non-zero
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      logger.warn('Video not ready for capture', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        readyState: video.readyState,
      });
      throw new Error(
        'Camera is still initializing. Please wait a moment and try again.'
      );
    }

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

      // Compress image to optimize storage (using Web Worker)
      const compressionResult = await compressImageSmart(rawImageData);

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
      if (error instanceof Error) {
        handleError(error);
      } else {
        handleError(new Error('Failed to capture image. Please try again.'));
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = capturedImages.filter((_, i) => i !== index);
    setCapturedImages(newImages);
    // Camera always stays visible - no need to manage showCamera state
  };

  const handleManualEntry = () => {
    stopCamera();
    // Use React 19 transition to coordinate navigation and modal closing
    startTransition(() => {
      onManualEntry();
      onOpenChange(false);
    });
  };

  const handleClose = () => {
    stopCamera();
    onOpenChange(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) {
      // Reset mode if no files selected
      setSelectedMode('camera');
      return;
    }

    const remainingSlots = maxImages - capturedImages.length;
    const filesToProcess = files.slice(0, remainingSlots);

    try {
      // Show loading state during file validation and compression
      setIsUploading(true);

      // Process all files with individual error handling
      const validationResults = await Promise.allSettled(
        filesToProcess.map(async file => {
          try {
            // 1. Quick size check before reading file
            if (file.size > APP_CONFIG.IMAGE.MAX_FILE_SIZE) {
              return {
                success: false,
                filename: file.name,
                error: `File too large (max ${Math.round(APP_CONFIG.IMAGE.MAX_FILE_SIZE / 1024 / 1024)}MB)`,
              };
            }

            // 2. Quick MIME type check
            if (!APP_CONFIG.IMAGE.ALLOWED_TYPES.includes(file.type as any)) {
              return {
                success: false,
                filename: file.name,
                error: `File type ${file.type} not allowed`,
              };
            }

            // 3. Convert file to base64 with proper error handling
            const base64Data = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const result = reader.result;
                if (typeof result === 'string') {
                  resolve(result);
                } else {
                  reject(new Error('Invalid file read result'));
                }
              };
              reader.onerror = () => reject(new Error('Failed to read file'));
              reader.readAsDataURL(file);
            });

            // 4. Client-side validation (instant, no network)
            const validation = validateImageFile(base64Data);
            if (!validation.valid) {
              return {
                success: false,
                filename: file.name,
                error: validation.error?.message || 'Validation failed',
              };
            }

            // 4.5. Server-side validation REMOVED
            // This was causing 413 "Request Entity Too Large" errors because:
            // - Validation happened BEFORE compression (uncompressed images are huge)
            // - Vercel has a 4.5MB body size limit for API routes
            // - Even a single uncompressed photo can exceed this limit
            // Client-side validation (steps 1-4 above) is sufficient and comprehensive:
            // - File size checks, MIME type validation, extension validation, magic number validation
            // Server-side validation can be added AFTER compression if needed in the future

            // 5. Compress image using Web Worker (matches camera capture behavior)
            const compressionResult = await compressImageSmart(base64Data);

            // Verify compressed image format is valid
            const compressedImage = compressionResult.compressedImage;
            if (
              !compressedImage.startsWith('data:image/') ||
              !compressedImage.includes(',')
            ) {
              logger.error('Compressed image has invalid format', {
                filename: file.name,
                resultStart: compressedImage.substring(0, 100),
              });
              return {
                success: false,
                filename: file.name,
                error: 'Compression produced invalid image format',
              };
            }

            logger.debug('Image uploaded and compressed', {
              filename: file.name,
              originalSize: compressionResult.originalSize,
              compressedSize: compressionResult.compressedSize,
              compressionRatio: compressionResult.compressionRatio,
            });

            return {
              success: true,
              base64Data: compressedImage,
              filename: file.name,
            };
          } catch (error) {
            return {
              success: false,
              filename: file.name,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        })
      );

      // Hide loading state after all files processed
      setIsUploading(false);

      // Separate successful and failed uploads
      const successful: string[] = [];
      const failed: Array<{ filename: string; error: string }> = [];

      validationResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (result.value.success && result.value.base64Data) {
            successful.push(result.value.base64Data);
          } else if (!result.value.success && result.value.error) {
            failed.push({
              filename: result.value.filename,
              error: result.value.error,
            });
          }
        } else {
          // Promise.allSettled rejection (shouldn't happen with our try/catch)
          failed.push({
            filename: filesToProcess[index]?.name || `File ${index + 1}`,
            error: result.reason?.message || 'Unknown error',
          });
        }
      });

      // Show user-friendly error messages for failed files
      if (failed.length > 0) {
        const errorMessages = failed
          .map(f => `${f.filename}: ${f.error}`)
          .join('\n');
        logger.warn('Some files failed validation', { failed });

        toast.error(
          failed.length === filesToProcess.length
            ? `All files failed validation:\n${errorMessages}`
            : `${failed.length} of ${filesToProcess.length} files failed:\n${errorMessages}`
        );
      }

      // Add successful images if any
      if (successful.length > 0) {
        const updatedImages = [...capturedImages, ...successful];
        setCapturedImages(updatedImages);

        // Show success message if some files succeeded
        if (failed.length > 0) {
          toast.success(`Successfully added ${successful.length} image(s)`);
        }

        // Auto-submit after reaching max images (same as camera capture)
        if (updatedImages.length >= maxImages) {
          // Small delay to show the final image in collection, then navigate smoothly
          setTimeout(() => {
            stopCamera();
            // Use React 19 transition to coordinate navigation and modal closing
            startTransition(() => {
              onCapture(updatedImages);
              onOpenChange(false);
            });
          }, 500);
        }
      }

      // Auto-switch back to camera mode after upload
      setSelectedMode('camera');

      // Reset file input so same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      // Hide loading state on error
      setIsUploading(false);
      logger.error('File upload failed', error);
      const errorMessage =
        error instanceof Error ? error.message : 'File upload failed';
      toast.error(errorMessage);
      // Reset mode on error
      setSelectedMode('camera');
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
        // Directly trigger file selection when upload button is clicked
        fileInputRef.current?.click();
        // Don't change the selected mode - keep it on camera
        // so the upload overlay doesn't show
        setSelectedMode('camera');
        return; // Early return to prevent the mode change above
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

  const handleErrorBoundaryRetry = () => {
    // Reset error state and restart camera
    setError(null);
    setCapturedImages([]);
    setSelectedMode('camera');
    startCamera();
  };

  const handleErrorBoundaryCancel = () => {
    onOpenChange(false);
  };

  return (
    <ImageProcessingErrorBoundary
      onRetry={handleErrorBoundaryRetry}
      onCancel={handleErrorBoundaryCancel}
      onError={(error, errorInfo) => {
        logger.error('Camera component error boundary caught error:', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      <div className="fixed inset-0 z-50 bg-black">
        {/* Camera View or Image Gallery */}
        <div className="relative h-full bg-black">
          {/* Camera Cycle Button */}
          {!isLoading && !error && (
            <CameraCycleButton
              onCycle={cycleCamera}
              currentIndex={currentCameraIndex}
              totalCameras={availableCameras.length}
              disabled={isPending}
            />
          )}

          {/* Image thumbnails */}
          {capturedImages.length > 0 && (
            <div className="absolute top-6 left-0 right-0 z-20 px-4">
              <div className="flex gap-3 overflow-x-auto pb-6">
                {capturedImages.map((img, index) => (
                  <div key={index} className="relative flex-shrink-0 group">
                    <img
                      src={img}
                      alt={`Captured ${index + 1}`}
                      className="h-20 w-20 object-cover rounded-xl border-2 border-white/40 shadow-lg"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -bottom-3 -right-3 bg-destructive text-white w-6 h-6 flex-shrink-0 flex items-center justify-center transition-all duration-200 shadow-md isolate z-10 active:bg-destructive/90 active:scale-110"
                      style={{
                        borderRadius: '50%',
                        minWidth: '24px',
                        minHeight: '24px',
                        maxWidth: '24px',
                        maxHeight: '24px',
                      }}
                    >
                      <X className="w-3.5 h-3.5 stroke-2 flex-shrink-0" />
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
                  className="absolute inset-0 cursor-pointer bg-black/5 active:bg-black/20 transition-colors"
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

              {/* Hidden file input for upload functionality */}
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                disabled={capturedImages.length >= maxImages || isUploading}
              />

              {/* Upload Loading Overlay */}
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                  <div className="flex flex-col items-center gap-3 bg-card/90 p-6 rounded-xl shadow-lg border border-white/20">
                    <LoadingSpinner size="lg" className="text-white" />
                    <span className="text-white text-sm font-medium">
                      Validating images...
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {isLoading && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-secondary">Starting camera...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-4">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-secondary text-sm">{error}</p>
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
        <div className="absolute bottom-0 left-0 right-0 z-60 p-4">
          <ModeSelector
            selectedMode={selectedMode}
            onModeChange={handleModeChange}
            hasImages={capturedImages.length > 0}
            onSubmit={handleDone}
            isSubmitting={isPending}
          />
        </div>
      </div>
    </ImageProcessingErrorBoundary>
  );
}
