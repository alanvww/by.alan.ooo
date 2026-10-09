// src/components/xmb/XMBPreview.tsx
import React from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import type { XMBItem } from '@/lib/xmb-types';
import { XMB_ANIMATION, EASE } from '@/lib/xmb-constants';

interface XMBPreviewProps {
  item: XMBItem;
}

const isUnoptimizedImage = (src: string): boolean =>
  !src.startsWith('/') || src.startsWith('//') || /\.(svg|gif)($|[?#])/i.test(src);

const XMBPreview = ({ item }: XMBPreviewProps) => {
  const unoptimized = item.image ? isUnoptimizedImage(item.image) : false;
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      // Exit is an opacity-only fast tween (quicker than the shared TWEEN):
      // this subtree holds a full-viewport blurred backdrop, and animating
      // it out concurrently with a category switch's own motion causes jank.
      exit={{ opacity: 0, transition: { duration: 0.13, ease: EASE.EXIT } }}
      transition={XMB_ANIMATION.TWEEN}
      // Visual echo of the already-announced selected item: hiding it from AT
      // removes the duplicate reading AND the stale ghost that lingers in the
      // tree during the AnimatePresence exit animation.
      aria-hidden="true"
      className="absolute inset-0 z-10 pointer-events-none"
    >
      {/* Background Dim/Blur */}
      {item.image && (
          <div className="absolute inset-0 z-0">
              <Image
                src={item.image}
                alt=""
                fill
                sizes="100vw"
                unoptimized={unoptimized}
                className="object-cover opacity-20 blur-2xl scale-110"
              />
              <div className="absolute inset-0 dark:bg-black/60 bg-white/20" />
          </div>
      )}

      <div className="relative h-full flex flex-col md:flex-row items-center justify-center md:justify-end px-6 md:px-[10%] gap-8 md:gap-12">
        {/* Cover Image */}
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.04, ...XMB_ANIMATION.TWEEN }}
            // relative: the containing block for the next/image fill cover.
            // The permanent willChange hint that used to sit here was
            // accidentally serving that role — motion promotes layers on its
            // own while the springs run, so the hint itself was pure cost.
            className="relative w-full max-w-[450px] aspect-video bg-xmb-fg/5 rounded-xl overflow-hidden border border-xmb-fg/25 shadow-[0_0_50px_var(--color-xmb-shadow-glow)]"
        >
            {item.image ? (
                <>
                    <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 450px"
                        unoptimized={unoptimized}
                        className="object-cover"
                    />
                    <div className="absolute inset-0 ring-1 ring-inset ring-xmb-fg/15 rounded-xl pointer-events-none" />
                </>
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-xmb-fg/5">
                    <span className="text-xmb-fg/20 font-mono">NO PREVIEW</span>
                </div>
            )}
        </motion.div>

        {/* Info */}
        <div className="w-full max-w-[400px] flex flex-col gap-4 md:gap-6 text-center md:text-left">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, ...XMB_ANIMATION.TWEEN }}
            >
                <h2 className="text-3xl md:text-5xl font-extralight tracking-tight text-xmb-fg drop-shadow-[0_0_12px_color-mix(in_srgb,var(--color-xmb-fg)_25%,transparent)]">
                    {item.title}
                </h2>
                <div className="mt-3 w-20 md:w-28 h-px bg-linear-to-r from-transparent via-xmb-fg/45 to-transparent md:from-xmb-fg/50 md:via-xmb-fg/25 md:to-transparent mx-auto md:mx-0" />
            </motion.div>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, ...XMB_ANIMATION.TWEEN }}
                className="text-lg md:text-xl text-xmb-fg/70 font-light leading-relaxed line-clamp-3 md:line-clamp-4"
            >
                {item.description}
            </motion.p>

            {item.meta?.tags && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.16, duration: 0.2, ease: EASE.ENTER }}
                    className="flex flex-wrap justify-center md:justify-start gap-2"
                >
                    {(item.meta.tags as string[]).map((tag: string) => (
                        <span key={tag} className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 bg-xmb-fg/10 rounded border border-xmb-fg/10">
                            {tag}
                        </span>
                    ))}
                </motion.div>
            )}
        </div>
      </div>
    </motion.div>
  );
};

export default XMBPreview;
