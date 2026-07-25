// src/components/xmb/XMBIcon.tsx
'use client';

import React from 'react';
import type { IconWeight } from '@phosphor-icons/react';
import {
  Gear,
  User,
  Atom,
  Notebook,
  EnvelopeSimple,
  Folder,
  File,
  CaretRight,
  Link,
  ArrowLeft,
  Question,
  GithubLogo,
  InstagramLogo,
  LinkedinLogo,
  MastodonLogo,
  XLogo,
  Butterfly,
  ReadCvLogo,
  FilePdf,
  ShareNetwork,
  DownloadSimple,
  Code,
  CompassTool,
  Cube,
  VirtualReality,
  Backpack,
} from '@phosphor-icons/react';
import Crab from '@/components/icons/Crab';
import type { XMBIconName } from '@/lib/xmb-constants';

const iconRegistry = {
  Gear,
  User,
  Atom,
  Notebook,
  EnvelopeSimple,
  Folder,
  File,
  CaretRight,
  Link,
  ArrowLeft,
  Question,
  GithubLogo,
  InstagramLogo,
  LinkedinLogo,
  MastodonLogo,
  XLogo,
  Butterfly,
  ReadCvLogo,
  FilePdf,
  ShareNetwork,
  DownloadSimple,
  Code,
  CompassTool,
  Cube,
  VirtualReality,
  Backpack,
  Crab,
} as const;

interface XMBIconProps {
  name: XMBIconName | string;
  size?: number;
  weight?: IconWeight;
  className?: string;
  /**
   * Every current use is decorative (adjacent text or an aria-label carries
   * the meaning), so the SVG is hidden from AT by default; pass false when
   * an icon must announce itself.
   */
  'aria-hidden'?: boolean;
}

const XMBIcon = ({
  name,
  size = 32,
  weight = 'duotone',
  className,
  'aria-hidden': ariaHidden = true,
}: XMBIconProps) => {
  const IconComponent = iconRegistry[name as keyof typeof iconRegistry];

  if (!IconComponent) {
    return <Question size={size} weight={weight} className={className} aria-hidden={ariaHidden} />;
  }

  return <IconComponent size={size} weight={weight} className={className} aria-hidden={ariaHidden} />;
};

export default XMBIcon;
