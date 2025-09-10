/**
 * Batch Processing Utility for Multiple Images
 * Provides progressive loading and processing to prevent UI blocking
 */

import { logger } from '@/lib/utils/logger';

export interface BatchProcessingOptions {
  batchSize?: number;
  delayBetweenBatches?: number;
  onBatchComplete?: (
    batchIndex: number,
    totalBatches: number,
    results: any[]
  ) => void;
  onProgress?: (processed: number, total: number) => void;
  onError?: (error: Error, itemIndex: number) => void;
}

export interface BatchResult<T> {
  results: T[];
  errors: Array<{ index: number; error: Error }>;
  totalProcessed: number;
  totalTime: number;
}

/**
 * Process items in batches with configurable options
 * @param items - Array of items to process
 * @param processor - Function to process each item
 * @param options - Batch processing options
 * @returns Promise resolving to batch results
 */
export async function processInBatches<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  options: BatchProcessingOptions = {}
): Promise<BatchResult<R>> {
  const {
    batchSize = 2,
    delayBetweenBatches = 10,
    onBatchComplete,
    onProgress,
    onError,
  } = options;

  const startTime = Date.now();
  const results: R[] = [];
  const errors: Array<{ index: number; error: Error }> = [];

  logger.debug('Starting batch processing', {
    totalItems: items.length,
    batchSize,
    delayBetweenBatches,
  });

  const totalBatches = Math.ceil(items.length / batchSize);
  let processedCount = 0;

  for (let i = 0; i < items.length; i += batchSize) {
    const batchStartTime = Date.now();
    const batch = items.slice(i, i + batchSize);
    const batchIndex = Math.floor(i / batchSize);

    try {
      // Process batch items concurrently
      const batchPromises = batch.map(async (item, batchItemIndex) => {
        const globalIndex = i + batchItemIndex;

        try {
          const result = await processor(item, globalIndex);
          return { success: true, result, index: globalIndex };
        } catch (error) {
          const processingError =
            error instanceof Error ? error : new Error(String(error));

          logger.warn(`Item ${globalIndex} processing failed`, {
            error: processingError.message,
            index: globalIndex,
          });

          if (onError) {
            onError(processingError, globalIndex);
          }

          return { success: false, error: processingError, index: globalIndex };
        }
      });

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);

      // Collect results and errors
      batchResults.forEach(result => {
        if (result.success) {
          results[result.index] = result.result as R;
        } else {
          errors.push({ index: result.index, error: result.error as Error });
        }
      });

      processedCount += batch.length;

      // Call progress callback
      if (onProgress) {
        onProgress(processedCount, items.length);
      }

      // Call batch complete callback
      if (onBatchComplete) {
        const batchTime = Date.now() - batchStartTime;
        onBatchComplete(batchIndex, totalBatches, batchResults);

        logger.debug(`Batch ${batchIndex + 1}/${totalBatches} completed`, {
          batchSize: batch.length,
          batchTime,
          successCount: batchResults.filter(r => r.success).length,
          errorCount: batchResults.filter(r => !r.success).length,
        });
      }

      // Add delay between batches (except for the last batch)
      if (i + batchSize < items.length && delayBetweenBatches > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    } catch (batchError) {
      const error =
        batchError instanceof Error
          ? batchError
          : new Error(String(batchError));
      logger.error(`Batch ${batchIndex} failed completely`, error);

      // Mark all items in this batch as failed
      for (let j = 0; j < batch.length; j++) {
        const globalIndex = i + j;
        errors.push({ index: globalIndex, error });

        if (onError) {
          onError(error, globalIndex);
        }
      }

      processedCount += batch.length;
    }
  }

  const totalTime = Date.now() - startTime;

  logger.debug('Batch processing completed', {
    totalItems: items.length,
    successCount: results.length,
    errorCount: errors.length,
    totalTime,
    averageTimePerItem: totalTime / items.length,
  });

  return {
    results,
    errors,
    totalProcessed: processedCount,
    totalTime,
  };
}

/**
 * Process images in batches to prevent UI blocking
 * @param images - Array of image data (base64 strings)
 * @param processImage - Function to process each image
 * @param options - Processing options
 * @returns Promise resolving to processed images and errors
 */
export async function processImagesInBatches<T>(
  images: string[],
  processImage: (imageData: string, index: number) => Promise<T>,
  options: BatchProcessingOptions = {}
): Promise<BatchResult<T>> {
  const defaultOptions: BatchProcessingOptions = {
    batchSize: 2,
    delayBetweenBatches: 50, // Slightly longer delay for image processing
    ...options,
  };

  return processInBatches(images, processImage, defaultOptions);
}

/**
 * Upload validation processor for multiple files
 * @param files - Array of file data objects
 * @param validateFile - Function to validate each file
 * @param options - Processing options
 * @returns Promise resolving to validation results
 */
export async function validateFilesInBatches(
  files: Array<{
    filename: string;
    mimeType: string;
    size: number;
    base64Data: string;
  }>,
  validateFile: (file: any, index: number) => Promise<any>,
  options: BatchProcessingOptions = {}
): Promise<BatchResult<any>> {
  const defaultOptions: BatchProcessingOptions = {
    batchSize: 3, // Slightly larger batch for validation (less resource intensive)
    delayBetweenBatches: 25,
    ...options,
  };

  return processInBatches(files, validateFile, defaultOptions);
}

/**
 * Progressive loader with visual feedback
 * Provides a more user-friendly interface for batch processing with UI updates
 */
export class ProgressiveBatchProcessor<T, R> {
  private items: T[];
  private processor: (item: T, index: number) => Promise<R>;
  private options: BatchProcessingOptions;
  private isProcessing = false;
  private aborted = false;

  constructor(
    items: T[],
    processor: (item: T, index: number) => Promise<R>,
    options: BatchProcessingOptions = {}
  ) {
    this.items = items;
    this.processor = processor;
    this.options = {
      batchSize: 2,
      delayBetweenBatches: 10,
      ...options,
    };
  }

  /**
   * Start processing with progress tracking
   * @returns Promise resolving to batch results
   */
  async process(): Promise<BatchResult<R>> {
    if (this.isProcessing) {
      throw new Error('Processing already in progress');
    }

    this.isProcessing = true;
    this.aborted = false;

    try {
      const result = await processInBatches(
        this.items,
        async (item, index) => {
          if (this.aborted) {
            throw new Error('Processing aborted');
          }
          return await this.processor(item, index);
        },
        {
          ...this.options,
          onProgress: (processed, total) => {
            if (this.options.onProgress) {
              this.options.onProgress(processed, total);
            }
          },
        }
      );

      return result;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Abort the current processing
   */
  abort() {
    this.aborted = true;
    logger.debug('Batch processing aborted');
  }

  /**
   * Check if processing is currently active
   * @returns true if processing is active
   */
  isActive(): boolean {
    return this.isProcessing;
  }

  /**
   * Get processing statistics
   * @returns Object with current stats
   */
  getStats() {
    return {
      totalItems: this.items.length,
      isProcessing: this.isProcessing,
      aborted: this.aborted,
      batchSize: this.options.batchSize,
    };
  }
}

/**
 * Create a progressive batch processor
 * @param items - Items to process
 * @param processor - Processing function
 * @param options - Processing options
 * @returns ProgressiveBatchProcessor instance
 */
export function createProgressiveProcessor<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  options: BatchProcessingOptions = {}
): ProgressiveBatchProcessor<T, R> {
  return new ProgressiveBatchProcessor(items, processor, options);
}

/**
 * Utility to create a retry-enabled batch processor
 * @param items - Items to process
 * @param processor - Processing function
 * @param maxRetries - Maximum number of retries per item
 * @param options - Processing options
 * @returns Promise resolving to results with retry information
 */
export async function processWithRetries<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  maxRetries: number = 2,
  options: BatchProcessingOptions = {}
): Promise<BatchResult<R> & { retryStats: Record<number, number> }> {
  const retryStats: Record<number, number> = {};

  const retryProcessor = async (item: T, index: number): Promise<R> => {
    let lastError: Error | null = null;
    retryStats[index] = 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await processor(item, index);
        if (attempt > 0) {
          logger.debug(`Item ${index} succeeded after ${attempt} retries`);
        }
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        retryStats[index] = attempt + 1;

        if (attempt < maxRetries) {
          logger.debug(
            `Item ${index} failed on attempt ${attempt + 1}, retrying...`
          );
          // Exponential backoff for retries
          await new Promise(resolve =>
            setTimeout(resolve, Math.pow(2, attempt) * 100)
          );
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  };

  const result = await processInBatches(items, retryProcessor, options);

  return {
    ...result,
    retryStats,
  };
}
