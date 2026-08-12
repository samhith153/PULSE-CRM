import type { NextConfig } from "next";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const nextConfig: NextConfig = {
  // Skip type-check during CI/Vercel build (types checked separately)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Whitelist external image domains used in dashboard avatars
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pulse-crm-backend.onrender.com',
        pathname: '/**',
      },
    ],
  },

  async redirects() {
    return [];
  },

  // Proxy API calls through the frontend origin (same-origin).
  // This eliminates CORS / hostname issues entirely: the Google auth
  // button (and any relative /api/v1 call) works from localhost, the
  // LAN address, or any device without a single "Failed to fetch".
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
