/**
 * Image Compression Web Worker
 * Performs image compression in a separate thread to prevent UI blocking
 */

// Worker message handler
self.onmessage = function (e) {
  const { imageData, options, messageId } = e.data;

  try {
    const result = compressImage(imageData, options);

    // Send result back to main thread
    self.postMessage({
      type: 'success',
      messageId,
      result,
    });
  } catch (error) {
    // Send error back to main thread
    self.postMessage({
      type: 'error',
      messageId,
      error: {
        message: error.message,
        name: error.name,
      },
    });
  }
};

/**
 * Compress image data using Canvas API in worker
 * @param {string} imageData - Base64 image data
 * @param {Object} options - Compression options
 * @returns {Object} Compression result
 */
function compressImage(imageData, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    targetSizeKB = null,
    format = 'image/jpeg',
  } = options;

  // Create canvas for image processing
  const canvas = new OffscreenCanvas(1, 1);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context in worker');
  }

  return new Promise((resolve, reject) => {
    // Create image from base64 data
    const img = new Image();

    img.onload = function () {
      try {
        // Calculate new dimensions maintaining aspect ratio
        const { width, height } = calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        );

        // Resize canvas
        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);

        let currentQuality = quality;
        let attempts = 0;
        const maxAttempts = 10;

        // Async compression loop
        const tryCompress = async () => {
          do {
            attempts++;

            // Convert to compressed format (this is async!)
            const compressedData = await canvas.convertToBlob({
              type: format,
              quality: currentQuality,
            });

            // Check size if target is specified
            if (targetSizeKB) {
              const currentSizeKB = compressedData.size / 1024;

              if (currentSizeKB <= targetSizeKB || attempts >= maxAttempts) {
                // Success - convert blob to base64 and resolve
                const reader = new FileReader();
                reader.onload = function () {
                  const result = {
                    compressedImage: reader.result,
                    originalSize: estimateBase64Size(imageData),
                    compressedSize: compressedData.size,
                    quality: currentQuality,
                    compressionRatio:
                      estimateBase64Size(imageData) / compressedData.size,
                    dimensions: { width, height },
                    originalDimensions: {
                      width: img.width,
                      height: img.height,
                    },
                  };
                  resolve(result);
                };
                reader.onerror = () =>
                  reject(new Error('Failed to read compressed image data'));
                reader.readAsDataURL(compressedData);
                return;
              }

              // Reduce quality for next attempt
              currentQuality = Math.max(0.1, currentQuality * 0.9);
            } else {
              // No target size - just compress once and return
              const reader = new FileReader();
              reader.onload = function () {
                const result = {
                  compressedImage: reader.result,
                  originalSize: estimateBase64Size(imageData),
                  compressedSize: compressedData.size,
                  quality: currentQuality,
                  compressionRatio:
                    estimateBase64Size(imageData) / compressedData.size,
                  dimensions: { width, height },
                  originalDimensions: { width: img.width, height: img.height },
                };
                resolve(result);
              };
              reader.onerror = () =>
                reject(new Error('Failed to read compressed image data'));
              reader.readAsDataURL(compressedData);
              return;
            }
          } while (attempts < maxAttempts);

          // If we get here, we exceeded max attempts - return best effort
          const finalBlob = await canvas.convertToBlob({
            type: format,
            quality: currentQuality,
          });

          const reader = new FileReader();
          reader.onload = function () {
            const result = {
              compressedImage: reader.result,
              originalSize: estimateBase64Size(imageData),
              compressedSize: finalBlob.size,
              quality: currentQuality,
              compressionRatio: estimateBase64Size(imageData) / finalBlob.size,
              dimensions: { width, height },
              originalDimensions: { width: img.width, height: img.height },
            };
            resolve(result);
          };
          reader.onerror = () =>
            reject(new Error('Failed to read compressed image data'));
          reader.readAsDataURL(finalBlob);
        };

        // Start async compression
        tryCompress().catch(reject);
      } catch (error) {
        reject(new Error(`Image compression failed: ${error.message}`));
      }
    };

    img.onerror = function () {
      reject(new Error('Failed to load image in worker'));
    };

    // Load the image
    img.src = imageData;
  });
}

/**
 * Calculate optimal dimensions maintaining aspect ratio
 * @param {number} originalWidth - Original image width
 * @param {number} originalHeight - Original image height
 * @param {number} maxWidth - Maximum allowed width
 * @param {number} maxHeight - Maximum allowed height
 * @returns {Object} New dimensions
 */
function calculateDimensions(
  originalWidth,
  originalHeight,
  maxWidth,
  maxHeight
) {
  let { width, height } = { width: originalWidth, height: originalHeight };

  // Scale down if needed
  if (width > maxWidth || height > maxHeight) {
    const aspectRatio = width / height;

    if (width > height) {
      width = maxWidth;
      height = width / aspectRatio;
    } else {
      height = maxHeight;
      width = height * aspectRatio;
    }

    // Ensure we don't exceed limits
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

/**
 * Estimate base64 string size in bytes
 * @param {string} base64String - Base64 encoded string
 * @returns {number} Estimated size in bytes
 */
function estimateBase64Size(base64String) {
  // Remove data URL prefix if present
  const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');

  // Base64 encoding: 4 characters = 3 bytes, with padding
  let size = (base64Data.length * 3) / 4;

  // Account for padding
  const padding = base64Data.match(/=/g);
  if (padding) {
    size -= padding.length;
  }

  return Math.round(size);
}

/**
 * Estimate blob size in bytes
 * @param {Blob} blob - Blob object
 * @returns {number} Size in bytes
 */
function estimateBlobSize(blob) {
  return blob.size;
}

/**
 * Progressive compression with quality adjustment
 * @param {string} imageData - Base64 image data
 * @param {number} targetSizeKB - Target size in kilobytes
 * @param {number} initialQuality - Starting quality (0-1)
 * @returns {Promise<Object>} Compression result
 */
function progressiveCompress(imageData, targetSizeKB, initialQuality = 0.9) {
  return new Promise((resolve, reject) => {
    const canvas = new OffscreenCanvas(1, 1);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    const img = new Image();

    img.onload = function () {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      let quality = initialQuality;
      let attempts = 0;
      const maxAttempts = 15;

      const tryCompress = () => {
        try {
          const blob = canvas.convertToBlob({
            type: 'image/jpeg',
            quality: quality,
          });

          const sizeKB = blob.size / 1024;

          if (
            sizeKB <= targetSizeKB ||
            attempts >= maxAttempts ||
            quality <= 0.1
          ) {
            // Success or reached limits
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                compressedImage: reader.result,
                finalQuality: quality,
                finalSizeKB: sizeKB,
                attempts: attempts + 1,
              });
            reader.readAsDataURL(blob);
          } else {
            // Try with lower quality
            quality = Math.max(0.1, quality * 0.85);
            attempts++;

            // Use setTimeout to prevent blocking (even in worker)
            setTimeout(tryCompress, 1);
          }
        } catch (error) {
          reject(error);
        }
      };

      tryCompress();
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageData;
  });
}

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    compressImage,
    calculateDimensions,
    estimateBase64Size,
    progressiveCompress,
  };
}
