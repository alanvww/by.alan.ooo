// src/lib/stack-and-gear-data.ts
// Content for /stack-and-gear, migrated from the legacy portfolio's Sanity
// dataset (legacy.alan.ooo/tech-and-gear). Edit the arrays below to add,
// remove, or reword items — images live in public/stack-and-gear/.

export type Platform = 'Mac' | 'Win' | 'iOS' | 'Android' | 'Web' | 'Other';

export interface StackGearItem {
  name: string;
  /** One-line comment shown under the name. */
  comment: string;
  /** File in public/stack-and-gear/, e.g. '/stack-and-gear/arc.png'. */
  image: string;
  /** External product URL. */
  href: string;
  /** Platform availability chips — software only; gear omits it. */
  platforms?: Platform[];
}

export const STACK_ITEMS = [
  {
    name: 'Arc',
    comment: 'Awesome chromium-based browser.',
    image: '/stack-and-gear/arc.png',
    href: 'https://arc.net/',
    platforms: ['Mac', 'Win', 'iOS', 'Android'],
  },
  {
    name: 'Bitwarden',
    comment: 'Great password manager with good price.',
    image: '/stack-and-gear/bitwarden.png',
    href: 'https://bitwarden.com/',
    platforms: ['Win', 'iOS', 'Android', 'Web'],
  },
  {
    name: 'Claude',
    comment: 'Not OpenAI.',
    image: '/stack-and-gear/claude.png',
    href: 'https://claude.ai/',
    platforms: ['Mac', 'Win', 'iOS', 'Android', 'Web', 'Other'],
  },
  {
    name: 'Cline',
    comment: 'Extension that turbocharges your coding with AI superpowers.',
    image: '/stack-and-gear/cline.png',
    href: 'https://cline.bot/',
    platforms: ['Mac', 'Win', 'Web', 'Other'],
  },
  {
    name: 'Ente Photos',
    comment: 'Where your memories live, encrypted and organized.',
    image: '/stack-and-gear/ente-photos.png',
    href: 'https://ente.io/',
    platforms: ['Mac', 'Win', 'iOS', 'Android', 'Web'],
  },
  {
    name: 'Feedbin',
    comment: 'RSS sanctuary that brings the best of the web to one peaceful place.',
    image: '/stack-and-gear/feedbin.png',
    href: 'https://feedbin.com/',
    platforms: ['Mac', 'iOS', 'Web'],
  },
  {
    name: 'Figma',
    comment: 'Design playground where ideas flow effortlessly from brain to screen.',
    image: '/stack-and-gear/figma.png',
    href: 'https://www.figma.com/',
    platforms: ['Mac', 'Win', 'Web'],
  },
  {
    name: 'Firefox Developer Edition',
    comment: "For when you need to see a website's deepest secrets.",
    image: '/stack-and-gear/firefox-developer-edition.png',
    href: 'https://www.mozilla.org/en-US/firefox/developer/',
    platforms: ['Mac', 'Win'],
  },
  {
    name: 'Ghostty',
    comment: 'Terminal emulator so fast and sleek it feels supernatural.',
    image: '/stack-and-gear/ghostty.png',
    href: 'https://ghostty.org/',
    platforms: ['Mac', 'Web', 'Other'],
  },
  {
    name: 'Google Gemini',
    comment: 'Multimodal brainiac that sees the world through your lens.',
    image: '/stack-and-gear/google-gemini.png',
    href: 'https://gemini.google.com/',
    platforms: ['iOS', 'Android', 'Web'],
  },
  {
    name: 'Logseq',
    comment: 'Knowledge garden where your thoughts grow connections organically.',
    image: '/stack-and-gear/logseq.png',
    href: 'https://logseq.com/',
    platforms: ['Mac', 'Win', 'iOS', 'Android', 'Web', 'Other'],
  },
  {
    name: 'OBS',
    comment: 'Streaming magic without the technical headaches.',
    image: '/stack-and-gear/obs.png',
    href: 'https://obsproject.com/',
    platforms: ['Mac', 'Win'],
  },
  {
    name: 'Obsidian',
    comment: 'Where notes go to connect and become knowledge galaxies.',
    image: '/stack-and-gear/obsidian.png',
    href: 'https://obsidian.md/',
    platforms: ['Mac', 'Win'],
  },
  {
    name: 'Pocket Casts',
    comment: 'Podcast companion that makes commutes fly by.',
    image: '/stack-and-gear/pocket-casts.png',
    href: 'https://pocketcasts.com/',
    platforms: ['Mac', 'Win', 'iOS', 'Android', 'Web'],
  },
  {
    name: 'Proton Mail',
    comment: 'Emails so private even you might forget what you wrote.',
    image: '/stack-and-gear/proton-mail.png',
    href: 'https://proton.me/mail',
    platforms: ['Mac', 'Win', 'iOS', 'Android', 'Web', 'Other'],
  },
  {
    name: 'Raycast',
    comment: 'Spotlight on steroids that speeds up everything you do.',
    image: '/stack-and-gear/raycast.png',
    href: 'https://www.raycast.com/',
    platforms: ['Mac'],
  },
  {
    name: 'Rive',
    comment: "Interactive animations that dance to your code's tune.",
    image: '/stack-and-gear/rive.png',
    href: 'https://rive.app/',
    platforms: ['Mac', 'Win'],
  },
  {
    name: 'RunCat',
    comment: 'Tiny menu bar pet that works harder when your CPU does.',
    image: '/stack-and-gear/runcat.png',
    href: 'https://kyome.io/runcat/index.html?lang=en',
    platforms: ['Mac', 'Win'],
  },
  {
    name: 'Tailscale',
    comment: 'VPN so simple it feels like cheating.',
    image: '/stack-and-gear/tailscale.png',
    href: 'https://tailscale.com/',
    platforms: ['Mac', 'Win', 'iOS', 'Android', 'Other'],
  },
  {
    name: 'Unreal',
    comment: 'Ridiculously photorealistic engine that makes your GPU sweat.',
    image: '/stack-and-gear/unreal.png',
    href: 'https://www.unrealengine.com/',
    platforms: ['Mac', 'Win'],
  },
  {
    name: 'VSCode',
    comment: 'The text editor that somehow reads your mind.',
    image: '/stack-and-gear/vscode.png',
    href: 'https://code.visualstudio.com/',
    platforms: ['Mac', 'Win', 'Web', 'Other'],
  },
] satisfies StackGearItem[];

export const GEAR_ITEMS = [
  {
    name: '360 Traveler',
    comment: 'Drink from 360°.',
    image: '/stack-and-gear/360-traveler.png',
    href: 'https://www.miir.com/',
  },
  {
    name: 'City Pack Pro',
    comment: "Urban explorer's perfect companion with pockets for everything.",
    image: '/stack-and-gear/city-pack-pro.png',
    href: 'https://aersf.com/',
  },
  {
    name: 'HD 660 S',
    comment: 'Open-back headphones that reveal details in music you never knew existed.',
    image: '/stack-and-gear/hd-660-s.png',
    href: 'https://www.sennheiser-hearing.com/en-US/p/hd-660s/',
  },
  {
    name: 'Legion 7 Pro',
    comment: 'Gaming beast disguised as a professional laptop.',
    image: '/stack-and-gear/legion-7-pro.png',
    href: 'https://www.lenovo.com/us/en/legion/',
  },
  {
    name: 'Logitech G PRO X SUPERLIGHT',
    comment: 'Mouse so responsive it feels like an extension of your thoughts.',
    image: '/stack-and-gear/logitech-g-pro-x-superlight.png',
    href: 'https://www.logitechg.com/en-us/products/gaming-mice/pro-x-superlight-wireless-mouse.html',
  },
  {
    name: 'MacBook Pro 14 (2023)',
    comment: "Silent powerhouse that's always cool under pressure.",
    image: '/stack-and-gear/macbook-pro-14-2023.png',
    href: 'https://www.apple.com/',
  },
  {
    name: 'Meta Quest 3',
    comment: 'Portal to virtual worlds that lives on your nightstand.',
    image: '/stack-and-gear/meta-quest-3.png',
    href: 'https://www.meta.com/quest/',
  },
  {
    name: 'Pixel 9 Fold',
    comment: 'Pocket-sized tablet that transforms like sci-fi made real.',
    image: '/stack-and-gear/pixel-9-fold.png',
    href: 'https://store.google.com/category/phones?hl=en-US',
  },
  {
    name: 'Steam Deck',
    comment: 'Entire gaming library that fits in a backpack.',
    image: '/stack-and-gear/steam-deck.png',
    href: 'https://store.steampowered.com/steamdeck/',
  },
] satisfies StackGearItem[];
