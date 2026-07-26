// src/lib/site-config.ts

export const siteConfig = {
  name: 'alan.ooo',
  url: 'https://alan.ooo',
  author: 'Alan Yam',
  description: 'Portfolio of Alan Yam — creative technologist and design engineer.',
  links: {
    github: 'https://github.com/alanvww',
    email: 'mailto:alan.j.ren@pm.me',
    instagram: 'https://www.instagram.com/alan.k.y',
    mastodon: 'https://mas.to/@alanvww',
    bluesky: 'https://bsky.app/profile/alan.ooo',
    linkedin: 'https://www.linkedin.com/in/alanyam/',
    x: 'https://x.com/alanvww',
    resume: 'https://link.alan.ooo/resume',
  },
  contact: {
    email: 'alan.j.ren@pm.me',
  }
} as const;

export type SiteConfig = typeof siteConfig;
