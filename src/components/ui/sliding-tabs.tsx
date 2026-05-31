"use client";

import React, { useEffect, useRef, useState } from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface SlidingTabsListProps extends React.ComponentPropsWithoutRef<typeof TabsList> {
  children: React.ReactNode;
  activeValue: string;
}

export function SlidingTabsList({ className, children, activeValue, ...props }: SlidingTabsListProps) {
  const isIndicatorFirst = useRef(true);
  const [tabsListRef, setTabsListRef] = useState<HTMLDivElement | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({
    position: "absolute",
    opacity: 0,
  });

  useEffect(() => {
    const tabsList = tabsListRef;
    if (!tabsList) return;

    const updateIndicator = () => {
      const activeTrigger = tabsList.querySelector(
        '[data-state="active"]',
      ) as HTMLElement;
      if (!activeTrigger) return;

      const parentRect = tabsList.getBoundingClientRect();
      const activeRect = activeTrigger.getBoundingClientRect();

      setIndicatorStyle({
        position: "absolute",
        left: `${activeRect.left - parentRect.left}px`,
        top: `${activeRect.top - parentRect.top}px`,
        width: `${activeRect.width}px`,
        height: `${activeRect.height}px`,
        opacity: 1,
        transition: isIndicatorFirst.current
          ? "none"
          : "all 300ms cubic-bezier(0.16, 1, 0.3, 1)",
      });
    };

    updateIndicator();
    const frameId = requestAnimationFrame(updateIndicator);
    const timeoutId = setTimeout(updateIndicator, 50);

    const skipTimer = setTimeout(() => {
      isIndicatorFirst.current = false;
    }, 200);

    const resizeObserver = new ResizeObserver(updateIndicator);
    resizeObserver.observe(tabsList);

    tabsList
      .querySelectorAll('[data-slot="tabs-trigger"]')
      .forEach((trigger) => {
        resizeObserver.observe(trigger);
      });

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timeoutId);
      clearTimeout(skipTimer);
      resizeObserver.disconnect();
    };
  }, [tabsListRef, activeValue]);

  return (
    <TabsList
      ref={setTabsListRef}
      className={cn("relative flex bg-muted/50 p-1 sliding-tabs", className)}
      {...props}
    >
      <div
        className="absolute rounded-md bg-background shadow-sm dark:bg-input/40 pointer-events-none"
        style={indicatorStyle}
      />
      {children}
    </TabsList>
  );
}
