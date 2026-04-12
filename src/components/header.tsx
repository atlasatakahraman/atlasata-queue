"use client";

import { signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "./theme-toggle";
import { GithubButton } from "./github-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Swords,
  LogOut,
  Settings,
  Wifi,
  WifiOff,
  Users,
} from "lucide-react";

interface HeaderProps {
  isConnected: boolean;
  isLive: boolean;
  streamTitle: string | null;
  playerCount: number;
  onOpenSettings: () => void;
}

export function Header({
  isConnected,
  isLive,
  streamTitle,
  playerCount,
  onOpenSettings,
}: HeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 glass">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Left — Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
            <Swords className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold tracking-tight sm:text-base">
              AtlasAta Queue
            </h1>
            <Badge
              variant="secondary"
              className="hidden text-[10px] font-medium uppercase tracking-wider sm:inline-flex"
            >
              Şamata
            </Badge>
          </div>
        </div>

        {/* Center — Status Indicators */}
        <div className="hidden items-center gap-4 md:flex">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {isConnected ? (
                  <>
                    <span className="dot-online" />
                    <Wifi className="h-3.5 w-3.5 text-success" />
                    <span>Bağlı</span>
                  </>
                ) : (
                  <>
                    <span className="dot-offline" />
                    <WifiOff className="h-3.5 w-3.5 text-destructive" />
                    <span>Bağlantı Yok</span>
                  </>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isConnected
                  ? "Kick sohbetine bağlı"
                  : "Kick sohbet bağlantısı yok"}
              </p>
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-5" />

          {/* Live Status */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                {isLive ? (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                    </span>
                    <Badge
                      variant="destructive"
                      className="text-[9px] font-bold tracking-wider px-1.5 py-0 h-4 uppercase"
                    >
                      Canlı
                    </Badge>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Çevrimdışı
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {isLive
                  ? streamTitle ?? "Yayın devam ediyor"
                  : "Yayın kapalı"}
              </p>
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-5" />

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>
              {playerCount} oyuncu
            </span>
          </div>
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-1">
          <GithubButton />
          <ThemeToggle />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg"
                onClick={onOpenSettings}
                id="settings-button"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Ayarlar</p>
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-1 h-5" />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 gap-2 rounded-lg px-2"
                id="user-menu-trigger"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={session?.user?.image ?? undefined}
                    alt={session?.user?.name ?? "Kullanıcı"}
                  />
                  <AvatarFallback className="text-[10px] font-medium">
                    {session?.user?.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-xs font-medium sm:inline-block">
                  {session?.user?.name ?? "Kullanıcı"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">
                    {session?.user?.name ?? "Kullanıcı"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Kick Hesabı
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onOpenSettings}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                Ayarlar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Çıkış Yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
