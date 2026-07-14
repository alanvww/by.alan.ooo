import type { Metadata } from 'next';
import XMBContentLayout from '@/components/xmb/XMBContentLayout';
import XMBPostFrame from '@/components/xmb/XMBPostFrame';
import { STACK_ITEMS, GEAR_ITEMS } from '@/lib/stack-and-gear-data';
import { StackGrid } from './StackCards';

export const metadata: Metadata = {
  title: 'Stack & Gear',
  description: 'The software stack and everyday gear behind Alan Yam’s work.',
};

const SECTION_HEADING_CLASS =
  'text-2xl md:text-3xl font-light text-xmb-fg/90 mb-3 mt-10 first:mt-0 tracking-tight';
const SECTION_INTRO_CLASS = 'text-base font-light text-xmb-fg/60';

export default function StackAndGearPage(): React.ReactElement {
  // Standalone document like /cv, but data-driven: items live in
  // src/lib/stack-and-gear-data.ts instead of MDX, so editing an entry is a
  // one-line change and the page stays a pure RSC.
  return (
    <XMBContentLayout>
      <XMBPostFrame>
        <div className="absolute inset-0 flex flex-col overflow-hidden">
          {/* Scrollable Content — a real tab stop (2.1.1): there is no keydown
              handler on this page, so a focusable scroll region is the ONLY
              way keyboard users can scroll the list (native arrow/page keys).
              Its Tab-focus hairline lives in globals.css (the
              [role="region"][tabindex] rule) so the silent-focus gate can
              suppress it — utilities here would out-cascade the gate. */}
          <div
            tabIndex={0}
            role="region"
            aria-label="Stack and gear content"
            className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pt-32 pb-48 px-6 scroll-smooth motion-reduce:scroll-auto select-text"
          >
            {/* Wider than the CV page's max-w-4xl: the card grid needs the
                room — at 4xl a 3-column cell is ~285px and chips crowd. */}
            <div className="max-w-6xl mx-auto">
              {/* Header Section */}
              <header className="mb-16 text-center">
                <div className="flex items-center justify-center gap-4 mb-8">
                  <span className="px-3 py-1 rounded-lg border border-xmb-fg/10 bg-xmb-fg/5 text-[10px] font-mono uppercase tracking-widest text-xmb-fg/40">
                    Stack &amp; Gear
                  </span>
                </div>

                <h1 className="text-4xl md:text-7xl font-extralight tracking-tight mb-8 leading-tight">
                  What I use
                </h1>

                <p className="text-lg md:text-xl font-extralight text-xmb-fg/50">
                  The software and hardware behind my daily work.
                </p>
              </header>

              <section>
                <h2 className={SECTION_HEADING_CLASS}>Stack</h2>
                <p className={SECTION_INTRO_CLASS}>
                  Essential software and digital tools that power my workflow
                  and development process.
                </p>
                <StackGrid items={STACK_ITEMS} />
              </section>

              <section>
                <h2 className={SECTION_HEADING_CLASS}>Gear</h2>
                <p className={SECTION_INTRO_CLASS}>
                  Physical equipment and devices I rely on daily for
                  productivity and creation.
                </p>
                <StackGrid items={GEAR_ITEMS} />
              </section>
            </div>
          </div>
        </div>
      </XMBPostFrame>
    </XMBContentLayout>
  );
}
