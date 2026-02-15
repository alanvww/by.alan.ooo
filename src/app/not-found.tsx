'use client';

import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-2xl text-white">
            <div className="text-center max-w-lg px-6">
                <h1 className="text-8xl md:text-9xl font-extralight mb-4 text-white/90">404</h1>
                <h2 className="text-2xl md:text-3xl font-light mb-8 text-white/80">Page Not Found</h2>
                <p className="text-lg text-white/50 mb-12 font-light leading-relaxed">
                    Sorry, the page you are looking for doesn't exist or has been moved.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-white/20 bg-white/5 text-white/70 hover:text-white hover:border-white/40 hover:bg-white/10 transition-all duration-300 text-sm font-mono uppercase tracking-widest"
                >
                    <span className="px-1.5 h-5 rounded border border-white/20 bg-white/5 text-[10px] font-mono">ESC</span>
                    Return to Menu
                </Link>
            </div>
        </div>
    );
}
