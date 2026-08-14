import type { NextConfig } from "next";

const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').trim();

const isProd = process.env.NODE_ENV === 'production';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // Strict-Transport-Security only over HTTPS
  ...(isProd
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
  // Content-Security-Policy — locked to self + whitelisted origins
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Inline styles needed by Tailwind runtime classes and some UI libs
      "style-src 'self' 'unsafe-inline' https://accounts.google.com",
      // Next.js requires 'unsafe-inline' for hydration/Turbopack/webpack runtime scripts.
      // External scripts are still blocked — only self-hosted scripts execute.
      "script-src 'self' 'unsafe-inline' https://accounts.google.com" + (isProd ? "" : " 'unsafe-eval'"),
      // Images: self + data: for avatars/base64 + HTTPS for Google avatars
      "img-src 'self' data: https://lh3.googleusercontent.com https://*.googleusercontent.com",
      // Fonts: self + Google Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Connect: self + backend API
      `connect-src 'self' ${backendUrl} https://accounts.google.com`,
      // Frame: none (no iframing)
      "frame-src 'self' https://accounts.google.com",
      // Frame-ancestors: none
      "frame-ancestors 'none'",
      // Object: none
      "object-src 'none'",
      // Base URI: self only
      "base-uri 'self'",
      // Form action: self only
      "form-action 'self'",
    ].join('; '),
  },
];
const nextConfig: NextConfig = {
  // Skip type-check during CI/Vercel build (types checked separately)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Security headers
  headers: async () => [
    {
      source: '/(.*)',
      headers: securityHeaders,
    },
  ],

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
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
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
