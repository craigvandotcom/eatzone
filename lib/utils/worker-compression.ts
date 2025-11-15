/**
 * Web Worker Image Compression Utility
 * Provides image compression using Web Workers with fallback to main thread
 */

import { logger } from '@/lib/utils/logger';
import { compressImage } from '@/lib/utils/image-compression';

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  targetSizeKB?: number | null;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface CompressionResult {
  compressedImage: string;
  originalSize: number;
  compressedSize: number;
  quality: number;
  compressionRatio: number;
  dimensions?: { width: number; height: number };
  originalDimensions?: { width: number; height: number };
}

class WorkerCompressionManager {
  private worker: Worker | null = null;
  private messageId = 0;
  private pendingOperations = new Map<
    number,
    {
      resolve: (result: CompressionResult) => void;
      reject: (error: Error) => void;
    }
  >();
  private workerSupported = false;

  constructor() {
    this.initializeWorker();
  }

  private initializeWorker() {
    // Check if Web Workers are supported
    if (typeof Worker === 'undefined') {
      logger.info('Web Workers not supported, using main thread compression');
      return;
    }

    try {
      this.worker = new Worker('/workers/image-compression.js');
      this.workerSupported = true;

      this.worker.onmessage = e => {
        const { type, messageId, result, error } = e.data;
        const operation = this.pendingOperations.get(messageId);

        if (!operation) {
          logger.warn('Received message for unknown operation', { messageId });
          return;
        }

        this.pendingOperations.delete(messageId);

        if (type === 'success') {
          operation.resolve(result);
        } else if (type === 'error') {
          operation.reject(
            new Error(error.message || 'Worker compression failed')
          );
        }
      };

      this.worker.onerror = error => {
        logger.error('Worker error occurred', error);
        this.handleWorkerFailure();
      };

      logger.info('Image compression worker initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize compression worker', error);
      this.handleWorkerFailure();
    }
  }

  private handleWorkerFailure() {
    this.workerSupported = false;
    this.worker = null;

    // Reject any pending operations
    for (const operation of this.pendingOperations.values()) {
      operation.reject(new Error('Worker failed, falling back to main thread'));
    }
    this.pendingOperations.clear();
  }

  /**
   * Compress image using Web Worker or fallback to main thread
   * @param imageData - Base64 image data
   * @param options - Compression options
   * @returns Promise resolving to compression result
   */
  async compressImage(
    imageData: string,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    // Use Web Worker if supported and available
    if (this.workerSupported && this.worker) {
      try {
        return await this.compressWithWorker(imageData, options);
      } catch (error) {
        logger.warn('Worker compression failed, falling back to main thread', {
          error: error instanceof Error ? error.message : String(error),
        });
        this.handleWorkerFailure();
      }
    }

    // Fallback to main thread compression
    logger.debug('Using main thread compression');
    return await this.compressInMainThread(imageData, options);
  }

  private async compressWithWorker(
    imageData: string,
    options: CompressionOptions
  ): Promise<CompressionResult> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not available'));
        return;
      }

      const currentMessageId = ++this.messageId;

      // Store operation for response handling
      this.pendingOperations.set(currentMessageId, { resolve, reject });

      // Send compression task to worker
      this.worker.postMessage({
        imageData,
        options,
        messageId: currentMessageId,
      });

      // Set timeout to prevent hanging operations
      setTimeout(() => {
        if (this.pendingOperations.has(currentMessageId)) {
          this.pendingOperations.delete(currentMessageId);
          reject(new Error('Worker compression timeout'));
        }
      }, 30000); // 30 second timeout
    });
  }

  private async compressInMainThread(
    imageData: string,
    options: CompressionOptions
  ): Promise<CompressionResult> {
    // Use existing compression function as fallback
    // Convert targetSizeKB to maxSizeBytes for main thread compression
    const maxSizeBytes = options.targetSizeKB
      ? options.targetSizeKB * 1024
      : undefined;

    const compressionOptions: any = {
      maxSizeBytes,
    };

    if (options.maxWidth !== undefined)
      compressionOptions.maxWidth = options.maxWidth;
    if (options.maxHeight !== undefined)
      compressionOptions.maxHeight = options.maxHeight;
    if (options.quality !== undefined)
      compressionOptions.quality = options.quality;
    if (options.format !== undefined)
      compressionOptions.format =
        options.format === 'image/jpeg'
          ? 'jpeg'
          : options.format.replace('image/', '');

    return await compressImage(imageData, compressionOptions);
  }

  /**
   * Compress multiple images in batches to prevent overwhelming the worker
   * @param images - Array of base64 image data
   * @param options - Compression options
   * @param batchSize - Number of images to process concurrently
   * @returns Promise resolving to array of compression results
   */
  async compressImageBatch(
    images: string[],
    options: CompressionOptions = {},
    batchSize: number = 2
  ): Promise<CompressionResult[]> {
    const results: CompressionResult[] = [];

    logger.debug('Starting batch compression', {
      totalImages: images.length,
      batchSize,
      workerSupported: this.workerSupported,
    });

    // Process images in batches
    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);

      try {
        const batchResults = await Promise.all(
          batch.map(imageData => this.compressImage(imageData, options))
        );

        results.push(...batchResults);

        logger.debug(
          `Completed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(images.length / batchSize)}`
        );

        // Small delay between batches to prevent overwhelming the system
        if (i + batchSize < images.length) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      } catch (error) {
        logger.error(
          `Batch compression failed for batch starting at index ${i}`,
          error
        );
        throw error;
      }
    }

    return results;
  }

  /**
   * Get compression statistics
   * @returns Object with worker status and statistics
   */
  getStats() {
    return {
      workerSupported: this.workerSupported,
      pendingOperations: this.pendingOperations.size,
      hasWorker: !!this.worker,
    };
  }

  /**
   * Terminate the worker and clean up resources
   */
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    // Reject any pending operations
    for (const operation of this.pendingOperations.values()) {
      operation.reject(new Error('Worker terminated'));
    }
    this.pendingOperations.clear();

    this.workerSupported = false;
    logger.info('Image compression worker terminated');
  }
}

// Create singleton instance
let compressionManager: WorkerCompressionManager | null = null;

/**
 * Get the compression manager singleton
 * @returns WorkerCompressionManager instance
 */
export function getCompressionManager(): WorkerCompressionManager {
  if (!compressionManager) {
    compressionManager = new WorkerCompressionManager();
  }
  return compressionManager;
}

/**
 * Compress a single image using Web Worker with fallback
 * @param imageData - Base64 image data
 * @param options - Compression options
 * @returns Promise resolving to compression result
 */
export async function compressImageWithWorker(
  imageData: string,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const manager = getCompressionManager();
  return await manager.compressImage(imageData, options);
}

/**
 * Compress multiple images in batches using Web Worker with fallback
 * @param images - Array of base64 image data
 * @param options - Compression options
 * @param batchSize - Number of images to process concurrently
 * @returns Promise resolving to array of compression results
 */
export async function compressImagesBatch(
  images: string[],
  options: CompressionOptions = {},
  batchSize: number = 2
): Promise<CompressionResult[]> {
  const manager = getCompressionManager();
  return await manager.compressImageBatch(images, options, batchSize);
}

/**
 * Clean up compression manager resources
 * Call this when the application is shutting down
 */
export function cleanupCompressionWorker() {
  if (compressionManager) {
    compressionManager.terminate();
    compressionManager = null;
  }
}
