/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'd3'],
  },
  // Prevent Vercel edge caching for ALM routes
  // This fixes hydration errors caused by stale cached data
  headers: async () => [
    {
      source: '/alm/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, must-revalidate',
        },
        {
          key: 'CDN-Cache-Control',
          value: 'no-store',
        },
        {
          key: 'Vercel-CDN-Cache-Control',
          value: 'no-store',
        },
      ],
    },
    {
      source: '/alm',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store, must-revalidate',
        },
        {
          key: 'CDN-Cache-Control',
          value: 'no-store',
        },
        {
          key: 'Vercel-CDN-Cache-Control',
          value: 'no-store',
        },
      ],
    },
  ],
};

export default nextConfig;
