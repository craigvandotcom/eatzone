/** @type {import('next').NextConfig} */
const nextConfig = {
  // PRODUCTION: Enable quality checks (critical for production builds)
  eslint: {
    ignoreDuringBuilds: false, // Enable ESLint validation in production
  },
  typescript: {
    ignoreBuildErrors: false, // Enable TypeScript checks in production
  },

  // PERFORMANCE: PWA-optimized image handling
  images: {
    formats: ['image/avif', 'image/webp'], // Modern, efficient formats
    minimumCacheTTL: 31536000, // 1 year cache for better performance
    // Removed unoptimized: true for production optimization
  },

  // PERFORMANCE: Conservative optimizations (removed experimental features that cause webpack issues)
  experimental: {
    optimizeCss: true, // Safe CSS optimization
    // Removed optimizePackageImports - causes module resolution errors
  },

  // SECURITY: Essential security headers for production
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Prevent clickjacking attacks
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Prevent MIME type sniffing
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin', // Control referrer information
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.md$/,
      type: 'asset/source',
    });
    return config;
  },
};

export default nextConfig;
