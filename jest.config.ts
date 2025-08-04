import type { Config } from "jest";
import nextJest from "next/jest";

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig: Config = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ["<rootDir>/__tests__/setup/jest.setup.ts"],

  // Module name mapper to handle path aliases
  moduleNameMapper: {
    // Handle path aliases (@ -> src)
    "^@/(.*)$": "<rootDir>/$1",

    // Handle CSS imports (with CSS modules)
    "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",

    // Handle CSS imports (without CSS modules)
    "^.+\\.(css|sass|scss)$": "<rootDir>/__tests__/setup/style-mock.js",

    // Handle image imports
    "^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$/i":
      "<rootDir>/__tests__/setup/file-mock.js",
  },

  // Test environment options
  testEnvironment: "jest-environment-jsdom",

  // Coverage configuration
  collectCoverageFrom: [
    "app/**/*.{js,jsx,ts,tsx}",
    "features/**/*.{js,jsx,ts,tsx}",
    "lib/**/*.{js,jsx,ts,tsx}",
    "components/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
    "!**/coverage/**",
    "!**/jest.config.js",
    "!**/jest.config.ts",
  ],

  // Test path patterns
  testMatch: [
    "**/__tests__/**/*.(test|spec).{js,jsx,ts,tsx}",
    "**/*.(test|spec).{js,jsx,ts,tsx}",
  ],

  // Ignore patterns
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],

  // Transform ignore patterns
  transformIgnorePatterns: [
    "/node_modules/",
    "^.+\\.module\\.(css|sass|scss)$",
  ],

  // Module directories
  modulePaths: ["<rootDir>"],

  // Globals
  globals: {
    "ts-jest": {
      tsconfig: {
        jsx: "react-jsx",
      },
    },
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig);
