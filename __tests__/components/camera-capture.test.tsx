import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CameraCapture } from '@/features/camera/components/camera-capture';

// Mock MediaDevices API
const mockGetUserMedia = jest.fn();
const mockStream = {
  getTracks: jest.fn(() => [{ stop: jest.fn() }]),
};

Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: mockGetUserMedia,
  },
});

// Mock canvas and video elements
HTMLVideoElement.prototype.play = jest.fn().mockResolvedValue(undefined);
HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
  drawImage: jest.fn(),
});
HTMLCanvasElement.prototype.toDataURL = jest
  .fn()
  .mockReturnValue('data:image/jpeg;base64,mockedimage');

// Mock FileReader
global.FileReader = class {
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null =
    null;
  result: string | ArrayBuffer | null =
    'data:image/jpeg;base64,mockedfileimage';

  readAsDataURL() {
    setTimeout(() => {
      if (this.onload) {
        this.onload({} as ProgressEvent<FileReader>);
      }
    }, 0);
  }
} as any;

describe('CameraCapture', () => {
  const mockProps = {
    open: false,
    onOpenChange: jest.fn(),
    onCapture: jest.fn(),
    onManualEntry: jest.fn(),
    title: 'Test Camera',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserMedia.mockResolvedValue(mockStream);
  });

  describe('Component Visibility', () => {
    it('should not render when open is false', () => {
      render(<CameraCapture {...mockProps} open={false} />);

      expect(screen.queryByText('Test Camera')).not.toBeInTheDocument();
    });

    it('should render when open is true', () => {
      render(<CameraCapture {...mockProps} open={true} />);

      expect(screen.getByText('Test Camera')).toBeInTheDocument();
    });

    it('should display loading state initially', () => {
      render(<CameraCapture {...mockProps} open={true} />);

      expect(screen.getByText('Starting camera...')).toBeInTheDocument();
    });
  });

  describe('Camera Access', () => {
    it('should request camera access when opened', async () => {
      render(<CameraCapture {...mockProps} open={true} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 1280 },
          },
        });
      });
    });

    it('should display error message when camera access fails', async () => {
      mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'));

      render(<CameraCapture {...mockProps} open={true} />);

      await waitFor(() => {
        expect(
          screen.getByText('Unable to access camera. Please check permissions.')
        ).toBeInTheDocument();
      });
    });

    it('should show Try Again button when camera fails', async () => {
      mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'));

      render(<CameraCapture {...mockProps} open={true} />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /try again/i })
        ).toBeInTheDocument();
      });
    });

    it('should retry camera access when Try Again is clicked', async () => {
      const user = userEvent.setup();
      mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'));

      render(<CameraCapture {...mockProps} open={true} />);

      await waitFor(() => {
        expect(
          screen.getByText('Unable to access camera. Please check permissions.')
        ).toBeInTheDocument();
      });

      // Reset mock to succeed on retry
      mockGetUserMedia.mockResolvedValueOnce(mockStream);

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      await user.click(tryAgainButton);

      expect(mockGetUserMedia).toHaveBeenCalledTimes(2);
    });
  });

  describe('Action Buttons', () => {
    it('should render Cancel button', async () => {
      render(<CameraCapture {...mockProps} open={true} />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /cancel/i })
        ).toBeInTheDocument();
      });
    });

    it('should render Manual Entry button', async () => {
      render(<CameraCapture {...mockProps} open={true} />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /manual entry/i })
        ).toBeInTheDocument();
      });
    });

    it('should render Upload button', async () => {
      render(<CameraCapture {...mockProps} open={true} />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /upload/i })
        ).toBeInTheDocument();
      });
    });

    it('should call onOpenChange with false when Cancel is clicked', async () => {
      const user = userEvent.setup();

      render(<CameraCapture {...mockProps} open={true} />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /cancel/i })
        ).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockProps.onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onManualEntry when Manual Entry is clicked', async () => {
      const user = userEvent.setup();

      render(<CameraCapture {...mockProps} open={true} />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /manual entry/i })
        ).toBeInTheDocument();
      });

      const manualButton = screen.getByRole('button', {
        name: /manual entry/i,
      });
      await user.click(manualButton);

      expect(mockProps.onManualEntry).toHaveBeenCalled();
      expect(mockProps.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('File Upload', () => {
    it('should handle file upload', async () => {
      const user = userEvent.setup();

      render(<CameraCapture {...mockProps} open={true} />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /upload/i })
        ).toBeInTheDocument();
      });

      // Find the hidden file input
      const fileInput = screen
        .getAllByText('Upload')
        .find(el => el.parentElement?.querySelector('input[type="file"]'))
        ?.parentElement?.querySelector(
          'input[type="file"]'
        ) as HTMLInputElement;

      expect(fileInput).toBeInTheDocument();

      // Create a mock file
      const file = new File(['mock image content'], 'test-image.jpg', {
        type: 'image/jpeg',
      });

      // Simulate file selection
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(mockProps.onCapture).toHaveBeenCalledWith(
          'data:image/jpeg;base64,mockedfileimage'
        );
        expect(mockProps.onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Camera Stream Cleanup', () => {
    it('should call getUserMedia when opened', async () => {
      const mockTrack = { stop: jest.fn() };
      const mockActiveStream = {
        getTracks: jest.fn(() => [mockTrack]),
      };
      mockGetUserMedia.mockResolvedValueOnce(mockActiveStream);

      render(<CameraCapture {...mockProps} open={true} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });
    });

    it('should stop camera stream when closed', async () => {
      const mockTrack = { stop: jest.fn() };
      const mockActiveStream = {
        getTracks: jest.fn(() => [mockTrack]),
      };
      mockGetUserMedia.mockResolvedValueOnce(mockActiveStream);

      const { rerender } = render(<CameraCapture {...mockProps} open={true} />);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalled();
      });

      rerender(<CameraCapture {...mockProps} open={false} />);

      expect(mockTrack.stop).toHaveBeenCalled();
    });
  });

  describe('Camera Capture', () => {
    it('should show capture overlay when camera is active', async () => {
      render(<CameraCapture {...mockProps} open={true} />);

      await waitFor(() => {
        // Video should be present (even if not visible in test)
        expect(document.querySelector('video')).toBeInTheDocument();
      });

      // Should not show loading anymore
      expect(screen.queryByText('Starting camera...')).not.toBeInTheDocument();
    });

    it('should capture image when overlay is clicked', async () => {
      const user = userEvent.setup();
      const mockTrack = { stop: jest.fn() };
      const mockActiveStream = {
        getTracks: jest.fn(() => [mockTrack]),
      };
      mockGetUserMedia.mockResolvedValueOnce(mockActiveStream);

      render(<CameraCapture {...mockProps} open={true} />);

      await waitFor(() => {
        expect(document.querySelector('video')).toBeInTheDocument();
      });

      // Find the capture overlay (div with cursor-pointer and camera icon)
      const captureOverlay = document.querySelector('.cursor-pointer');
      expect(captureOverlay).toBeInTheDocument();

      await user.click(captureOverlay!);

      expect(mockProps.onCapture).toHaveBeenCalledWith(
        'data:image/jpeg;base64,mockedimage'
      );
      expect(mockProps.onOpenChange).toHaveBeenCalledWith(false);
      expect(mockTrack.stop).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle getUserMedia errors gracefully', async () => {
      // Mock logger to prevent console noise during tests
      const mockLogger = { error: jest.fn() };
      jest.doMock('@/lib/utils/logger', () => ({ logger: mockLogger }));

      mockGetUserMedia.mockRejectedValueOnce(
        new Error('NotAllowedError: Permission denied')
      );

      render(<CameraCapture {...mockProps} open={true} />);

      await waitFor(() => {
        expect(
          screen.getByText('Unable to access camera. Please check permissions.')
        ).toBeInTheDocument();
      });

      // Should provide alternative options
      expect(
        screen.getByRole('button', { name: /try again/i })
      ).toBeInTheDocument();
      // Use more specific selector for upload button in error state
      expect(screen.getAllByRole('button', { name: /upload/i })).toHaveLength(
        2
      ); // One in error section, one in bottom actions
    });

    it('should handle file upload errors gracefully', async () => {
      const user = userEvent.setup();

      render(<CameraCapture {...mockProps} open={true} />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /upload/i })
        ).toBeInTheDocument();
      });

      const fileInput = screen
        .getAllByText('Upload')
        .find(el => el.parentElement?.querySelector('input[type="file"]'))
        ?.parentElement?.querySelector(
          'input[type="file"]'
        ) as HTMLInputElement;

      // Simulate uploading a file without proper setup (should not crash)
      fireEvent.change(fileInput, { target: { files: [] } });

      // Should not call onCapture if no file selected
      expect(mockProps.onCapture).not.toHaveBeenCalled();
    });
  });
});
