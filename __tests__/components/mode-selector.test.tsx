/**
 * Tests for ModeSelector component
 * Tests mode switching, button states, and conditional submit functionality
 */

import React from 'react';
import { render, screen } from '@/__tests__/setup/test-utils';
import userEvent from '@testing-library/user-event';
import {
  ModeSelector,
  type CameraMode,
} from '@/features/camera/components/mode-selector';

describe('ModeSelector', () => {
  const mockOnModeChange = jest.fn();
  const mockOnSubmit = jest.fn();

  const defaultProps = {
    selectedMode: 'camera' as CameraMode,
    onModeChange: mockOnModeChange,
    hasImages: false,
    onSubmit: mockOnSubmit,
    isSubmitting: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render all mode buttons', () => {
      render(<ModeSelector {...defaultProps} />);

      // Check that all mode buttons are present
      expect(
        screen.getByRole('button', { name: /cancel/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /upload/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /camera/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /barcode/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /label/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /manual/i })
      ).toBeInTheDocument();
    });

    it('should show submit button when hasImages is true', () => {
      render(<ModeSelector {...defaultProps} hasImages={true} />);

      expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
    });

    it('should not show submit button when hasImages is false', () => {
      render(<ModeSelector {...defaultProps} hasImages={false} />);

      expect(
        screen.queryByRole('button', { name: /done/i })
      ).not.toBeInTheDocument();
    });

    it('should not show submit button when onSubmit is not provided', () => {
      render(
        <ModeSelector {...defaultProps} hasImages={true} onSubmit={undefined} />
      );

      expect(
        screen.queryByRole('button', { name: /done/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    it('should show camera as selected by default', () => {
      render(<ModeSelector {...defaultProps} selectedMode="camera" />);

      const cameraButton = screen.getByRole('button', { name: /camera/i });
      expect(cameraButton).toHaveClass('bg-primary');
    });

    it('should show cancel button with destructive styling', () => {
      render(<ModeSelector {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toHaveClass('bg-destructive/10', 'text-destructive');
    });

    it('should disable barcode and label buttons', () => {
      render(<ModeSelector {...defaultProps} />);

      const barcodeButton = screen.getByRole('button', { name: /barcode/i });
      const labelButton = screen.getByRole('button', { name: /label/i });

      expect(barcodeButton).toBeDisabled();
      expect(labelButton).toBeDisabled();
      expect(barcodeButton).toHaveClass('opacity-40', 'cursor-not-allowed');
      expect(labelButton).toHaveClass('opacity-40', 'cursor-not-allowed');
    });

    it('should disable all buttons when isSubmitting is true', () => {
      render(<ModeSelector {...defaultProps} isSubmitting={true} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('should show submit button with primary styling when hasImages is true', () => {
      render(<ModeSelector {...defaultProps} hasImages={true} />);

      const submitButton = screen.getByRole('button', { name: /done/i });
      expect(submitButton).toHaveClass(
        'bg-brand-primary',
        'text-primary-foreground'
      );
    });
  });

  describe('User Interactions', () => {
    it('should call onModeChange when clicking enabled mode buttons', async () => {
      const user = userEvent.setup();
      render(<ModeSelector {...defaultProps} />);

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      await user.click(uploadButton);

      expect(mockOnModeChange).toHaveBeenCalledWith('upload');
    });

    it('should call onModeChange when clicking cancel button', async () => {
      const user = userEvent.setup();
      render(<ModeSelector {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnModeChange).toHaveBeenCalledWith('cancel');
    });

    it('should call onModeChange when clicking manual button', async () => {
      const user = userEvent.setup();
      render(<ModeSelector {...defaultProps} />);

      const manualButton = screen.getByRole('button', { name: /manual/i });
      await user.click(manualButton);

      expect(mockOnModeChange).toHaveBeenCalledWith('manual');
    });

    it('should call onSubmit when clicking submit button', async () => {
      const user = userEvent.setup();
      render(<ModeSelector {...defaultProps} hasImages={true} />);

      const submitButton = screen.getByRole('button', { name: /done/i });
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalled();
      expect(mockOnModeChange).not.toHaveBeenCalled();
    });

    it('should not call onModeChange when clicking disabled buttons', async () => {
      const user = userEvent.setup();
      render(<ModeSelector {...defaultProps} />);

      const barcodeButton = screen.getByRole('button', { name: /barcode/i });
      await user.click(barcodeButton);

      expect(mockOnModeChange).not.toHaveBeenCalled();
    });

    it('should not call callbacks when isSubmitting is true', async () => {
      const user = userEvent.setup();
      render(
        <ModeSelector {...defaultProps} isSubmitting={true} hasImages={true} />
      );

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      const submitButton = screen.getByRole('button', { name: /done/i });

      await user.click(uploadButton);
      await user.click(submitButton);

      expect(mockOnModeChange).not.toHaveBeenCalled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Mode Selection States', () => {
    it('should highlight selected mode correctly', () => {
      render(<ModeSelector {...defaultProps} selectedMode="upload" />);

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      const cameraButton = screen.getByRole('button', { name: /camera/i });

      expect(uploadButton).toHaveClass('bg-primary');
      expect(cameraButton).not.toHaveClass('bg-primary');
    });

    it('should not highlight cancel button even when selected', () => {
      render(<ModeSelector {...defaultProps} selectedMode="cancel" />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      // Cancel should maintain its destructive styling, not get primary styling
      expect(cancelButton).toHaveClass('bg-destructive/10', 'text-destructive');
      expect(cancelButton).not.toHaveClass('bg-primary');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-labels for all buttons', () => {
      render(<ModeSelector {...defaultProps} hasImages={true} />);

      expect(
        screen.getByRole('button', { name: /cancel/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /upload/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /camera/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /barcode/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /label/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /manual/i })
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
    });

    it('should properly indicate disabled state for screen readers', () => {
      render(<ModeSelector {...defaultProps} />);

      const barcodeButton = screen.getByRole('button', { name: /barcode/i });
      const labelButton = screen.getByRole('button', { name: /label/i });

      expect(barcodeButton).toHaveAttribute('disabled');
      expect(labelButton).toHaveAttribute('disabled');
    });
  });
});
