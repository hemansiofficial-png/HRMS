import { fileURLToPath } from 'url';

// Get __filename equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable aggressive caching to prevent stale data
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, max-age=0',
        },
      ],
    },
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, max-age=0',
        },
      ],
    },
    {
      source: '/_next/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable'
        }
      ]
    },
  ],
  // Image Optimization
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 0, // Disable image cache TTL
  },
  // Compression
  compress: true,
  // Production source maps
  productionBrowserSourceMaps: false,
  // Static page generation timeout
  staticPageGenerationTimeout: 60,
  // Remove powered by header
  poweredByHeader: false,
  // ETag support for validation
  generateEtags: true,
};

export default nextConfig;
