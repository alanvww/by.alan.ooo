// src/components/xmb/XMBKeyboardHelper.tsx
'use client';

import React from 'react';
import { motion } from 'motion/react';

interface KeyProps {
    label: string;
    action?: string;
    pressed?: boolean;
}

const Key = ({ label, action, pressed }: KeyProps) => {
    return (
        <motion.div 
            className="flex items-center gap-2"
            animate={{ scale: pressed ? 0.95 : 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
            <motion.span 
                className={`px-2 py-1 rounded text-xs font-mono transition-all duration-150 ${
                    pressed 
                        ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.8)]' 
                        : 'border border-white/40 text-white/70'
                }`}
                animate={{ 
                    scale: pressed ? 1.05 : 1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
                {label}
            </motion.span>
            {action && <span className="text-xs text-white/50">{action}</span>}
        </motion.div>
    );
};

interface XMBKeyboardHelperProps {
    pressedKeys: Set<string>;
}

const XMBKeyboardHelper = ({ pressedKeys }: XMBKeyboardHelperProps) => {
    return (
        <div className="absolute bottom-8 right-12 flex gap-8 text-sm opacity-70 hover:opacity-100 transition-opacity">
            {/* Arrow Keys Cluster */}
            <div className="flex flex-col items-center gap-1">
                <div className="flex justify-center">
                    <Key label="↑" pressed={pressedKeys.has('ArrowUp')} />
                </div>
                <div className="flex gap-1">
                    <Key label="←" pressed={pressedKeys.has('ArrowLeft')} />
                    <Key label="↓" pressed={pressedKeys.has('ArrowDown')} />
                    <Key label="→" pressed={pressedKeys.has('ArrowRight')} />
                </div>
                <div className="text-[10px] text-white/40 mt-1 font-mono">NAVIGATE</div>
            </div>

            {/* Action Keys */}
            <div className="flex flex-col gap-2">
                <Key label="ENTER" action="Select" pressed={pressedKeys.has('Enter')} />
                <Key label="ESC" action="Back" pressed={pressedKeys.has('Escape')} />
            </div>
        </div>
    );
};

XMBKeyboardHelper.displayName = 'XMBKeyboardHelper';

export default React.memo(XMBKeyboardHelper);
