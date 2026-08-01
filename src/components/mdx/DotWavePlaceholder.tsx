const COLS = 12;
const ROWS = 7;

/**
 * Dot-grid wave shown while an image loads — a nod to the XMB's flowing
 * background. Each dot runs the same keyframe with a phase offset derived
 * from its grid position, producing a diagonal traveling wave. Pure CSS
 * animation (transform/opacity), disabled under prefers-reduced-motion.
 */
export function DotWavePlaceholder({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`dot-wave-grid grid place-items-center overflow-hidden text-xmb-fg ${className ?? ''}`}
      style={{
        gridTemplateColumns: `repeat(${COLS}, 1fr)`,
        gridTemplateRows: `repeat(${ROWS}, 1fr)`,
      }}
    >
      {Array.from({ length: COLS * ROWS }, (_, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        return (
          <span
            key={i}
            className="dot-wave-dot"
            style={{ animationDelay: `${(col * 0.09 + row * 0.035).toFixed(3)}s` }}
          />
        );
      })}
    </div>
  );
}
