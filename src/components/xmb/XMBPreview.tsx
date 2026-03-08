// src/components/xmb/XMBPreview.tsx
import React from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import type { XMBItem } from '@/lib/xmb-types';
import { XMB_ANIMATION } from '@/lib/xmb-constants';

interface XMBPreviewProps {
  item: XMBItem;
}

const XMBPreview = ({ item }: XMBPreviewProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={XMB_ANIMATION.SPRING_CONFIG}
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
              <div className="absolute inset-0 bg-black/60" />
          </div>
      )}

      <div className="relative h-full flex flex-col md:flex-row items-center justify-center md:justify-end px-6 md:px-[10%] gap-8 md:gap-12">
        {/* Cover Image */}
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, ...XMB_ANIMATION.SPRING_CONFIG }}
            className="w-full max-w-[450px] aspect-video bg-white/5 rounded-lg overflow-hidden border-2 border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)]"
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
                <div className="w-full h-full flex items-center justify-center bg-white/5">
                    <span className="text-white/20 font-mono">NO PREVIEW</span>
                </div>
            )}
        </motion.div>

        {/* Info */}
        <div className="w-full max-w-[400px] flex flex-col gap-4 md:gap-6 text-center md:text-left">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, ...XMB_ANIMATION.SPRING_CONFIG }}
            >
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white drop-shadow-lg">
                    {item.title}
                </h2>
                <div className="mt-2 w-16 md:w-24 h-1 bg-white/40 rounded-full mx-auto md:mx-0" />
            </motion.div>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, ...XMB_ANIMATION.SPRING_CONFIG }}
                className="text-lg md:text-xl text-white/70 font-light leading-relaxed line-clamp-3 md:line-clamp-4"
            >
                {item.description}
            </motion.p>

            {item.meta?.tags && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35, duration: 0.3 }}
                    className="flex flex-wrap justify-center md:justify-start gap-2"
                >
                    {(item.meta.tags as string[]).map((tag: string) => (
                        <span key={tag} className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 bg-white/10 rounded border border-white/10">
                            {tag}
                        </span>
                    ))}
                </motion.div>
            )}
        </div>
      </div>

      {/* Selector Glow Effect - Hidden on mobile if needed, or moved */}
      <div className="hidden md:block absolute left-[15%] top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full blur-md animate-pulse shadow-[0_0_20px_white]" />
    </motion.div>
  );
};

export default XMBPreview;
