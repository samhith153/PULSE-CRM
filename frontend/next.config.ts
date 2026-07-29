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
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
