/**
 * CameraCycleButton Component Tests
 *
 * Tests for the camera cycle button component, focusing on:
 * - Hook order compliance (React Rules of Hooks)
 * - Badge display timing and animations
 * - Conditional rendering scenarios
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CameraCycleButton } from '@/features/camera/components/camera-cycle-button';

// Mock setTimeout/clearTimeout for timing tests
jest.useFakeTimers();

describe('CameraCycleButton', () => {
  const defaultProps = {
    onCycle: jest.fn(),
    currentIndex: 0,
    totalCameras: 2,
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  describe('Hook Order Compliance', () => {
    it('should maintain consistent hook order when totalCameras changes from 0 to 2', () => {
      const { rerender } = render(
        <CameraCycleButton {...defaultProps} totalCameras={0} />
      );

      // Component should handle the case where totalCameras is initially 0
      // and then becomes 2 (after camera enumeration)
      expect(() => {
        rerender(<CameraCycleButton {...defaultProps} totalCameras={2} />);
      }).not.toThrow();
    });

    it('should maintain consistent hook order when totalCameras changes from 1 to 2', () => {
      const { rerender } = render(
        <CameraCycleButton {...defaultProps} totalCameras={1} />
      );

      // Should not render when only 1 camera, but hooks should still run
      expect(() => {
        rerender(<CameraCycleButton {...defaultProps} totalCameras={2} />);
      }).not.toThrow();
    });

    it('should maintain consistent hook order across multiple re-renders', () => {
      const { rerender } = render(
        <CameraCycleButton {...defaultProps} totalCameras={2} />
      );

      // Multiple re-renders should not cause hook order violations
      expect(() => {
        rerender(
          <CameraCycleButton {...defaultProps} totalCameras={2} currentIndex={1} />
        );
        rerender(
          <CameraCycleButton {...defaultProps} totalCameras={3} currentIndex={2} />
        );
        rerender(
          <CameraCycleButton {...defaultProps} totalCameras={2} currentIndex={0} />
        );
      }).not.toThrow();
    });

    it('should not throw when switching between conditional render states', () => {
      const { rerender } = render(
        <CameraCycleButton {...defaultProps} totalCameras={2} />
      );

      // Switch to state where component returns null
      expect(() => {
        rerender(<CameraCycleButton {...defaultProps} totalCameras={1} />);
      }).not.toThrow();

      // Switch back to rendering state
      expect(() => {
        rerender(<CameraCycleButton {...defaultProps} totalCameras={2} />);
      }).not.toThrow();
    });
  });

  describe('Conditional Rendering', () => {
    it('should not render when totalCameras is 0', () => {
      const { container } = render(
        <CameraCycleButton {...defaultProps} totalCameras={0} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should not render when totalCameras is 1', () => {
      const { container } = render(
        <CameraCycleButton {...defaultProps} totalCameras={1} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render when totalCameras is 2', () => {
      render(<CameraCycleButton {...defaultProps} totalCameras={2} />);
      expect(screen.getByRole('button', { name: /switch camera/i })).toBeInTheDocument();
    });

    it('should render when totalCameras is greater than 2', () => {
      render(<CameraCycleButton {...defaultProps} totalCameras={3} />);
      expect(screen.getByRole('button', { name: /switch camera/i })).toBeInTheDocument();
    });

    it('should display correct camera count in badge', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CameraCycleButton {...defaultProps} totalCameras={3} currentIndex={1} />);
      // Badge starts hidden, need to click to show it
      const button = screen.getByRole('button', { name: /switch camera/i });
      await user.click(button);
      
      // Badge should show current camera position
      expect(screen.getByText('2/3')).toBeInTheDocument();
    });
  });

  describe('Badge Display Timing', () => {
    it('should initially hide the badge', () => {
      render(<CameraCycleButton {...defaultProps} />);
      const badge = screen.getByText('1/2');
      
      // Badge should have opacity-0 class (hidden)
      expect(badge).toHaveClass('opacity-0');
    });

    it('should show badge when button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CameraCycleButton {...defaultProps} />);
      const button = screen.getByRole('button', { name: /switch camera/i });
      
      await user.click(button);
      
      const badge = screen.getByText('1/2');
      expect(badge).toHaveClass('opacity-100');
    });

    it('should hide badge after 2 seconds', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CameraCycleButton {...defaultProps} />);
      const button = screen.getByRole('button', { name: /switch camera/i });
      
      await user.click(button);
      
      // Badge should be visible
      let badge = screen.getByText('1/2');
      expect(badge).toHaveClass('opacity-100');
      
      // Fast-forward time by 2 seconds
      jest.advanceTimersByTime(2000);
      
      // Badge should be hidden
      await waitFor(() => {
        badge = screen.getByText('1/2');
        expect(badge).toHaveClass('opacity-0');
      });
    });

    it('should reset timer if button is clicked again before timeout', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CameraCycleButton {...defaultProps} />);
      const button = screen.getByRole('button', { name: /switch camera/i });
      
      // First click
      await user.click(button);
      
      // Wait 1 second
      jest.advanceTimersByTime(1000);
      
      // Click again before timeout
      await user.click(button);
      
      // Wait another 1.5 seconds (total 2.5s from first click, but only 1.5s from second)
      jest.advanceTimersByTime(1500);
      
      // Badge should still be visible because timer was reset
      const badge = screen.getByText('1/2');
      expect(badge).toHaveClass('opacity-100');
      
      // Wait remaining 0.5 seconds (total 2s from second click)
      jest.advanceTimersByTime(500);
      
      // Now badge should be hidden
      await waitFor(() => {
        expect(badge).toHaveClass('opacity-0');
      });
    });

    it('should clean up timer on unmount', async () => {
      const user = userEvent.setup({ delay: null });
      const { unmount } = render(<CameraCycleButton {...defaultProps} />);
      const button = screen.getByRole('button', { name: /switch camera/i });
      
      await user.click(button);
      
      // Unmount before timeout
      unmount();
      
      // Should not throw or cause memory leaks
      expect(() => {
        jest.advanceTimersByTime(2000);
      }).not.toThrow();
    });
  });

  describe('User Interactions', () => {
    it('should call onCycle when button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      const onCycle = jest.fn();
      render(<CameraCycleButton {...defaultProps} onCycle={onCycle} />);
      
      const button = screen.getByRole('button', { name: /switch camera/i });
      await user.click(button);
      
      expect(onCycle).toHaveBeenCalledTimes(1);
    });

    it('should not call onCycle when button is disabled', async () => {
      const user = userEvent.setup({ delay: null });
      const onCycle = jest.fn();
      render(<CameraCycleButton {...defaultProps} onCycle={onCycle} disabled={true} />);
      
      const button = screen.getByRole('button', { name: /switch camera/i });
      await user.click(button);
      
      expect(onCycle).not.toHaveBeenCalled();
    });

    it('should update badge display after each click', async () => {
      const user = userEvent.setup({ delay: null });
      const { rerender } = render(
        <CameraCycleButton {...defaultProps} totalCameras={3} currentIndex={0} />
      );
      
      const button = screen.getByRole('button', { name: /switch camera/i });
      await user.click(button);
      
      expect(screen.getByText('1/3')).toBeInTheDocument();
      
      // Simulate camera index change
      rerender(
        <CameraCycleButton {...defaultProps} totalCameras={3} currentIndex={1} />
      );
      
      await user.click(button);
      expect(screen.getByText('2/3')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label', () => {
      render(<CameraCycleButton {...defaultProps} />);
      expect(screen.getByLabelText('Switch camera')).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup({ delay: null });
      const onCycle = jest.fn();
      render(<CameraCycleButton {...defaultProps} onCycle={onCycle} />);
      
      const button = screen.getByRole('button', { name: /switch camera/i });
      button.focus();
      
      // Press Enter
      await user.keyboard('{Enter}');
      expect(onCycle).toHaveBeenCalled();
    });

    it('should indicate disabled state', () => {
      render(<CameraCycleButton {...defaultProps} disabled={true} />);
      const button = screen.getByRole('button', { name: /switch camera/i });
      
      expect(button).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid clicks without breaking', async () => {
      const user = userEvent.setup({ delay: null });
      const onCycle = jest.fn();
      render(<CameraCycleButton {...defaultProps} onCycle={onCycle} />);
      
      const button = screen.getByRole('button', { name: /switch camera/i });
      
      // Click rapidly 5 times
      await user.click(button);
      await user.click(button);
      await user.click(button);
      await user.click(button);
      await user.click(button);
      
      expect(onCycle).toHaveBeenCalledTimes(5);
    });

    it('should handle zero cameras gracefully', () => {
      const { container } = render(
        <CameraCycleButton {...defaultProps} totalCameras={0} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should handle negative camera count', () => {
      const { container } = render(
        <CameraCycleButton {...defaultProps} totalCameras={-1} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should handle large camera counts', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CameraCycleButton {...defaultProps} totalCameras={10} currentIndex={9} />);
      const button = screen.getByRole('button', { name: /switch camera/i });
      await user.click(button);
      
      expect(screen.getByText('10/10')).toBeInTheDocument();
    });
  });

  describe('Visual State', () => {
    it('should apply correct styling classes', () => {
      render(<CameraCycleButton {...defaultProps} />);
      const button = screen.getByRole('button', { name: /switch camera/i });
      
      expect(button).toHaveClass('rounded-full');
      expect(button).toHaveClass('shadow-lg');
    });

    it('should show scale animation on badge', async () => {
      const user = userEvent.setup({ delay: null });
      render(<CameraCycleButton {...defaultProps} />);
      const button = screen.getByRole('button', { name: /switch camera/i });
      
      await user.click(button);
      
      const badge = screen.getByText('1/2');
      expect(badge).toHaveClass('scale-100');
    });

    it('should hide badge with scale-75 when not shown', () => {
      render(<CameraCycleButton {...defaultProps} />);
      const badge = screen.getByText('1/2');
      
      expect(badge).toHaveClass('scale-75');
    });
  });
});

