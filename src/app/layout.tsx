import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { XMBNavigationProvider } from "@/lib/xmb-navigation-context";
import { getXMBData } from "@/lib/xmb-data";
import { getContentTypes } from "@/lib/mdx";
import WebGLBackground from "@/components/WebGLBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Alan',
    default: 'Alan - Web Developer & Creative Coder',
  },
  description: "Personal website and digital garden of Alan, a web developer and creative coder.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Required for env(safe-area-inset-*) to resolve on notched devices.
  // No maximumScale/userScalable — pinch zoom stays available.
  viewportFit: 'cover',
  // Match --color-background (globals.css) so browser chrome blends in.
  themeColor: '#0b0b14',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categories = await getXMBData();

  // Boot with the first content column (Projects) selected, like the XMB
  // landing on games rather than settings.
  const contentTypes = getContentTypes();
  const initialCategoryIndex = Math.max(
    categories.findIndex((category) => contentTypes.includes(category.id)),
    0,
  );

  return (
    // The site is locked to the dark theme: .dark is hardcoded on <html> so
    // the SSR payload, CSS tokens, and Tailwind dark: variants are all dark
    // from the first paint — no OS mirroring, no pre-hydration script.
    <html lang="en" className="dark" data-theme="dark" data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh text-foreground bg-background`}
      >
        {/* Mounted once for the whole app: the GL context and shader clock
            survive route changes instead of rebuilding on every navigation. */}
        <WebGLBackground />
        <XMBNavigationProvider categories={categories} initialCategoryIndex={initialCategoryIndex}>
          {children}
        </XMBNavigationProvider>
      </body>
    </html>
  );
}
