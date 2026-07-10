'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { playCancel } from '@/hooks/useKeyAudioFx';
import { XMB_OVERLAY } from '@/lib/xmb-constants';

export default function NotFound() {
    const router = useRouter();

    // The 404 renders at the ROOT not-found boundary, outside the [type]
    // layout — XMBPostFrame's Escape handler is unmounted here, so the ESC
    // keycap below needs its own.
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            playCancel();
            router.push('/');
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [router]);

    return (
        <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${XMB_OVERLAY.FULLSCREEN} text-xmb-fg`}>
            <div className="text-center max-w-lg px-6">
                <h1 className="text-8xl md:text-9xl font-extralight mb-4 text-xmb-fg/90">404</h1>
                <h2 className="text-2xl md:text-3xl font-light mb-8 text-xmb-fg/80">Page Not Found</h2>
                <p className="text-lg text-xmb-fg/50 mb-12 font-light leading-relaxed">
                    Sorry, the page you are looking for doesn&apos;t exist or has been moved.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-xmb-fg/20 bg-xmb-fg/5 text-xmb-fg/70 hover:text-xmb-fg hover:border-xmb-fg/40 hover:bg-xmb-fg/10 transition-all duration-300 text-sm font-mono uppercase tracking-widest"
                >
                    <span className="px-1.5 h-5 rounded border border-xmb-fg/20 bg-xmb-fg/5 text-[10px] font-mono">ESC</span>
                    Return to Menu
                </Link>
            </div>
        </div>
    );
}
