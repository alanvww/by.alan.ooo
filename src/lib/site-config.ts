// src/lib/site-config.ts

export const siteConfig = {
  name: 'alan.ooo',
  author: 'Alan',
  description: 'Design Engineer Portfolio',
  links: {
    github: 'https://github.com/alanvww',
    email: 'mailto:alan.j.ren@pm.me',
  },
  contact: {
    email: 'alan.j.ren@pm.me',
  }
} as const;

export type SiteConfig = typeof siteConfig;
