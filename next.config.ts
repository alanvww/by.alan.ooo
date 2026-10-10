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
  // src/content at render time — ship only markdown/MDX sources with server
  // bundles so on-demand revalidation keeps working without bundling 200MB+
  // of colocated media (which sync-content-media.js copies to public/content
  // for static CDN serving).
  outputFileTracingIncludes: {
    '/**': ['./src/content/**/*.{md,mdx}'],
  },
  // public/ and colocated media in src/content/ are served from the CDN;
  // traced into functions they add ~220MB and blow Vercel's 250MB function
  // limit. Belt to the turbopackIgnore suspenders in src/lib/mdx.ts and
  // src/lib/content-assets.ts.
  outputFileTracingExcludes: {
    '/**': [
      './public/**',
      './src/content/**/*.{mp4,mov,webm,gif,png,jpg,jpeg,webp,avif,svg,mp3,wav,pdf}',
    ],
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
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
  },
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  trailingSlash: false,
  // MDX optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
};

export default nextConfig;
