import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const logger = {
  log: (...args: any[]) => {
    if (process.env.NEXT_PUBLIC_DEBUG === "true" || process.env.DEBUG === "true") {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (process.env.NEXT_PUBLIC_DEBUG === "true" || process.env.DEBUG === "true") {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    if (process.env.NEXT_PUBLIC_DEBUG === "true" || process.env.DEBUG === "true") {
      console.error(...args);
    }
  },
};
