"use client";

import React from "react";
import type { QueuePlayer } from "@/types";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Copy,
  Gamepad2,
  Pencil,
  Trash2,
  Coffee,
  UserCheck,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { toast } from "sonner";

interface PlayerContextMenuProps {
  player: QueuePlayer;
  children: React.ReactNode;
  disableRiotApi?: boolean;
  onUpdatePlayer: (id: string, data: Partial<QueuePlayer>) => void;
  onRemovePlayer: (id: string) => void;
  onAddToTeam?: (id: string, team: "A" | "B") => void;
  onRemoveFromTeam?: (id: string) => void;
  isTeamsCreated?: boolean;
  onCreateTeamsRequest?: (playerId: string, teamId: "A" | "B") => void;
  onEditPlayer?: (player: QueuePlayer) => void;
}

const PlayerContextMenuInner = function PlayerContextMenu({
  player,
  children,
  disableRiotApi = false,
  onUpdatePlayer,
  onRemovePlayer,
  onAddToTeam,
  onRemoveFromTeam,
  isTeamsCreated = false,
  onCreateTeamsRequest,
  onEditPlayer,
}: PlayerContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuLabel className="text-xs truncate">
          {player.riotGameName}#{player.riotTagLine}
        </ContextMenuLabel>
        <ContextMenuSeparator />
        {!disableRiotApi && (
          <ContextMenuItem
            className="cursor-pointer"
            onClick={() => {
              navigator.clipboard.writeText(
                `${player.riotGameName}#${player.riotTagLine}`
              );
              toast.success("Riot ID kopyalandı");
            }}
          >
            <Copy className="mr-2 h-4 w-4" />
            Riot ID
            <span className="mx-1 text-muted-foreground">—</span>
            Kopyala
          </ContextMenuItem>
        )}
        <ContextMenuItem
          className="cursor-pointer"
          onClick={() => {
            navigator.clipboard.writeText(player.kickUsername);
            toast.success("Kick adı kopyalandı");
          }}
        >
          <Gamepad2 className="mr-2 h-4 w-4" />
          Kick Adı
          <span className="mx-1 text-muted-foreground">—</span>
          Kopyala
        </ContextMenuItem>
        <ContextMenuItem
          className="cursor-pointer"
          onClick={() => onEditPlayer?.(player)}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Düzenle
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          className="cursor-pointer"
          onClick={() => onUpdatePlayer(player.id, { isAway: !player.isAway })}
        >
          {player.isAway ? (
            <>
              <UserCheck className="mr-2 h-4 w-4" />
              Geri Döndü Olarak İşaretle
            </>
          ) : (
            <>
              <Coffee className="mr-2 h-4 w-4" />
              Uzakta Olarak İşaretle
            </>
          )}
        </ContextMenuItem>
        <ContextMenuSeparator />
        {player.isInGame ? (
          <ContextMenuItem
            className="cursor-pointer text-amber-500 focus:text-amber-500"
            onClick={() => {
              if (onRemoveFromTeam) onRemoveFromTeam(player.id);
              else onUpdatePlayer(player.id, { isInGame: false });
            }}
          >
            <UserMinus className="mr-2 h-4 w-4" />
            Takımdan Çıkar
          </ContextMenuItem>
        ) : (
          <>
            <ContextMenuItem
              className={`cursor-pointer text-team-blue focus:text-team-blue ${
                !isTeamsCreated ? "opacity-50" : ""
              }`}
              onClick={() => {
                if (!isTeamsCreated) {
                  onCreateTeamsRequest?.(player.id, "A");
                  return;
                }
                if (onAddToTeam) onAddToTeam(player.id, "A");
                else onUpdatePlayer(player.id, { isInGame: true });
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Mavi Takıma Ekle
            </ContextMenuItem>
            <ContextMenuItem
              className={`cursor-pointer text-team-red focus:text-team-red ${
                !isTeamsCreated ? "opacity-50" : ""
              }`}
              onClick={() => {
                if (!isTeamsCreated) {
                  onCreateTeamsRequest?.(player.id, "B");
                  return;
                }
                if (onAddToTeam) onAddToTeam(player.id, "B");
                else onUpdatePlayer(player.id, { isInGame: true });
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Kırmızı Takıma Ekle
            </ContextMenuItem>
          </>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={() => onRemovePlayer(player.id)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Sıradan Kaldır
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export const PlayerContextMenu = React.memo(PlayerContextMenuInner);
PlayerContextMenu.displayName = "PlayerContextMenu";
