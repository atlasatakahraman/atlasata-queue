"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Trash2,
  Shuffle,
  Dices,
  Settings,
  Sun,
  Moon,
  RefreshCw,
  Users,
  RefreshCcw,
  AppWindow,
  AppWindowMacIcon,
  RefreshCwOff,
  RefreshCcwDot,
  AppWindowIcon,
  UserPlus,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

interface GlobalContextMenuProps {
  children: React.ReactNode;
  playerCount: number;
  onClearQueue: () => void;
  onRandomize: () => void;
  onSinglePick: () => void;
  onOpenSettings: () => void;
  onReconnect: () => void;
  onManualAddRequest?: () => void;
  isTeamsCreated?: boolean;
}

export function GlobalContextMenu({
  children,
  playerCount,
  onClearQueue,
  onRandomize,
  onSinglePick,
  onOpenSettings,
  onReconnect,
  onManualAddRequest,
  isTeamsCreated = true,
}: GlobalContextMenuProps) {
  const { theme, setTheme } = useTheme();

  const router = useRouter();

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild className="outline-none">
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56" id="global-context-menu">
        <ContextMenuLabel className="flex items-center gap-2 text-xs">
          <Users className="h-3.5 w-3.5" />
          Sıra Yönetimi ({playerCount} oyuncu)
        </ContextMenuLabel>
        <ContextMenuSeparator />

        {onManualAddRequest && (
          <>
            <ContextMenuItem
              onClick={onManualAddRequest}
              className="cursor-pointer"
            >
              <UserPlus className="mr-2 h-4 w-4 text-emerald-500" />
              Yeni Oyuncu Ekle
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        <ContextMenuItem
          onClick={onRandomize}
          disabled={playerCount < 2 || !isTeamsCreated}
          className="cursor-pointer"
          id="ctx-randomize"
        >
          <Shuffle className="mr-2 h-4 w-4" />
          Takımları Karıştır
          <ContextMenuShortcut>⌘R</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={onSinglePick}
          disabled={playerCount === 0}
          className="cursor-pointer"
          id="ctx-single-pick"
        >
          <Dices className="mr-2 h-4 w-4" />
          Tek Oyuncu Çek
          <ContextMenuShortcut>⌘P</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem
          onClick={onClearQueue}
          disabled={playerCount === 0}
          className="cursor-pointer text-destructive focus:text-destructive"
          id="ctx-clear-queue"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Sırayı Temizle
          <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem
          onClick={onReconnect}
          className="cursor-pointer"
          id="ctx-reconnect"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Sohbete Yeniden Bağlan
        </ContextMenuItem>

        <ContextMenuItem
          onClick={onOpenSettings}
          className="cursor-pointer"
          id="ctx-settings"
        >
          <Settings className="mr-2 h-4 w-4" />
          Ayarlar
          <ContextMenuShortcut>⌘,</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="cursor-pointer"
          id="ctx-theme-toggle"
        >
          {theme === "dark" ? (
            <Sun className="mr-2 h-4 w-4" />
          ) : (
            <Moon className="mr-2 h-4 w-4" />
          )}
          {theme === "dark" ? "Açık Tema" : "Koyu Tema"}
          <ContextMenuShortcut>⌘T</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => window.location.reload()}
          className="cursor-pointer"
          id="ctx-refresh-page"
        >
          <AppWindowIcon className="mr-2 h-4 w-4" />
          Sayfayı Yenile
          <ContextMenuShortcut>⌘R</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
