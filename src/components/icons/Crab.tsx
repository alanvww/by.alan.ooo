// src/components/icons/Crab.tsx
'use client';

import * as React from 'react';
import { IconBase, type IconProps, type IconWeight } from '@phosphor-icons/react';

/**
 * Custom crab icon — Phosphor has no Crab, so this hand-draws one on the
 * same 256×256 grid with Phosphor's stroke conventions (currentColor,
 * round caps, 16-unit regular stroke) so it sits seamlessly next to the
 * stock duotone folder icons.
 */

/** Body outline plus claws and legs, shared by every stroke weight. */
const strokes = (strokeWidth: number): React.ReactElement => (
  <g
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* body */}
    <ellipse cx="128" cy="152" rx="56" ry="40" />
    {/* left claw arm + pincer */}
    <path d="M98,120 Q80,106 62,75" />
    <path d="M74.8,49.2 A20,20 0 1 1 62.8,37.2" />
    {/* right claw arm + pincer */}
    <path d="M158,120 Q176,106 194,75" />
    <path d="M181.2,49.2 A20,20 0 1 0 193.2,37.2" />
    {/* legs */}
    <path d="M74,140 L38,128" />
    <path d="M72,160 L34,166" />
    <path d="M82,184 L50,208" />
    <path d="M182,140 L218,128" />
    <path d="M184,160 L222,166" />
    <path d="M174,184 L206,208" />
  </g>
);

/** Eye dots, drawn as solid fills like Phosphor's animal icons. */
const eyes = (
  <g fill="currentColor" stroke="none">
    <circle cx="106" cy="144" r="10" />
    <circle cx="150" cy="144" r="10" />
  </g>
);

const weights = new Map<IconWeight, React.ReactElement>([
  ['thin', <>{strokes(8)}{eyes}</>],
  ['light', <>{strokes(12)}{eyes}</>],
  ['regular', <>{strokes(16)}{eyes}</>],
  ['bold', <>{strokes(24)}{eyes}</>],
  [
    'duotone',
    <>
      <ellipse cx="128" cy="152" rx="56" ry="40" fill="currentColor" opacity="0.2" stroke="none" />
      {strokes(16)}
      {eyes}
    </>,
  ],
  [
    'fill',
    <>
      {strokes(16)}
      {/* solid body with the eyes knocked out as holes */}
      <path
        fillRule="evenodd"
        d="M72,152 a56,40 0 1,0 112,0 a56,40 0 1,0 -112,0 M96,144 a10,10 0 1,0 20,0 a10,10 0 1,0 -20,0 M140,144 a10,10 0 1,0 20,0 a10,10 0 1,0 -20,0"
      />
    </>,
  ],
]);

const Crab = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <IconBase ref={ref} {...props} weights={weights} />
));

Crab.displayName = 'Crab';

export default Crab;
