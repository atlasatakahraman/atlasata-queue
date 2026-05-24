"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { X } from "lucide-react";

interface BadAppleOverlayProps {
  active: boolean;
  onDismiss: () => void;
}

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export function BadAppleOverlay({ active, onDismiss }: BadAppleOverlayProps) {
  const [isExiting, setIsExiting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 450); // Match 450ms transition
  }, [onDismiss]);

  useEffect(() => {
    if (!active) {
      setIsExiting(false);
      return;
    }

    // Force focus to parent document body to steal focus back from iframe if needed
    window.focus();
    if (containerRef.current) {
      containerRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleDismiss();
      }
    };

    // Use capture phase to intercept the key before YouTube iframe or other inputs eat it
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [active, handleDismiss]);

  if (!active) return null;

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md outline-none transition-all duration-[450ms] cubic-bezier(0.16, 1, 0.3, 1)"
      style={{
        opacity: isExiting ? 0 : 1,
        backdropFilter: isExiting ? "blur(0px)" : "blur(12px)",
      }}
      onClick={handleDismiss}
    >
      {/* Container */}
      <div
        className="relative w-full max-w-4xl px-4 flex flex-col items-center gap-4 transition-all duration-[450ms] cubic-bezier(0.16, 1, 0.3, 1)"
        style={{
          transform: isExiting ? "scale(0.9) translateY(20px)" : "scale(1) translateY(0px)",
          opacity: isExiting ? 0 : 1,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="w-full flex items-center justify-between text-white/90">
          <div className="flex items-center gap-2">
            <YoutubeIcon className="h-5 w-5 text-red-500 animate-pulse" />
            <span className="font-semibold text-base tracking-wider uppercase font-sans">
              Bad Apple!! 🍎
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-all outline-none focus:ring-1 focus:ring-red-500"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Video Wrapper */}
        <div className="w-full aspect-video rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-black/80 bg-black">
          <iframe
            src="https://www.youtube.com/embed/FtutLA63Cp8?autoplay=1&rel=0&modestbranding=1"
            title="Bad Apple!!"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full"
          />
        </div>

        {/* Footer Hint */}
        <p className="text-[11px] text-white/40 tracking-wider">
          Kapatmak için ESC tuşuna basabilir veya dışarıya tıklayabilirsiniz
        </p>
      </div>
    </div>
  );
}
