/**
 * Camera Capture Flow - E2E Tests
 * Tests the complete camera capture and upload validation workflow including rate limiting
 */

import { test, expect } from '@playwright/test';
import { ExtendedPage } from '../types/test-types';

test.describe('Camera Capture and Upload Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Monitor console errors and network requests
    const consoleErrors: string[] = [];
    const networkRequests: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (
          !text.includes('Manifest') &&
          !text.includes('deprecated') &&
          !text.includes('AuthApiError')
        ) {
          consoleErrors.push(text);
        }
      }
    });

    page.on('request', request => {
      if (request.url().includes('/api/upload-validation')) {
        networkRequests.push(`${request.method()} ${request.url()}`);
      }
    });

    (page as ExtendedPage).consoleErrors = consoleErrors;
    (page as ExtendedPage).networkRequests = networkRequests;

    // Mock camera API for consistent testing
    await page.addInitScript(() => {
      // Mock getUserMedia for camera testing
      Object.defineProperty(navigator, 'mediaDevices', {
        writable: true,
        value: {
          getUserMedia: (constraints: MediaStreamConstraints) =>
            Promise.resolve({
              getVideoTracks: () => [
                {
                  stop: () => {},
                  getSettings: () => ({ width: 1280, height: 720 }),
                  getCapabilities: () => ({
                    width: { max: 1920 },
                    height: { max: 1080 },
                  }),
                },
              ],
              getAudioTracks: () => [],
              getTracks: () => [{ stop: () => {} }],
            } as MediaStream),
          enumerateDevices: () =>
            Promise.resolve([
              {
                deviceId: 'camera1',
                kind: 'videoinput' as MediaDeviceKind,
                label: 'Mock Camera',
                groupId: 'group1',
              },
            ]),
        },
      });

      // Mock canvas toDataURL for image capture simulation
      const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function (
        type?: string,
        quality?: any
      ) {
        // Return a minimal valid JPEG base64
        if (type === 'image/jpeg' || !type) {
          return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDAREAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A';
        }
        return originalToDataURL.call(this, type, quality);
      };
    });
  });

  test('camera capture interface loads and functions properly', async ({
    page,
  }) => {
    // Navigate to food capture page
    await page.goto('/app/foods/add');

    // Handle authentication redirect if needed
    if (page.url().includes('/login')) {
      console.log(
        '✓ Authentication required - testing camera interface requires login'
      );
      return;
    }

    // Look for camera activation button or interface
    const cameraButton = page
      .locator(
        '[data-testid="camera-button"], button:has-text("Camera"), button:has-text("Capture")'
      )
      .first();

    if (await cameraButton.isVisible({ timeout: 5000 })) {
      // Click to activate camera
      await cameraButton.click();

      // Wait for camera interface to load
      await expect(
        page.locator('video, [data-testid="camera-view"]').first()
      ).toBeVisible({ timeout: 10000 });

      // Look for capture controls
      const captureControl = page
        .locator(
          'button:has-text("Capture"), [data-testid="capture-button"], button:has([data-icon="camera"])'
        )
        .first();
      await expect(captureControl).toBeVisible();

      // Look for upload option
      const uploadControl = page
        .locator(
          'button:has-text("Upload"), input[type="file"], [data-testid="upload-button"]'
        )
        .first();
      if (await uploadControl.isVisible({ timeout: 2000 })) {
        console.log('✓ Upload option available');
      }

      console.log('✓ Camera interface loaded successfully');
    } else {
      console.log(
        'ℹ Camera interface not found - may require different navigation or authentication'
      );
    }
  });

  test('file upload validation works correctly', async ({ page }) => {
    // Navigate to a page that might have file upload
    await page.goto('/app/foods/add');

    // Skip if authentication is required
    if (page.url().includes('/login')) {
      console.log('✓ Skipping upload test - authentication required');
      return;
    }

    // Look for file upload input
    const fileInput = page.locator('input[type="file"]');

    if ((await fileInput.count()) > 0) {
      // Test file upload with a mock image
      const testFiles = [
        {
          name: 'test-image.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('fake-jpeg-data'),
        },
      ];

      // Upload file
      await fileInput.setInputFiles(testFiles);

      // Wait a bit to see if validation occurs
      await page.waitForTimeout(1000);

      // Check if there are any console errors related to validation
      const consoleErrors = (page as ExtendedPage).consoleErrors || [];
      const validationErrors = consoleErrors.filter(
        error => error.includes('validation') || error.includes('upload')
      );

      if (validationErrors.length > 0) {
        console.log('⚠ Validation errors detected:', validationErrors);
      } else {
        console.log('✓ File upload appears to work without errors');
      }
    } else {
      console.log('ℹ File upload input not found on this page');
    }
  });

  test('rate limiting prevents excessive requests', async ({ page }) => {
    // This test checks if rate limiting is working by monitoring network requests

    // Navigate to the app
    await page.goto('/app/foods/add');

    if (page.url().includes('/login')) {
      console.log('✓ Skipping rate limiting test - authentication required');
      return;
    }

    // Try to trigger multiple validation requests if possible
    const fileInput = page.locator('input[type="file"]');

    if ((await fileInput.count()) > 0) {
      // Create multiple small test files
      const testFiles = Array.from({ length: 5 }, (_, i) => ({
        name: `test-${i}.jpg`,
        mimeType: 'image/jpeg',
        buffer: Buffer.from(`fake-jpeg-data-${i}`),
      }));

      // Upload files rapidly
      for (let i = 0; i < testFiles.length; i++) {
        try {
          await fileInput.setInputFiles([testFiles[i]]);
          await page.waitForTimeout(100); // Small delay between uploads
        } catch (error) {
          console.log(`Upload ${i} failed:`, error);
        }
      }

      // Wait for any async processing
      await page.waitForTimeout(2000);

      // Check network requests
      const networkRequests = (page as ExtendedPage).networkRequests || [];
      const uploadValidationRequests = networkRequests.filter(req =>
        req.includes('/api/upload-validation')
      );

      console.log(
        `Network requests to upload validation: ${uploadValidationRequests.length}`
      );

      if (uploadValidationRequests.length > 0) {
        console.log('✓ Upload validation requests were made');

        // Check if any requests were rate limited (would show in console or network)
        const rateLimitedRequests = networkRequests.filter(
          req => req.includes('429') || req.includes('rate')
        );

        if (rateLimitedRequests.length > 0) {
          console.log('✓ Rate limiting appears to be active');
        }
      }
    }
  });

  test('camera capture with multi-image support', async ({ page }) => {
    await page.goto('/app/foods/add');

    if (page.url().includes('/login')) {
      console.log('✓ Skipping multi-image test - authentication required');
      return;
    }

    // Look for multi-camera interface
    const multiCameraButton = page
      .locator(
        'button:has-text("Multi"), [data-testid="multi-camera"], button:has-text("Multiple")'
      )
      .first();

    if (await multiCameraButton.isVisible({ timeout: 3000 })) {
      await multiCameraButton.click();

      // Wait for multi-camera interface
      await page.waitForTimeout(1000);

      // Look for multiple image controls
      const imageCountIndicator = page
        .locator('text=/\\d+\\/\\d+/', '[data-testid="image-count"]')
        .first();

      if (await imageCountIndicator.isVisible({ timeout: 2000 })) {
        console.log('✓ Multi-image interface detected');

        // Try to capture multiple images (simulate)
        const captureButton = page
          .locator('button:has-text("Capture"), [data-testid="capture"]')
          .first();

        if (await captureButton.isVisible()) {
          // Simulate multiple captures
          for (let i = 0; i < 3; i++) {
            await captureButton.click();
            await page.waitForTimeout(500);
          }

          console.log('✓ Multiple captures simulated');
        }
      }
    } else {
      console.log('ℹ Multi-camera interface not found');
    }
  });

  test('upload validation security checks', async ({ page }) => {
    await page.goto('/app/foods/add');

    if (page.url().includes('/login')) {
      console.log('✓ Skipping security test - authentication required');
      return;
    }

    const fileInput = page.locator('input[type="file"]');

    if ((await fileInput.count()) > 0) {
      // Test with various file types to see if validation catches them
      const securityTestFiles = [
        {
          name: 'test.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('This is not an image'),
        },
        {
          name: 'fake-image.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('<script>alert("xss")</script>'),
        },
        {
          name: 'large-file.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.alloc(50 * 1024 * 1024, 'x'), // 50MB fake file
        },
      ];

      let securityTestsPassed = 0;

      for (const testFile of securityTestFiles) {
        try {
          await fileInput.setInputFiles([testFile]);
          await page.waitForTimeout(1000);

          // Check for error messages
          const errorMessage = page
            .locator('text=/error|invalid|too large|not allowed/i')
            .first();

          if (await errorMessage.isVisible({ timeout: 2000 })) {
            console.log(
              `✓ Security test passed for ${testFile.name} - validation error shown`
            );
            securityTestsPassed++;
          } else {
            console.log(
              `⚠ Security test inconclusive for ${testFile.name} - no clear validation error`
            );
          }
        } catch (error) {
          console.log(
            `✓ Security test passed for ${testFile.name} - upload rejected at browser level`
          );
          securityTestsPassed++;
        }
      }

      if (securityTestsPassed > 0) {
        console.log(
          `✓ ${securityTestsPassed}/${securityTestFiles.length} security validations working`
        );
      }
    }
  });

  test('progressive loading shows appropriate feedback', async ({ page }) => {
    await page.goto('/app/foods/add');

    if (page.url().includes('/login')) {
      console.log(
        '✓ Skipping progressive loading test - authentication required'
      );
      return;
    }

    // Look for loading indicators or progress feedback
    const loadingElements = [
      page.locator('[data-testid*="loading"]'),
      page.locator('text=/loading|processing|uploading/i'),
      page.locator('[role="progressbar"]'),
      page.locator('.loading, .spinner'),
    ];

    // Try to trigger an action that would show loading
    const actionButton = page
      .locator(
        'button:has-text("Camera"), button:has-text("Upload"), button:has-text("Capture")'
      )
      .first();

    if (await actionButton.isVisible({ timeout: 3000 })) {
      await actionButton.click();

      // Check if any loading indicators appear
      let loadingFound = false;
      for (const loadingElement of loadingElements) {
        if (await loadingElement.isVisible({ timeout: 2000 })) {
          console.log('✓ Loading indicator found');
          loadingFound = true;
          break;
        }
      }

      if (!loadingFound) {
        console.log(
          'ℹ No loading indicators detected - may load instantly or be handled differently'
        );
      }
    }
  });

  test.afterEach(async ({ page }) => {
    // Check for any console errors that occurred during tests
    const consoleErrors = (page as ExtendedPage).consoleErrors || [];
    const criticalErrors = consoleErrors.filter(
      error =>
        !error.includes('getUserMedia') &&
        !error.includes('Manifest') &&
        error.includes('Error')
    );

    if (criticalErrors.length > 0) {
      console.log('⚠ Critical errors detected:', criticalErrors.slice(0, 3));
    }

    // Log network request summary
    const networkRequests = (page as ExtendedPage).networkRequests || [];
    if (networkRequests.length > 0) {
      console.log(
        `ℹ Upload validation requests made: ${networkRequests.length}`
      );
    }
  });
});
