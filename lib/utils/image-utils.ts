// Image processing utilities for accurate size calculations and validation
// Created to fix image size calculation issues and add proper validation

/**
 * Calculate the accurate byte size of a base64 encoded image
 * Base64 encoding adds ~33% overhead, so we need to account for this
 */
export function getBase64ImageSize(base64Data: string): number {
  try {
    // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const base64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');

    // Calculate base64 length without padding
    let base64Length = base64.length;

    // Account for padding characters ('=')
    const paddingCount = (base64.match(/=/g) || []).length;
    base64Length -= paddingCount;

    // Convert base64 length to actual byte size
    // Base64 uses 4 characters to represent 3 bytes
    const actualBytes = (base64Length * 3) / 4;

    return Math.floor(actualBytes);
  } catch (error) {
    console.error('Error calculating base64 image size:', error);
    // Fallback to rough estimation if calculation fails
    return Math.floor(base64Data.length * 0.75);
  }
}

/**
 * Check if an image exceeds the maximum allowed size
 */
export function isImageSizeValid(
  base64Data: string,
  maxSizeBytes: number
): boolean {
  const actualSize = getBase64ImageSize(base64Data);
  return actualSize <= maxSizeBytes;
}

/**
 * Get human-readable file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Extract MIME type from base64 data URL
 */
export function getMimeTypeFromBase64(base64Data: string): string | null {
  const match = base64Data.match(/^data:image\/([a-z]+);base64,/);
  return match ? `image/${match[1]}` : null;
}

/**
 * Validate image file type based on base64 data
 */
export function isValidImageType(
  base64Data: string,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']
): boolean {
  const mimeType = getMimeTypeFromBase64(base64Data);
  return mimeType ? allowedTypes.includes(mimeType) : false;
}
