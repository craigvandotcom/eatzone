import { withSentryConfig } from "@sentry/nextjs";

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
    formats: ["image/avif", "image/webp"], // Modern, efficient formats
    minimumCacheTTL: 31536000, // 1 year cache for better performance
    // Removed unoptimized: true for production optimization
  },

  // PERFORMANCE: Bundle and build optimizations
  experimental: {
    optimizeCss: true, // Optimize CSS delivery
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"], // Tree-shake large icon libraries
  },

  // SECURITY: Essential security headers for production
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY", // Prevent clickjacking attacks
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff", // Prevent MIME type sniffing
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin", // Control referrer information
          },
        ],
      },
    ];
  },
};

// Export with Sentry configuration preserved
export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "craig-van",
  project: "puls",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
