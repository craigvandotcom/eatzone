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
const mockEnumerateDevices = jest.fn();
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
    enumerateDevices: mockEnumerateDevices,
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
    mockEnumerateDevices.mockClear();
    (global.fetch as jest.Mock).mockClear();

    // Default: mock single camera device
    mockEnumerateDevices.mockResolvedValue([
      {
        deviceId: 'camera1',
        kind: 'videoinput',
        label: 'Back Camera',
      },
    ]);
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
      expect(screen.getByText(/0\/\d+ photos/)).toBeInTheDocument();
    });

    it('should show image counter with custom maxImages', async () => {
      mockGetUserMedia.mockResolvedValue({
        getTracks: () => [{ stop: jest.fn() }],
      });

      await act(async () => {
        render(<MultiCameraCapture {...defaultProps} maxImages={3} />);
      });

      expect(screen.getByText('0/3 photos')).toBeInTheDocument();
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

      // Find manual button by its Edit icon
      const manualButton = screen.getByRole('button', { name: /manual/i });
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

      // Find cancel button by its red styling and X icon
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await act(async () => {
        await user.click(cancelButton);
      });

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
    });

    it('should not show done button when no images captured', async () => {
      await act(async () => {
        render(<MultiCameraCapture {...defaultProps} />);
      });

      await waitFor(() => {
        // The done button should not be present when no images are captured
        const buttons = screen.getAllByRole('button');
        const doneButton = buttons.find(
          btn =>
            btn.className.includes('bg-green-500') && btn.querySelector('svg')
        );
        expect(doneButton).toBeUndefined();
      });
    });
  });

  describe('Camera Cycling', () => {
    beforeEach(() => {
      // Mock localStorage
      Storage.prototype.getItem = jest.fn();
      Storage.prototype.setItem = jest.fn();
    });

    it('should not show camera cycle button with single camera', async () => {
      mockGetUserMedia.mockResolvedValue({
        getTracks: () => [{ stop: jest.fn() }],
      });

      await act(async () => {
        render(<MultiCameraCapture {...defaultProps} />);
      });

      await waitFor(() => {
        expect(
          screen.queryByRole('button', { name: /switch camera/i })
        ).not.toBeInTheDocument();
      });
    });

    it('should show camera cycle button with multiple cameras', async () => {
      // Mock multiple cameras
      mockEnumerateDevices.mockResolvedValue([
        {
          deviceId: 'camera1',
          kind: 'videoinput',
          label: 'Back Camera 1',
        },
        {
          deviceId: 'camera2',
          kind: 'videoinput',
          label: 'Back Camera 2',
        },
        {
          deviceId: 'camera3',
          kind: 'videoinput',
          label: 'Back Camera 3',
        },
      ]);

      mockGetUserMedia.mockResolvedValue({
        getTracks: () => [{ stop: jest.fn() }],
      });

      await act(async () => {
        render(<MultiCameraCapture {...defaultProps} />);
      });

      await waitFor(() => {
        const cycleButton = screen.getByRole('button', {
          name: /switch camera/i,
        });
        expect(cycleButton).toBeInTheDocument();
        expect(screen.getByText('1/3')).toBeInTheDocument();
      });
    });

    it('should cycle through cameras when button clicked', async () => {
      const user = userEvent.setup();

      // Mock multiple cameras
      mockEnumerateDevices.mockResolvedValue([
        {
          deviceId: 'camera1',
          kind: 'videoinput',
          label: 'Back Camera 1',
        },
        {
          deviceId: 'camera2',
          kind: 'videoinput',
          label: 'Back Camera 2',
        },
      ]);

      const mockTrack = { stop: jest.fn() };
      mockGetUserMedia.mockResolvedValue({
        getTracks: () => [mockTrack],
      });

      await act(async () => {
        render(<MultiCameraCapture {...defaultProps} />);
      });

      await waitFor(() => {
        expect(screen.getByText('1/2')).toBeInTheDocument();
      });

      // Click cycle button
      const cycleButton = screen.getByRole('button', {
        name: /switch camera/i,
      });

      await act(async () => {
        await user.click(cycleButton);
      });

      // Wait for camera switch
      await waitFor(() => {
        expect(screen.getByText('2/2')).toBeInTheDocument();
        // Verify camera was stopped and restarted
        expect(mockTrack.stop).toHaveBeenCalled();
      });
    });

    it('should save camera preference to localStorage', async () => {
      const user = userEvent.setup();

      // Mock multiple cameras
      mockEnumerateDevices.mockResolvedValue([
        {
          deviceId: 'camera1',
          kind: 'videoinput',
          label: 'Back Camera 1',
        },
        {
          deviceId: 'camera2',
          kind: 'videoinput',
          label: 'Back Camera 2',
        },
      ]);

      mockGetUserMedia.mockResolvedValue({
        getTracks: () => [{ stop: jest.fn() }],
      });

      await act(async () => {
        render(<MultiCameraCapture {...defaultProps} />);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /switch camera/i }));
      });

      const cycleButton = screen.getByRole('button', {
        name: /switch camera/i,
      });

      await act(async () => {
        await user.click(cycleButton);
      });

      // Verify localStorage was called with the correct deviceId
      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'preferredCameraDeviceId',
          'camera2'
        );
      });
    });

    it('should load preferred camera from localStorage on mount', async () => {
      // Mock preferred camera in localStorage
      (localStorage.getItem as jest.Mock).mockReturnValue('camera2');

      // Mock multiple cameras
      mockEnumerateDevices.mockResolvedValue([
        {
          deviceId: 'camera1',
          kind: 'videoinput',
          label: 'Back Camera 1',
        },
        {
          deviceId: 'camera2',
          kind: 'videoinput',
          label: 'Back Camera 2',
        },
      ]);

      mockGetUserMedia.mockResolvedValue({
        getTracks: () => [{ stop: jest.fn() }],
      });

      await act(async () => {
        render(<MultiCameraCapture {...defaultProps} />);
      });

      // Should start with camera 2 (index 1)
      await waitFor(() => {
        expect(screen.getByText('2/2')).toBeInTheDocument();
      });

      // Verify getUserMedia was called with the preferred camera
      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith(
          expect.objectContaining({
            video: expect.objectContaining({
              deviceId: { exact: 'camera2' },
            }),
          })
        );
      });
    });
  });
});
