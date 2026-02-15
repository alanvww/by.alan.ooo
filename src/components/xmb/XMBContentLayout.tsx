'use client';

import React, { useEffect } from 'react';
import XMBHeader from './XMBHeader';
import { useXMBNavigationContext } from '@/lib/xmb-navigation-context';

interface XMBContentLayoutProps {
    children: React.ReactNode;
    shouldFinishLoading?: boolean;
}

const XMBContentLayout = ({ children, shouldFinishLoading = true }: XMBContentLayoutProps) => {
    const { finishNavigation } = useXMBNavigationContext();

    useEffect(() => {
        if (shouldFinishLoading) {
            finishNavigation();
        }
    }, [finishNavigation, shouldFinishLoading]);

    return (
        <div className="fixed inset-0 text-white overflow-hidden font-sans select-none">
            <div className="absolute inset-0 bg-linear-to-br from-black/40 to-transparent" />

            <XMBHeader />

            {/* Content Slot */}
            <main className="relative w-full h-full">
                {children}
            </main>
        </div>
    );
};

export default XMBContentLayout;
