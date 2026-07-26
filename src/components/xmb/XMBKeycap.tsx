'use client';

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface XMBKeycapProps {
  label: React.ReactNode;
  pressed?: boolean;
  /** Render hover-as-pressed styles. Use when the keycap sits inside a button/link. */
  hoverable?: boolean;
  /** Override sizing/padding; defaults to a 24×24px square. */
  className?: string;
}

const PRESSED = 'bg-xmb-fg text-background shadow-[0_0_15px_var(--color-xmb-glow)]';
const IDLE = 'border border-xmb-fg/20 bg-xmb-fg/5 text-xmb-fg/70';
const HOVER = 'hover:bg-xmb-fg hover:text-background hover:shadow-[0_0_15px_var(--color-xmb-glow)]';

const XMBKeycap = ({ label, pressed = false, hoverable = false, className }: XMBKeycapProps) => (
  <motion.span
    className={cn(
      'w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono transition-all duration-150',
      hoverable && HOVER,
      pressed ? PRESSED : IDLE,
      className,
    )}
    animate={{ scale: pressed ? 1.05 : 1 }}
    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
  >
    {label}
  </motion.span>
);

export default XMBKeycap;
