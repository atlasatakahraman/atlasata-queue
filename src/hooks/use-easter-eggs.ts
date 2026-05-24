"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const KONAMI_CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "KeyB",
  "KeyA",
];

const BAD_APPLE_CODE = "badapple";

export function useEasterEggs() {
  const konamiIndex = useRef(0);
  const badAppleBuffer = useRef("");
  const badAppleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showBadApple, setShowBadApple] = useState(false);
  const confettiTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerConfetti = useCallback(() => {
    setShowConfetti(true);
    toast.success("atlasata", {
      description: "↑↑↓↓←→←→BA — Konami Efsanesini buldun.",
      duration: 3000,
    });
    if (confettiTimeout.current) clearTimeout(confettiTimeout.current);
    confettiTimeout.current = setTimeout(() => setShowConfetti(false), 4000);
  }, []);

  const triggerBadApple = useCallback(() => {
    setShowBadApple(true);
  }, []);

  const dismissBadApple = useCallback(() => {
    setShowBadApple(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      // Konami code check
      if (e.code === KONAMI_CODE[konamiIndex.current]) {
        konamiIndex.current++;
        if (konamiIndex.current === KONAMI_CODE.length) {
          konamiIndex.current = 0;
          triggerConfetti();
        }
      } else {
        konamiIndex.current = e.code === KONAMI_CODE[0] ? 1 : 0;
      }

      // Bad Apple code check (type "badapple")
      const key = e.key.toLowerCase();
      if (key.length === 1 && /[a-z]/.test(key)) {
        badAppleBuffer.current += key;
        // Keep only last N characters
        if (badAppleBuffer.current.length > BAD_APPLE_CODE.length) {
          badAppleBuffer.current = badAppleBuffer.current.slice(
            -BAD_APPLE_CODE.length,
          );
        }
        if (badAppleBuffer.current === BAD_APPLE_CODE) {
          badAppleBuffer.current = "";
          triggerBadApple();
        }
        // Reset buffer after 2s of no typing
        if (badAppleTimeout.current) clearTimeout(badAppleTimeout.current);
        badAppleTimeout.current = setTimeout(() => {
          badAppleBuffer.current = "";
        }, 2000);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (confettiTimeout.current) clearTimeout(confettiTimeout.current);
      if (badAppleTimeout.current) clearTimeout(badAppleTimeout.current);
    };
  }, [triggerConfetti, triggerBadApple]);

  return { showConfetti, showBadApple, dismissBadApple };
}
