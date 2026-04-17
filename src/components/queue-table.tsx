"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import type { QueuePlayer } from "@/types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SortablePlayerRow } from "./sortable-player-row";
import { Shield } from "lucide-react";

interface QueueTableProps {
  players: QueuePlayer[];
  onRemovePlayer: (id: string) => void;
  onUpdatePlayer: (id: string, data: Partial<QueuePlayer>) => void;
  onReorder?: (activeId: string, overId: string) => void;
  queueCommand?: string;
  disableRiotApi?: boolean;
  onAddToTeam?: (id: string, team: "A" | "B") => void;
  onRemoveFromTeam?: (id: string) => void;
  isTeamsCreated?: boolean;
  onCreateTeamsRequest?: (playerId: string, teamId: "A" | "B") => void;
  onManualAddRequest?: () => void;
  onEditPlayer?: (player: QueuePlayer) => void;
}

export function QueueTable({
  players,
  onRemovePlayer,
  onUpdatePlayer,
  onReorder,
  queueCommand = "!sıra",
  disableRiotApi = false,
  onAddToTeam,
  onRemoveFromTeam,
  isTeamsCreated = false,
  onCreateTeamsRequest,
  onEditPlayer,
}: QueueTableProps) {
  // Track "seen" IDs so mount animation only fires once
  const seenIdsRef = useRef<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (over && active.id !== over.id) {
        onReorder?.(String(active.id), String(over.id));
      }
    },
    [onReorder]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  // Pre-compute time strings once per render (not per row)
  const timeData = useMemo(() => {
    return players.map((p) => {
      const date = new Date(p.joinedAt);
      return {
        formatted: date.toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        full: date.toLocaleString("tr-TR"),
      };
    });
  }, [players]);

  const playerIds = useMemo(() => players.map((p) => p.id), [players]);

  const activePlayer = activeId
    ? players.find((p) => p.id === activeId)
    : null;
  const activeIndex = activePlayer
    ? players.findIndex((p) => p.id === activeId)
    : -1;

  if (players.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center h-[calc(100vh-22rem)] min-h-[300px]">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
          <Shield className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-sm font-medium text-muted-foreground">
          Sırada henüz kimse yok
        </h3>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground/70">
          Kick sohbetinde{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">
            {queueCommand}
            {disableRiotApi ? "" : " İsim#TAG"}
          </code>{" "}
          yazarak veya sağ tıklayarak sıraya katılabilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <ScrollArea
        className="h-[calc(100vh-22rem)] min-h-[300px]"
        id="queue-scroll-area"
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="w-12 text-center text-xs">#</TableHead>
              <TableHead className="text-xs">Oyuncu</TableHead>
              <TableHead className="text-xs">Kick</TableHead>
              <TableHead className="text-xs">Derece</TableHead>
              <TableHead className="text-xs text-center">Kazanma</TableHead>
              <TableHead className="w-14 text-xs text-center">Saat</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <SortableContext
              items={playerIds}
              strategy={verticalListSortingStrategy}
            >
              {players.map((player, index) => {
                const isNew = !seenIdsRef.current.has(player.id);
                if (isNew) seenIdsRef.current.add(player.id);

                return (
                  <SortablePlayerRow
                    key={player.id}
                    player={player}
                    index={index}
                    isNew={isNew}
                    disableRiotApi={disableRiotApi}
                    onRemovePlayer={onRemovePlayer}
                    onUpdatePlayer={onUpdatePlayer}
                    onAddToTeam={onAddToTeam}
                    onRemoveFromTeam={onRemoveFromTeam}
                    isTeamsCreated={isTeamsCreated}
                    onCreateTeamsRequest={onCreateTeamsRequest}
                    onEditPlayer={onEditPlayer}
                    joinTimeFormatted={timeData[index].formatted}
                    joinTimeFull={timeData[index].full}
                  />
                );
              })}
            </SortableContext>
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Drag overlay — semi-transparent ghost */}
      <DragOverlay dropAnimation={null}>
        {activePlayer && activeIndex >= 0 ? (
          <div className="drag-overlay rounded-lg">
            <Table>
              <TableBody>
                <SortablePlayerRow
                  player={activePlayer}
                  index={activeIndex}
                  isNew={false}
                  disableRiotApi={disableRiotApi}
                  onRemovePlayer={onRemovePlayer}
                  onUpdatePlayer={onUpdatePlayer}
                  onAddToTeam={onAddToTeam}
                  onRemoveFromTeam={onRemoveFromTeam}
                  isTeamsCreated={isTeamsCreated}
                  onCreateTeamsRequest={onCreateTeamsRequest}
                  joinTimeFormatted={timeData[activeIndex].formatted}
                  joinTimeFull={timeData[activeIndex].full}
                />
              </TableBody>
            </Table>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
