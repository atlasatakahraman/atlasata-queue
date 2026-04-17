"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[ErrorBoundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertTriangle className="h-10 w-10 text-destructive/70" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">
        Bir hata oluştu
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Beklenmeyen bir sorun meydana geldi. Lütfen tekrar deneyin.
      </p>
      {error.digest && (
        <p className="mt-1 text-[10px] font-mono text-muted-foreground/50">
          Hata kodu: {error.digest}
        </p>
      )}
      <button
        onClick={() => unstable_retry()}
        className="mt-6 inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Tekrar Dene
      </button>
    </div>
  );
}
