import type { NextConfig } from "next";

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
    ],
  },

  async redirects() {
    return [];
  },
};

export default nextConfig;
