"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useModeration } from "@/hooks/use-moderation";
import type { QueuePlayer } from "@/types";
import {
  AlertTriangle,
  Coffee,
  Copy,
  Gamepad2,
  Pencil,
  Trash2,
  UserCheck,
  UserMinus,
  UserPlus,
} from "lucide-react";
import React, { createContext, useState } from "react";
import { toast } from "sonner";

export const ContextMenuOpenContext = createContext<boolean>(false);

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
  currentTeam?: "A" | "B";
  onModerate?: (
    kickUsername: string,
    actionType: "warning" | "punishment" | "ban",
  ) => void;
  onManualAddRequest?: (teamId: "A" | "B") => void;
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
  currentTeam,
  onModerate,
  onManualAddRequest,
}: PlayerContextMenuProps) {
  const moderation = useModeration();
  const isBanned = moderation.isPlayerBanned(player.kickUsername);
  const isPunished = moderation.isPlayerPunished(player.kickUsername);
  const isAway = player.isAway;
  const cannotMoveToTeams = isBanned || isPunished || isAway;

  const [isOpen, setIsOpen] = useState(false);

  return (
    <ContextMenuOpenContext.Provider value={isOpen}>
      <ContextMenu onOpenChange={setIsOpen}>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuLabel className="text-xs truncate">
            {player.riotGameName}#{player.riotTagLine}
          </ContextMenuLabel>
          {!disableRiotApi && (
            <ContextMenuItem
              className="cursor-pointer"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${player.riotGameName}#${player.riotTagLine}`,
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

          {/* Moderation Actions Quick Access */}
          {onModerate && (
            <>
              <ContextMenuItem
                className="cursor-pointer *:first:text-amber-600! text-amber-600 focus:text-amber-600 focus:bg-amber-500/10"
                onClick={() => onModerate(player.kickUsername, "warning")}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                İşlem Uygula
              </ContextMenuItem>

              <ContextMenuSeparator />
            </>
          )}

          <ContextMenuItem
            className="cursor-pointer"
            onClick={() =>
              onUpdatePlayer(player.id, { isAway: !player.isAway })
            }
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
            <>
              {currentTeam === "A" && onAddToTeam && !cannotMoveToTeams && (
                <ContextMenuItem
                  className="cursor-pointer text-team-red focus:text-team-red focus:bg-team-red/10"
                  onClick={() => onAddToTeam(player.id, "B")}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Kırmızı Takıma Taşı
                </ContextMenuItem>
              )}
              {currentTeam === "B" && onAddToTeam && !cannotMoveToTeams && (
                <ContextMenuItem
                  className="cursor-pointer text-team-blue focus:text-team-blue focus:bg-team-blue/10"
                  onClick={() => onAddToTeam(player.id, "A")}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Mavi Takıma Taşı
                </ContextMenuItem>
              )}
              <ContextMenuItem
                className="cursor-pointer text-amber-500 focus:text-amber-500 focus:bg-amber-500/10"
                onClick={() => {
                  if (onRemoveFromTeam) onRemoveFromTeam(player.id);
                  else onUpdatePlayer(player.id, { isInGame: false });
                }}
              >
                <UserMinus className="mr-2 h-4 w-4" />
                Takımdan Çıkar
              </ContextMenuItem>
            </>
          ) : (
            !cannotMoveToTeams && (
              <>
                <ContextMenuItem
                  className={`cursor-pointer text-team-blue focus:text-team-blue focus:bg-team-blue/10 ${
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
                  className={`cursor-pointer text-team-red focus:text-team-red focus:bg-team-red/10 ${
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
            )
          )}
          <ContextMenuSeparator />
          <ContextMenuItem
            className="cursor-pointer *:first:text-destructive! text-destructive focus:text-destructive focus:bg-destructive/10"
            onClick={() => onRemovePlayer(player.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Sıradan Kaldır
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </ContextMenuOpenContext.Provider>
  );
};

export const PlayerContextMenu = React.memo(PlayerContextMenuInner);
PlayerContextMenu.displayName = "PlayerContextMenu";
