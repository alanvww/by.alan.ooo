import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-context";
import ThemeScript from "@/components/ThemeScript";
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f9fb' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0b14' },
  ],
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
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh text-foreground bg-background transition-colors duration-300`}
      >
        <ThemeProvider>
          {/* Mounted once for the whole app: the GL context and shader clock
              survive route changes instead of rebuilding on every navigation. */}
          <WebGLBackground />
          <XMBNavigationProvider categories={categories} initialCategoryIndex={initialCategoryIndex}>
            {children}
          </XMBNavigationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
