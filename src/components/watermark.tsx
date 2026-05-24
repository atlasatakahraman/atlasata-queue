"use client";

import { useCallback, useRef, useState } from "react";

export function Watermark() {
  const [revealed, setRevealed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    timerRef.current = setTimeout(() => {
      setRevealed(true);
    }, 3000);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // Keep revealed once found
  }, []);

  return (
    <footer
      className="py-3 text-center text-[10px] text-muted-foreground/50 tracking-wider uppercase cursor-default select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="transition-all duration-700">
        {revealed ? (
          <span className="animate-in fade-in duration-1000">
            * Hey! — Sen de firarda mısın? *
          </span>
        ) : (
          "Atlas Ata KAHRAMAN"
        )}
      </span>
    </footer>
  );
}
