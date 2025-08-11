import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/features/auth/components/auth-provider';

// Mock user for testing
const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
};

// Mock auth context value
const mockAuthContext = {
  user: mockUser,
  loading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  isAuthenticated: true,
};

// Mock the auth provider
jest.mock('@/features/auth/components/auth-provider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => mockAuthContext,
}));

// Add any providers that wrap your app
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// re-export everything
export * from '@testing-library/react';
export { act } from '@testing-library/react';

// override render method
export { customRender as render };

// Export mock auth context for use in tests
export { mockAuthContext, mockUser };
