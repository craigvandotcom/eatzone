import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginFormClient } from '@/app/(auth)/login/login-form-client';
import { useAuth } from '@/features/auth/components/auth-provider';

// Mock the auth provider
jest.mock('@/features/auth/components/auth-provider');

// Mock Next.js navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('LoginFormClient', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  describe('Error Message Standardization', () => {
    it('should display generic error message for any login failure', async () => {
      const user = userEvent.setup();

      // Mock login to throw different types of errors
      mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));

      render(<LoginFormClient />);

      // Fill in the form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      // Should show standardized error message
      await waitFor(() => {
        expect(
          screen.getByText('Invalid email or password')
        ).toBeInTheDocument();
      });

      // Should not show the actual error message
      expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument();
    });

    it('should display same error message for network errors', async () => {
      const user = userEvent.setup();

      // Mock login to throw network error
      mockLogin.mockRejectedValueOnce(
        new Error('Network error: Failed to fetch')
      );

      render(<LoginFormClient />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Should show same standardized error message
      await waitFor(() => {
        expect(
          screen.getByText('Invalid email or password')
        ).toBeInTheDocument();
      });

      // Should not leak network error details
      expect(screen.queryByText(/network error/i)).not.toBeInTheDocument();
    });

    it('should display same error message for non-Error exceptions', async () => {
      const user = userEvent.setup();

      // Mock login to throw a non-Error object
      mockLogin.mockRejectedValueOnce('Some string error');

      render(<LoginFormClient />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Should still show standardized error message
      await waitFor(() => {
        expect(
          screen.getByText('Invalid email or password')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Successful Login', () => {
    it('should redirect to /app on successful login', async () => {
      const user = userEvent.setup();

      // Mock successful login
      mockLogin.mockResolvedValueOnce(undefined);

      render(<LoginFormClient />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'correctpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(
          'test@example.com',
          'correctpassword'
        );
        expect(mockPush).toHaveBeenCalledWith('/app');
      });
    });
  });
});
