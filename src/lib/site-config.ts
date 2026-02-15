// src/lib/site-config.ts

export const siteConfig = {
  name: 'alan.ooo',
  author: 'Alan',
  description: 'Design Engineer Portfolio',
  links: {
    github: 'https://github.com/alan-ooo',
    twitter: 'https://twitter.com/alan_ooo',
    email: 'hello@alan.ooo',
  },
  contact: {
    email: 'hello@alan.ooo',
  }
} as const;

export type SiteConfig = typeof siteConfig;
