// XMB-styled MDX component map. The source of truth lives in `src/app/mdx-components.tsx`
// (which is also Next.js's MDX integration entry point); this module re-exports it under
// the legacy `xmbMdxComponents` name so existing imports keep working.
export { mdxComponents as xmbMdxComponents } from '@/app/mdx-components'
