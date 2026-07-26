import React from 'react';
import XMBClock from './XMBClock';
import XMBProgressIndicator from './XMBProgressIndicator';

const XMBHeader = () => {
  return (
    <header className="absolute top-[max(2rem,env(safe-area-inset-top))] inset-x-0 px-6 md:px-12 z-20 pointer-events-auto">
      {/* Clock and progress are direct flex children (no wrapper group) so
          each wraps independently: a wrapper's min-content width (the fixed
          ~233px progress bar) would reserve space on the title's row even
          when the bar visually wraps below, clipping narrow screens.
          items-start keeps the title's text line level with the clock's on
          phones (both share the same text-lg line box); sm:items-center
          restores the single centered row once everything fits. justify-end
          right-aligns wrapped rows; mr-auto on the title pins it left. */}
      <div className="flex flex-wrap items-start justify-end gap-x-3 gap-y-2 sm:items-center md:gap-x-6 text-lg md:text-2xl font-light opacity-80 tracking-wide">
        <div className="mr-auto">alan.ooo</div>
        <XMBClock />
        <XMBProgressIndicator />
      </div>
    </header>
  );
};

export default XMBHeader;
