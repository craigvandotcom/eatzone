/**
 * App version utilities
 * Provides dynamic version information from package.json
 */

import packageJson from '../../package.json';

export const APP_VERSION = packageJson.version;
export const APP_NAME = packageJson.name;

export function getAppVersion(): string {
  return APP_VERSION;
}

export function getAppName(): string {
  return APP_NAME;
}

export function getBuildInfo() {
  return {
    version: APP_VERSION,
    name: APP_NAME,
    build: process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
    platform: 'PWA',
  };
}
