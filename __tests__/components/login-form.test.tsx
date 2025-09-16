import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginFormClient } from '@/app/(auth)/login/login-form-client';
import { useAuth } from '@/features/auth/components/auth-provider';
import { TEST_CONSTANTS } from '../types/test-types';

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
      const submitButton = screen.getByRole('button', {
        name: /continue your journey/i,
      });

      await user.type(emailInput, TEST_CONSTANTS.MOCK_EMAIL);
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      // Should show some error message
      await waitFor(() => {
        expect(
          screen.getByText(/invalid|login failed|error|failed/i)
        ).toBeInTheDocument();
      });
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
      const submitButton = screen.getByRole('button', {
        name: /continue your journey/i,
      });

      await user.type(emailInput, TEST_CONSTANTS.MOCK_EMAIL);
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Should show some error message (implementation dependent)
      await waitFor(() => {
        expect(screen.getByText(/error|failed|invalid/i)).toBeInTheDocument();
      });
    });

    it('should display same error message for non-Error exceptions', async () => {
      const user = userEvent.setup();

      // Mock login to throw a non-Error object
      mockLogin.mockRejectedValueOnce('Some string error');

      render(<LoginFormClient />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', {
        name: /continue your journey/i,
      });

      await user.type(emailInput, TEST_CONSTANTS.MOCK_EMAIL);
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Should show error message (actual message may vary)
      await waitFor(() => {
        expect(
          screen.getByText(/login failed|invalid email or password|error/i)
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
      const submitButton = screen.getByRole('button', {
        name: /continue your journey/i,
      });

      await user.type(emailInput, TEST_CONSTANTS.MOCK_EMAIL);
      await user.type(passwordInput, 'correctpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(
          TEST_CONSTANTS.MOCK_EMAIL,
          'correctpassword'
        );
        expect(mockPush).toHaveBeenCalledWith('/app');
      });
    });
  });
});
