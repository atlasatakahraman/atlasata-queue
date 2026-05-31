"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/hooks/use-settings";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Monitor, Gamepad2, Settings2, TerminalSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { GameTeamSettings } from "@/components/settings/game-team-settings";
import { ApiConnectionSettings } from "@/components/settings/api-connection-settings";
import { CommandSystemSettings } from "@/components/settings/command-system-settings";

export default function SettingsPage() {
  const router = useRouter();
  const { settings, updateSettings, isLoading } = useSettings();
  const [activeTab, setActiveTab] = useState("appearance");
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | "">("");

  const handleTabChange = (value: string) => {
    const tabs = ["appearance", "game", "api", "commands"];
    const currentIndex = tabs.indexOf(activeTab);
    const nextIndex = tabs.indexOf(value);

    setSlideDirection(nextIndex > currentIndex ? "right" : "left");
    setActiveTab(value);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 animate-slide-down-fade">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Ayarlar</h1>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className={
              slideDirection === "right"
                ? "slide-from-right"
                : slideDirection === "left"
                  ? "slide-from-left"
                  : ""
            }
          >
            <TabsList variant="underline" className="mb-6 w-full sm:w-auto">
              <TabsTrigger
                value="appearance"
                className="gap-2 shrink-0"
              >
                <Monitor className="h-4 w-4" />
                Görünüm
              </TabsTrigger>
              <TabsTrigger
                value="game"
                className="gap-2 shrink-0"
              >
                <Gamepad2 className="h-4 w-4" />
                Oyun & Takım
              </TabsTrigger>
              <TabsTrigger
                value="api"
                className="gap-2 shrink-0"
              >
                <Settings2 className="h-4 w-4" />
                API & Bağlantılar
              </TabsTrigger>
              <TabsTrigger
                value="commands"
                className="gap-2 shrink-0"
              >
                <TerminalSquare className="h-4 w-4" />
                Komutlar & Sistem
              </TabsTrigger>
            </TabsList>

            <div className="w-full">
              <TabsContent value="appearance" className="mt-0 border-none outline-none">
                <AppearanceSettings settings={settings} onUpdateSettings={updateSettings} />
              </TabsContent>
              <TabsContent value="game" className="mt-0 border-none outline-none">
                <GameTeamSettings settings={settings} onUpdateSettings={updateSettings} />
              </TabsContent>
              <TabsContent value="api" className="mt-0 border-none outline-none">
                <ApiConnectionSettings settings={settings} onUpdateSettings={updateSettings} />
              </TabsContent>
              <TabsContent value="commands" className="mt-0 border-none outline-none">
                <CommandSystemSettings settings={settings} onUpdateSettings={updateSettings} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
