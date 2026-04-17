"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
import type { TeamResult, QueuePlayer } from "@/types";
import { TIER_LABELS } from "@/types";
import { PROFILE_ICON_URL } from "@/lib/constants";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Swords, Crown, GripVertical } from "lucide-react";
import { PlayerCard } from "./player-card";
import { PlayerContextMenu } from "./player-context-menu";

interface TeamDisplayProps {
  result: TeamResult;
  movePlayerBetweenTeams?: (playerId: string, targetTeamId: "A" | "B") => void;
  removePlayerFromTeam?: (playerId: string) => void;
  onUpdatePlayer: (id: string, data: Partial<QueuePlayer>) => void;
  onRemovePlayer: (id: string) => void;
  disableRiotApi?: boolean;
  onReorderTeam?: (teamId: "A" | "B", activeId: string, overId: string) => void;
  onEditPlayer?: (player: QueuePlayer) => void;
}

/* ─── Sortable Team Player Row ─────────────────────────── */

interface SortableTeamPlayerProps {
  player: QueuePlayer;
  index: number;
  isNew: boolean;
  teamColor: "blue" | "red";
  disableRiotApi: boolean;
  onUpdatePlayer: (id: string, data: Partial<QueuePlayer>) => void;
  onRemovePlayer: (id: string) => void;
  removePlayerFromTeam?: (playerId: string) => void;
  moveToOtherTeam?: (id: string) => void;
  onEditPlayer?: (player: QueuePlayer) => void;
}

const SortableTeamPlayer = React.memo(function SortableTeamPlayer({
  player,
  index,
  isNew,
  teamColor,
  disableRiotApi,
  onUpdatePlayer,
  onRemovePlayer,
  removePlayerFromTeam,
  moveToOtherTeam,
  onEditPlayer,
}: SortableTeamPlayerProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { opacity: 0.4, zIndex: 50 } : {}),
  };

  const hoverBg = teamColor === "blue" ? "hover:bg-team-blue/10" : "hover:bg-team-red/10";
  const slideDir = teamColor === "blue" ? "slide-in-from-left-2" : "slide-in-from-right-2";
  const ringColor = teamColor === "blue" ? "ring-team-blue/20" : "ring-team-red/20";

  return (
    <PlayerCard player={player}>
      <PlayerContextMenu
        player={player}
        disableRiotApi={disableRiotApi}
        onUpdatePlayer={onUpdatePlayer}
        onRemovePlayer={onRemovePlayer}
        onRemoveFromTeam={removePlayerFromTeam}
        onAddToTeam={moveToOtherTeam ? (id) => moveToOtherTeam(id) : undefined}
        isTeamsCreated={true}
        onEditPlayer={onEditPlayer}
      >
        <div
          ref={setNodeRef}
          style={style}
          className={`group flex items-center gap-3 rounded-lg p-2 transition-colors ${hoverBg} ${
            isNew ? `animate-in fade-in ${slideDir} duration-300` : ""
          } cursor-default outline-none focus-visible:ring-2 ring-ring ${
            isDragging ? "dragging" : ""
          }`}
        >
          {/* Drag handle */}
          <button
            className="touch-none cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-60 transition-opacity duration-150 focus-visible:opacity-100 shrink-0 p-0.5 rounded hover:bg-muted drag-handle"
            aria-label="Sırayı değiştirmek için sürükle"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </button>
          <span className="w-5 text-center text-xs font-medium text-muted-foreground">
            {index + 1}
          </span>
          <Avatar className={`h-8 w-8 ring-1 ${ringColor}`}>
            {player.profileIconId ? (
              <AvatarImage
                src={PROFILE_ICON_URL(player.profileIconId)}
                alt={player.riotGameName}
              />
            ) : null}
            <AvatarFallback className="text-[10px]">
              {player.riotGameName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {player.riotGameName}
              <span className="text-[10px] text-muted-foreground ml-1">
                #{player.riotTagLine}
              </span>
            </p>
          </div>
          {player.rankedTier && player.rankedTier !== "UNRANKED" && (
            <Badge variant="secondary" className="text-[9px] shrink-0">
              {TIER_LABELS[player.rankedTier]}
            </Badge>
          )}
        </div>
      </PlayerContextMenu>
    </PlayerCard>
  );
});

/* ─── Droppable Team Container ─────────────────────────── */

function TeamDropZone({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[60px] rounded-lg transition-colors duration-200 ${
        isOver ? "bg-primary/5 ring-1 ring-primary/20" : ""
      }`}
    >
      {children}
    </div>
  );
}

/* ─── Team Display ─────────────────────────────────────── */

const CONTAINER_IDS = { A: "team-A-container", B: "team-B-container" } as const;

export function TeamDisplay({
  result,
  movePlayerBetweenTeams,
  removePlayerFromTeam,
  onUpdatePlayer,
  onRemovePlayer,
  disableRiotApi = false,
  onReorderTeam,
  onEditPlayer,
}: TeamDisplayProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor)
  );

  // Resolve an ID (player or container) to a team
  const resolveTeam = useCallback(
    (id: string): "A" | "B" | null => {
      if (id === CONTAINER_IDS.A) return "A";
      if (id === CONTAINER_IDS.B) return "B";
      if (result.teamA.players.some((p) => p.id === id)) return "A";
      if (result.teamB.players.some((p) => p.id === id)) return "B";
      return null;
    },
    [result]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeTeam = resolveTeam(String(active.id));
      const overTeam = resolveTeam(String(over.id));

      // If dragging to a different team (player or container), move between teams
      if (activeTeam && overTeam && activeTeam !== overTeam && movePlayerBetweenTeams) {
        movePlayerBetweenTeams(String(active.id), overTeam);
      }
    },
    [resolveTeam, movePlayerBetweenTeams]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const overId = String(over.id);
      // If dropped on a container, it's a cross-team move (already handled in dragOver)
      if (overId === CONTAINER_IDS.A || overId === CONTAINER_IDS.B) return;

      const activeTeam = resolveTeam(String(active.id));
      const overTeam = resolveTeam(overId);

      if (activeTeam && overTeam && activeTeam === overTeam) {
        // Same team — reorder
        onReorderTeam?.(activeTeam, String(active.id), overId);
      }
    },
    [resolveTeam, onReorderTeam]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const teamAIds = useMemo(
    () => result.teamA.players.map((p) => p.id),
    [result.teamA.players]
  );
  const teamBIds = useMemo(
    () => result.teamB.players.map((p) => p.id),
    [result.teamB.players]
  );

  const activePlayer = activeId
    ? result.teamA.players.find((p) => p.id === activeId) ??
      result.teamB.players.find((p) => p.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {/* Team A — Blue */}
        <Card className="overflow-hidden border-team-blue/30 bg-team-blue/3 h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-team-blue/15">
                  <Swords className="h-4 w-4 text-team-blue" />
                </div>
                <div>
                  <CardTitle className="text-sm text-team-blue">
                    {result.teamA.name}
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    {result.teamA.players.length} oyuncu
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className="border-team-blue/30 text-team-blue text-[10px]"
              >
                Mavi
              </Badge>
            </div>
          </CardHeader>
          <Separator className="bg-team-blue/10" />
          <CardContent className="pt-3 min-h-[100px]">
            <ScrollArea className="max-h-64">
              <TeamDropZone id={CONTAINER_IDS.A}>
                <SortableContext
                  items={teamAIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {result.teamA.players.map((player, i) => {
                      const isNew = !seenIdsRef.current.has(`teamA-${player.id}`);
                      if (isNew) seenIdsRef.current.add(`teamA-${player.id}`);
                      return (
                        <SortableTeamPlayer
                          key={player.id}
                          player={player}
                          index={i}
                          isNew={isNew}
                          teamColor="blue"
                          disableRiotApi={disableRiotApi}
                          onUpdatePlayer={onUpdatePlayer}
                          onRemovePlayer={onRemovePlayer}
                          removePlayerFromTeam={removePlayerFromTeam}
                          moveToOtherTeam={
                            movePlayerBetweenTeams
                              ? (id) => movePlayerBetweenTeams(id, "B")
                              : undefined
                          }
                          onEditPlayer={onEditPlayer}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </TeamDropZone>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* VS Divider (mobile) */}
        <div className="flex items-center justify-center md:hidden -my-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted ring-2 ring-border">
            <Crown className="h-4 w-4 text-warning" />
          </div>
        </div>

        {/* Team B — Red */}
        <Card className="overflow-hidden border-team-red/30 bg-team-red/3 h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-team-red/15">
                  <Swords className="h-4 w-4 text-team-red" />
                </div>
                <div>
                  <CardTitle className="text-sm text-team-red">
                    {result.teamB.name}
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    {result.teamB.players.length} oyuncu
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className="border-team-red/30 text-team-red text-[10px]"
              >
                Kırmızı
              </Badge>
            </div>
          </CardHeader>
          <Separator className="bg-team-red/10" />
          <CardContent className="pt-3 min-h-[100px]">
            <ScrollArea className="max-h-64">
              <TeamDropZone id={CONTAINER_IDS.B}>
                <SortableContext
                  items={teamBIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {result.teamB.players.map((player, i) => {
                      const isNew = !seenIdsRef.current.has(`teamB-${player.id}`);
                      if (isNew) seenIdsRef.current.add(`teamB-${player.id}`);
                      return (
                        <SortableTeamPlayer
                          key={player.id}
                          player={player}
                          index={i}
                          isNew={isNew}
                          teamColor="red"
                          disableRiotApi={disableRiotApi}
                          onUpdatePlayer={onUpdatePlayer}
                          onRemovePlayer={onRemovePlayer}
                          removePlayerFromTeam={removePlayerFromTeam}
                          moveToOtherTeam={
                            movePlayerBetweenTeams
                              ? (id) => movePlayerBetweenTeams(id, "A")
                              : undefined
                          }
                          onEditPlayer={onEditPlayer}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </TeamDropZone>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Drag overlay ghost */}
      <DragOverlay dropAnimation={null}>
        {activePlayer ? (
          <div className="drag-overlay rounded-lg p-2 flex items-center gap-3">
            <Avatar className="h-8 w-8 ring-1 ring-border/30">
              {activePlayer.profileIconId ? (
                <AvatarImage
                  src={PROFILE_ICON_URL(activePlayer.profileIconId)}
                  alt={activePlayer.riotGameName}
                />
              ) : null}
              <AvatarFallback className="text-[10px]">
                {activePlayer.riotGameName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm font-medium truncate">
              {activePlayer.riotGameName}
              <span className="text-[10px] text-muted-foreground ml-1">
                #{activePlayer.riotTagLine}
              </span>
            </p>
            {activePlayer.rankedTier &&
              activePlayer.rankedTier !== "UNRANKED" && (
                <Badge variant="secondary" className="text-[9px] shrink-0">
                  {TIER_LABELS[activePlayer.rankedTier]}
                </Badge>
              )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
