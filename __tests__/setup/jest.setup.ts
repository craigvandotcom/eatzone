// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import React from 'react';

// Polyfill for encoding/decoding
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Polyfill Web APIs for Next.js API route testing
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    public url: string;
    public method: string;
    public headers: Headers;
    private _body: any;

    constructor(url: string, init?: RequestInit) {
      this.url = url;
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers);
      this._body = init?.body;
    }

    async json() {
      if (typeof this._body === 'string') {
        return JSON.parse(this._body);
      }
      return this._body;
    }

    async text() {
      if (typeof this._body === 'string') {
        return this._body;
      }
      return JSON.stringify(this._body);
    }

    clone() {
      return new Request(this.url, {
        method: this.method,
        headers: this.headers,
        body: this._body,
      });
    }
  } as any;
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(
      public body?: any,
      public init?: ResponseInit
    ) {}

    json() {
      return Promise.resolve(JSON.parse(this.body));
    }

    text() {
      return Promise.resolve(this.body);
    }
  } as any;
}

if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    private headers: Record<string, string> = {};

    constructor(init?: HeadersInit) {
      if (init) {
        if (Array.isArray(init)) {
          init.forEach(([key, value]) => {
            this.headers[key.toLowerCase()] = value;
          });
        } else if (init instanceof Headers) {
          this.headers = { ...(init as any).headers };
        } else {
          Object.entries(init).forEach(([key, value]) => {
            this.headers[key.toLowerCase()] = value as string;
          });
        }
      }
    }

    get(name: string) {
      return this.headers[name.toLowerCase()] || null;
    }

    set(name: string, value: string) {
      this.headers[name.toLowerCase()] = value;
    }

    has(name: string) {
      return name.toLowerCase() in this.headers;
    }

    delete(name: string) {
      delete this.headers[name.toLowerCase()];
    }

    forEach(callback: (value: string, key: string) => void) {
      Object.entries(this.headers).forEach(([key, value]) => {
        callback(value, key);
      });
    }
  } as any;
}

// Mock Upstash Redis and Ratelimit (to avoid ESM issues in tests)
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  })),
}));

jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: jest.fn().mockImplementation(() => ({
    limit: jest.fn().mockResolvedValue({ success: true }),
  })),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
    then: jest.fn(),
  })),
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(() => ({
      unsubscribe: jest.fn(),
    })),
  })),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

// Mock custom hooks to return test data
jest.mock('@/lib/hooks', () => ({
  useTodaysFoods: jest.fn(() => ({
    data: [],
    error: null,
    isLoading: false,
    retry: jest.fn(),
  })),
  useAllFoods: jest.fn(() => ({
    data: [],
    error: null,
    isLoading: false,
    retry: jest.fn(),
  })),
  useRecentFoods: jest.fn(() => ({
    data: [],
    error: null,
    isLoading: false,
    retry: jest.fn(),
  })),
  useTodaysSymptoms: jest.fn(() => ({
    data: [],
    error: null,
    isLoading: false,
    retry: jest.fn(),
  })),
  useAllSymptoms: jest.fn(() => ({
    data: [],
    error: null,
    isLoading: false,
    retry: jest.fn(),
  })),
  useRecentSymptoms: jest.fn(() => ({
    data: [],
    error: null,
    isLoading: false,
    retry: jest.fn(),
  })),
  useFoodStats: jest.fn(() => ({
    data: {
      greenIngredients: 0,
      yellowIngredients: 0,
      redIngredients: 0,
      totalIngredients: 0,
      organicCount: 0,
      totalOrganicPercentage: 0,
      isFromToday: true,
    },
    error: null,
    isLoading: false,
    retry: jest.fn(),
  })),
  useSymptomTrends: jest.fn(() => ({
    data: [],
    error: null,
    isLoading: false,
    retry: jest.fn(),
  })),
  useDailySummary: jest.fn(() => ({
    foods: 0,
    symptoms: 0,
    totalEntries: 0,
  })),
}));

// Mock ErrorBoundary component
jest.mock('@/components/error-boundary', () => ({
  ErrorBoundary: ({
    children,
    fallback,
  }: {
    children: React.ReactNode;
    fallback?: React.ComponentType<any>;
  }) => children,
  SupabaseErrorFallback: ({
    error,
    resetError,
  }: {
    error: Error;
    resetError: () => void;
  }) =>
    React.createElement(
      'div',
      {},
      React.createElement('div', {}, 'Error: ' + error.message),
      React.createElement('button', { onClick: resetError }, 'Retry')
    ),
  withSupabaseErrorBoundary: <P extends object>(
    Component: React.ComponentType<P>
  ) => Component,
  useErrorHandler: () => ({ handleError: jest.fn(), clearError: jest.fn() }),
}));

// Export the mock for use in tests
export { mockSupabaseClient };

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Suppress console errors during tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
