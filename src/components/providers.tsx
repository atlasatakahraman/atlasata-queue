"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";

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
          {children}
          <Analytics />
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
