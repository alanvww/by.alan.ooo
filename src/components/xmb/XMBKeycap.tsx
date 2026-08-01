'use client';

import React from 'react';
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

// Press pose and its transitions live in .xmb-keycap (globals.css) —
// CSS instead of a motion spring so keypress feedback never runs on the
// JS thread while navigation springs are saturating it.
const XMBKeycap = ({ label, pressed = false, hoverable = false, className }: XMBKeycapProps) => (
  <span
    data-pressed={pressed}
    className={cn(
      'xmb-keycap w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono',
      hoverable && HOVER,
      pressed ? PRESSED : IDLE,
      className,
    )}
  >
    {label}
  </span>
);

export default XMBKeycap;
