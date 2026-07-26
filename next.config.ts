import type { NextConfig } from 'next';

// Base config
const nextConfig: NextConfig = {
  // Dev-only: let phones/tablets on the local network use the dev server.
  // Next 16 rejects cross-origin dev requests (RSC payload fetch, HMR
  // websocket) from hosts not listed here — the page then renders as a
  // frozen, unhydrated shell (icons visible, no labels/list, taps dead).
  // Update the IP if the machine's LAN address changes.
  allowedDevOrigins: ['192.168.1.210', '*.local'],
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react', 'motion'],
  },
  // Every route renders through the layout's XMB menu, which reads MDX from
  // src/content at render time (and /content/[...path] serves colocated
  // assets from there) — ship it with every server bundle so on-demand
  // revalidation keeps working.
  outputFileTracingIncludes: {
    '/**': ['./src/content/**/*'],
  },
  // public/ is served from the CDN; traced into functions it adds ~233MB and
  // blows Vercel's 250MB function limit. Belt to the turbopackIgnore
  // suspenders in src/lib/content-assets.ts — the only runtime reader of
  // public/ files is the image-dimension probe there, which falls back to
  // 16:9 when a file is absent.
  outputFileTracingExcludes: {
    '/**': ['./public/**'],
  },
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
  },
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  trailingSlash: false,
  // MDX optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
