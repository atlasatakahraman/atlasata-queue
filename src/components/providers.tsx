"use client";

import dynamic from "next/dynamic";
import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

const Analytics = dynamic(
  () => import("@vercel/analytics/next").then((m) => m.Analytics),
  { ssr: false }
);
const SpeedInsights = dynamic(
  () => import("@vercel/speed-insights/next").then((m) => m.SpeedInsights),
  { ssr: false }
);

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange={false}
      >
        <TooltipProvider delayDuration={200}>
          <SpeedInsights />
          <Analytics />
          {children}
          <Toaster
            className="select-none"
            position="bottom-center"
            swipeDirections={["bottom"]}
            toastOptions={{
              classNames: {
                toast:
                  "bg-card border-border text-card-foreground shadow-lg backdrop-blur-sm",
                title: "text-foreground font-medium",
                description: "text-muted-foreground",
              },
            }}
            richColors
            expand
          />
        </TooltipProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
