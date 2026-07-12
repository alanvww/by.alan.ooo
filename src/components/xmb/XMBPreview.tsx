// src/components/xmb/XMBPreview.tsx
import React from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import type { XMBItem } from '@/lib/xmb-types';
import { XMB_ANIMATION, EASE } from '@/lib/xmb-constants';

interface XMBPreviewProps {
  item: XMBItem;
}

const XMBPreview = ({ item }: XMBPreviewProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      // Exit is an opacity-only fast tween (not the shared spring): this
      // subtree holds a full-viewport blurred backdrop, and springing it
      // out concurrently with a category switch's own springs causes jank.
      exit={{ opacity: 0, transition: { duration: 0.13, ease: EASE.EXIT } }}
      transition={XMB_ANIMATION.SPRING_CONFIG}
      // Visual echo of the already-announced selected item: hiding it from AT
      // removes the duplicate reading AND the stale ghost that lingers in the
      // tree during the AnimatePresence exit animation.
      aria-hidden="true"
      className="absolute inset-0 z-10 pointer-events-none"
      style={{ willChange: 'transform, opacity' }}
    >
      {/* Background Dim/Blur */}
      {item.image && (
          <div className="absolute inset-0 z-0">
              <Image
                src={item.image}
                alt=""
                fill
                sizes="100vw"
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
            transition={{ delay: 0.05, ...XMB_ANIMATION.SPRING_CONFIG }}
            className="w-full max-w-[450px] aspect-video bg-xmb-fg/5 rounded-lg overflow-hidden border-2 border-xmb-fg/20 shadow-[0_0_50px_var(--color-xmb-shadow-glow)]"
            style={{ willChange: 'transform, opacity' }}
        >
            {item.image ? (
                <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 450px"
                    className="object-cover"
                />
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
                transition={{ delay: 0.08, ...XMB_ANIMATION.SPRING_CONFIG }}
            >
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-xmb-fg drop-shadow-lg">
                    {item.title}
                </h2>
                <div className="mt-2 w-16 md:w-24 h-1 bg-xmb-fg/40 rounded-full mx-auto md:mx-0" />
            </motion.div>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, ...XMB_ANIMATION.SPRING_CONFIG }}
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

      {/* Selector Glow Effect - Hidden on mobile if needed, or moved */}
      <div className="hidden md:block absolute left-[15%] top-1/2 -translate-y-1/2 w-4 h-4 bg-xmb-fg rounded-full blur-md animate-pulse shadow-[0_0_20px_var(--color-xmb-glow)]" />
    </motion.div>
  );
};

export default XMBPreview;
