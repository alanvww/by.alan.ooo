import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-context";
import ThemeScript from "@/components/ThemeScript";
import LayoutWrapper from "@/components/LayoutWrapper";
import { XMBNavigationProvider } from "@/lib/xmb-navigation-context";
import { getXMBData } from "@/lib/xmb-data";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const categories = await getXMBData();

  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen text-foreground bg-background transition-colors duration-300`}
      >
        <ThemeProvider>
          <XMBNavigationProvider categories={categories}>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </XMBNavigationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
