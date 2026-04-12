"use client";

export function Watermark() {
  return (
    <div className="fixed bottom-4 right-4 z-50 select-none pointer-events-none">
      <span className="text-xs font-medium tracking-[0.35em] text-muted-foreground/25 dark:text-muted-foreground/15">
        atlasata
      </span>
    </div>
  );
}
