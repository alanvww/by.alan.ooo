'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { XMB_OVERLAY } from '@/lib/xmb-constants';

export default function ErrorPage({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Route error:', error);
    }, [error]);

    return (
        <div className={`xmb-overlay-in fixed inset-0 z-50 flex flex-col items-center justify-center ${XMB_OVERLAY.FULLSCREEN} text-xmb-fg`}>
            <div className="text-center max-w-lg px-6">
                <h1 className="text-6xl md:text-7xl font-extralight mb-4 text-xmb-fg/90">Something broke</h1>
                <p className="text-lg text-xmb-fg/50 mb-4 font-light leading-relaxed">
                    This page failed to render. If it is a markdown page, the file may
                    have a syntax issue — check the terminal for the compile error.
                </p>
                {process.env.NODE_ENV === 'development' && (
                    <pre className="mb-8 max-h-40 overflow-auto rounded-lg border border-xmb-fg/10 bg-xmb-fg/5 p-4 text-left text-xs font-mono text-xmb-fg/60 whitespace-pre-wrap">
                        {error.message}
                    </pre>
                )}
                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={reset}
                        className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-xmb-fg/20 bg-xmb-fg/5 text-xmb-fg/70 hover:text-xmb-fg hover:border-xmb-fg/40 hover:bg-xmb-fg/10 active:border-xmb-fg/50 active:bg-xmb-fg/15 transition-[color,background-color,border-color,text-decoration-color,box-shadow] duration-150 text-sm font-mono uppercase tracking-widest"
                    >
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-xmb-fg/20 bg-xmb-fg/5 text-xmb-fg/70 hover:text-xmb-fg hover:border-xmb-fg/40 hover:bg-xmb-fg/10 active:border-xmb-fg/50 active:bg-xmb-fg/15 transition-[color,background-color,border-color,text-decoration-color,box-shadow] duration-150 text-sm font-mono uppercase tracking-widest"
                    >
                        Return to Menu
                    </Link>
                </div>
            </div>
        </div>
    );
}
