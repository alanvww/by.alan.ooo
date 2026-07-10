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
} from '@phosphor-icons/react';
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
} as const;

interface XMBIconProps {
  name: XMBIconName | string;
  size?: number;
  weight?: IconWeight;
  className?: string;
}

const XMBIcon = ({ 
  name, 
  size = 32, 
  weight = 'duotone', 
  className 
}: XMBIconProps) => {
  const IconComponent = iconRegistry[name as keyof typeof iconRegistry];
  
  if (!IconComponent) {
    return <Question size={size} weight={weight} className={className} />;
  }
  
  return <IconComponent size={size} weight={weight} className={className} />;
};

export default XMBIcon;
