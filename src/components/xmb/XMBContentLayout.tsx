'use client';

import React, { useEffect } from 'react';
import XMBHeader from './XMBHeader';
import { useXMBLoadingContext } from '@/lib/xmb-navigation-context';

interface XMBContentLayoutProps {
    children: React.ReactNode;
    shouldFinishLoading?: boolean;
}

const XMBContentLayout = ({ children, shouldFinishLoading = true }: XMBContentLayoutProps) => {
    const { finishNavigation } = useXMBLoadingContext();

    useEffect(() => {
        if (shouldFinishLoading) {
            finishNavigation();
        }
    }, [finishNavigation, shouldFinishLoading]);

    return (
        // No select-none here: this shell wraps the reading view, where text
        // must stay selectable/copyable. The XMB menu applies its own
        // select-none on XMBInterface's root.
        <div className="fixed inset-0 text-xmb-fg overflow-hidden font-sans">
            <div className="absolute inset-0 bg-linear-to-br dark:from-black/20 from-transparent to-transparent" />

            <XMBHeader />

            {/* Content Slot */}
            <main className="relative w-full h-full">
                {children}
            </main>
        </div>
    );
};

export default XMBContentLayout;
