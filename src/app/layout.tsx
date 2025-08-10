import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import WebGLBackground from "@/components/WebGLBackground";
import { ThemeProvider } from "@/lib/theme-context";
import ThemeScript from "@/components/ThemeScript";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen text-foreground bg-background transition-colors duration-300`}
      >
        <ThemeProvider>
          {/* Top navigation */}
          <Navigation />

          {/* Page content */}
          {/* Background systems */}
          <WebGLBackground />
          <main className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-12">
            {children}
          </main>

          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
