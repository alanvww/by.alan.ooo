import { XMBIconName } from './xmb-constants';

export type XMBItemType = 'project' | 'post' | 'profile' | 'link' | 'folder';

export interface XMBProjectMeta {
  tags?: string[];
  date?: string;
  featured?: boolean;
  coverImage?: string;
  excerpt?: string;
  slug?: string;
}

export interface XMBPostMeta {
  tags?: string[];
  date?: string;
  readingTime?: number;
  slug?: string;
}

export type XMBItemMeta = XMBProjectMeta | XMBPostMeta;

export interface XMBItem {
  id: string;
  title: string;
  description: string;
  image?: string;
  link?: string;
  type: XMBItemType;
  /** Menu icon rendered in the row thumbnail slot instead of an image/blank block. */
  icon?: XMBIconName;
  /** Suppresses the right-side XMBPreview panel for simple link chips. */
  hidePreview?: boolean;
  action?: () => void;
  meta?: XMBItemMeta;
  items?: XMBItem[]; // Nested items for folders
}

export interface XMBCategory {
  id: string;
  title: string;
  iconName: XMBIconName;
  items: XMBItem[];
}
