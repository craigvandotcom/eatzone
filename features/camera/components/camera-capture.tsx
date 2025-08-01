'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getZoneBgClass, getZoneTextClass } from '@/lib/utils/zone-colors';
import { Camera, Edit3, Upload } from 'lucide-react';
import { logger } from '@/lib/utils/logger';

interface CameraCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (imageData: string) => void;
  onManualEntry: () => void;
  title: string;
}

export function CameraCapture({
  open,
  onOpenChange,
  onCapture,
  onManualEntry,
  title,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [open]);

  // Attach video stream to video element when stream is available
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        logger.error('Error playing video', err);
      });
    }
  }, [stream]);

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
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

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

    // Stop camera and close dialog
    stopCamera();
    onOpenChange(false);

    // Pass image data to parent
    onCapture(imageData);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result as string;
      onOpenChange(false);
      onCapture(imageData);
    };
    reader.readAsDataURL(file);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>

      {/* Camera View */}
      <div className="relative h-full bg-black">
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
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" size="sm" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                </div>
              </div>
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

            {/* Transparent Capture Overlay */}
            <div
              className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors active:bg-black/30"
              onClick={captureImage}
            >
              <div className="w-20 h-20 rounded-full border-4 border-white/80 bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Camera className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        )}

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-black/50 backdrop-blur-sm">
        <div className="flex gap-3">
          <Button
            onClick={handleClose}
            variant="outline"
            className={`w-16 h-12 ${getZoneBgClass('red', 'light')} border-zone-red/30 ${getZoneTextClass('red')} hover:${getZoneBgClass('red', 'medium')} hover:border-zone-red/50`}
            size="lg"
          >
            Cancel
          </Button>

          <div className="relative flex-1">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Button variant="outline" className="w-full h-12" size="lg">
              <Upload className="h-5 w-5 mr-2" />
              Upload
            </Button>
          </div>

          <Button
            onClick={handleManualEntry}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            <Edit3 className="h-5 w-5 mr-2" />
            Manual Entry
          </Button>
        </div>
      </div>
    </div>
  );
}
