/**
 * Component tests for MultiCameraCapture
 * Tests basic camera functionality and user interactions
 */

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

describe('MultiCameraCapture', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onCapture: jest.fn(),
    onManualEntry: jest.fn(),
    title: 'Capture Food',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserMedia.mockClear();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Component Rendering', () => {
    it('should not render when closed', async () => {
      await act(async () => {
        render(<MultiCameraCapture {...defaultProps} open={false} />);
      });

      expect(screen.queryByText('Capture Food')).not.toBeInTheDocument();
    });

    it('should show loading state initially', async () => {
      mockGetUserMedia.mockImplementation(() => new Promise(() => {})); // Never resolves

      await act(async () => {
        render(<MultiCameraCapture {...defaultProps} />);
      });

      expect(screen.getByText('Starting camera...')).toBeInTheDocument();
    });

    it('should show image counter with default maxImages', async () => {
      mockGetUserMedia.mockResolvedValue({
        getTracks: () => [{ stop: jest.fn() }],
      });

      await act(async () => {
        render(<MultiCameraCapture {...defaultProps} />);
      });

      // Should show counter with default maxImages value from APP_CONFIG
      expect(screen.getByText(/0\/\d+ images/)).toBeInTheDocument();
    });

    it('should show image counter with custom maxImages', async () => {
      mockGetUserMedia.mockResolvedValue({
        getTracks: () => [{ stop: jest.fn() }],
      });

      await act(async () => {
        render(<MultiCameraCapture {...defaultProps} maxImages={3} />);
      });

      expect(screen.getByText('0/3 images')).toBeInTheDocument();
    });
  });

  describe('Camera Access', () => {
    it('should request camera access when opened', async () => {
      mockGetUserMedia.mockResolvedValue({
        getTracks: () => [{ stop: jest.fn() }],
      });

      await act(async () => {
        render(<MultiCameraCapture {...defaultProps} />);
      });

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
      });
    });

    it('should show error when camera access fails', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Camera access denied'));

      await act(async () => {
        render(<MultiCameraCapture {...defaultProps} />);
      });

      await waitFor(() => {
        expect(
          screen.getByText('Unable to access camera. Please check permissions.')
        ).toBeInTheDocument();
      });
    });

    it('should cleanup camera stream when closed', async () => {
      const mockTrack = { stop: jest.fn() };
      const mockStream = { getTracks: () => [mockTrack] };

      mockGetUserMedia.mockResolvedValue(mockStream);

      let rerender: any;
      await act(async () => {
        const result = render(
          <MultiCameraCapture {...defaultProps} open={true} />
        );
        rerender = result.rerender;
      });

      // Close the component
      await act(async () => {
        rerender(<MultiCameraCapture {...defaultProps} open={false} />);
      });

      expect(mockTrack.stop).toHaveBeenCalled();
    });
  });

  describe('User Interactions', () => {
    beforeEach(() => {
      mockGetUserMedia.mockResolvedValue({
        getTracks: () => [{ stop: jest.fn() }],
      });
    });

    it('should call onManualEntry when manual button clicked', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MultiCameraCapture {...defaultProps} />);
      });

      const manualButton = screen.getByText('Manual');
      await act(async () => {
        await user.click(manualButton);
      });

      expect(defaultProps.onManualEntry).toHaveBeenCalled();
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should call onOpenChange when cancel button clicked', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(<MultiCameraCapture {...defaultProps} />);
      });

      const cancelButton = screen.getByText('Cancel');
      await act(async () => {
        await user.click(cancelButton);
      });

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should disable done button when no images captured', async () => {
      await act(async () => {
        render(<MultiCameraCapture {...defaultProps} />);
      });

      await waitFor(() => {
        // Find the green button with Check icon (the done button)
        const buttons = screen.getAllByRole('button');
        const doneButton = buttons.find(
          btn =>
            btn.className.includes('bg-green-500') && btn.querySelector('svg')
        );
        expect(doneButton).toBeDisabled();
      });
    });
  });
});
