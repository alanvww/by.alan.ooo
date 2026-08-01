import type { CSSProperties, ReactElement } from 'react';
import Image from 'next/image';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr';
import type { StackGearItem } from '@/lib/stack-and-gear-data';

function StackItem({ item }: { item: StackGearItem }): ReactElement {
  return (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      // active: press acknowledgement — on touch, hover never fires and the
      // native tap highlight is suppressed globally, so this is the only
      // feedback a tap gets. /50 steps past the /40 hover border so mouse
      // presses read too. box-shadow keeps the global focus ring fading.
      className="group flex h-full items-start gap-4 rounded-xl border border-xmb-fg/10 bg-xmb-fg/5 p-4 transition-[color,background-color,border-color,text-decoration-color,box-shadow] hover:border-xmb-fg/40 hover:bg-xmb-fg/10 active:border-xmb-fg/50 active:bg-xmb-fg/15"
    >
      {/* Fixed square tile so non-square logos (some sources are wide
          banners) letterbox consistently; the /10 fill lifts dark marks
          off the frosted backdrop. */}
      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-xmb-fg/10 bg-xmb-fg/10 md:size-14">
        {/* alt="" — the product name sits next to it inside the same link,
            so a non-empty alt would double-announce. */}
        <Image src={item.image} alt="" fill sizes="56px" className="object-contain p-1.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-light tracking-tight text-xmb-fg/90 break-words">
            {item.name}
          </h3>
          <ArrowUpRight
            size={14}
            weight="bold"
            aria-hidden
            className="mt-1 shrink-0 text-xmb-fg/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100"
          />
        </div>
        <p className="mt-1 text-sm font-extralight leading-relaxed text-xmb-fg/60">
          {item.comment}
        </p>
        {item.platforms && item.platforms.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {item.platforms.map((platform) => (
              <span
                key={platform}
                className="rounded border border-xmb-fg/10 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-widest text-xmb-fg/40"
              >
                {platform}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}

export function StackGrid({ items }: { items: StackGearItem[] }): ReactElement {
  return (
    <ul className="stack-reveal my-8 grid list-none grid-cols-1 gap-3 pl-0 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
      {items.map((item, i) => (
        <li
          key={item.name}
          className="min-w-0"
          style={{ '--stagger-i': i } as CSSProperties}
        >
          <StackItem item={item} />
        </li>
      ))}
    </ul>
  );
}
