/**
 * Debounce utility function
 * Delays function execution until after delay milliseconds have elapsed 
 * since the last time it was invoked
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;

  const debouncedFn = (...args: Parameters<T>) => {
    // Clear the previous timeout if it exists
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set a new timeout
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };

  // Add cancel method
  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debouncedFn;
}

/**
 * Creates a debounced version of an async function
 * Useful for API calls that should be delayed until user stops typing
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: NodeJS.Timeout | null = null;
  let currentPromise: Promise<ReturnType<T>> | null = null;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    // Clear the previous timeout if it exists
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Create a new promise that will resolve after the delay
    currentPromise = new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });

    return currentPromise;
  };
}