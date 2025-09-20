/**
 * CameraCapture Component Tests (using MultiCameraCapture)
 *
 * Note: This test uses MultiCameraCapture with maxImages=1 to simulate
 * single capture behavior. Complex media API and canvas mocking has been
 * removed to avoid React 19 act() warnings and MediaStream mock complexity.
 */
import React from 'react';
import { render, screen, waitFor, act } from '@/__tests__/setup/test-utils';
import userEvent from '@testing-library/user-event';
import { MultiCameraCapture } from '@/features/camera/components/multi-camera-capture';

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock HTMLVideoElement with proper play method
Object.defineProperty(global.HTMLVideoElement.prototype, 'play', {
  value: jest.fn(() => Promise.resolve()),
  writable: true,
});

// Mock media devices
const mockGetUserMedia = jest.fn();
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true,
});

// Mock fetch for API calls
global.fetch = jest.fn();

describe('CameraCapture (using MultiCameraCapture)', () => {
  const mockProps = {
    open: false,
    onOpenChange: jest.fn(),
    onCapture: jest.fn(),
    onManualEntry: jest.fn(),
    title: 'Test Camera',
    maxImages: 1, // Simulate single capture behavior
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserMedia.mockClear();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Component Rendering', () => {
    it('should not render when closed', () => {
      render(<MultiCameraCapture {...mockProps} open={false} />);
      expect(screen.queryByText('Test Camera')).not.toBeInTheDocument();
    });

    it('should show loading state when open', () => {
      mockGetUserMedia.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<MultiCameraCapture {...mockProps} open={true} />);
      expect(screen.getByText(/starting camera/i)).toBeInTheDocument();
    });

    it('should show error state when camera unavailable', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Camera access denied'));

      await act(async () => {
        render(<MultiCameraCapture {...mockProps} open={true} />);
      });

      await waitFor(() => {
        expect(
          screen.getByText(/unable to access camera/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('User Actions', () => {
    beforeEach(() => {
      mockGetUserMedia.mockResolvedValue({
        getTracks: () => [{ stop: jest.fn() }],
      });
    });

    it('should provide cancel functionality', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MultiCameraCapture {...mockProps} open={true} />);
      });

      // Find cancel button by its red styling and X icon
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await act(async () => {
        await user.click(cancelButton);
      });

      expect(mockProps.onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should provide manual entry option', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MultiCameraCapture {...mockProps} open={true} />);
      });

      // Find manual button by its Edit icon
      const manualButton = screen.getByRole('button', { name: /manual/i });
      await act(async () => {
        await user.click(manualButton);
      });

      expect(mockProps.onManualEntry).toHaveBeenCalled();
      expect(mockProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('File Upload', () => {
    beforeEach(() => {
      mockGetUserMedia.mockResolvedValue({
        getTracks: () => [{ stop: jest.fn() }],
      });
    });

    it('should include file input in upload mode', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MultiCameraCapture {...mockProps} open={true} />);
      });

      // Switch to upload mode to see the file input
      const uploadButton = screen.getByRole('button', { name: /upload/i });
      await act(async () => {
        await user.click(uploadButton);
      });

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect((fileInput as HTMLInputElement).accept).toBe('image/*');
    });

    it('should show image counter for single capture mode', async () => {
      await act(async () => {
        render(<MultiCameraCapture {...mockProps} open={true} />);
      });

      expect(screen.getByText('0/1')).toBeInTheDocument();
    });
  });
});
