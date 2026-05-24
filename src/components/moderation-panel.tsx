"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MODERATION_TABS } from "@/lib/moderation-constants";
import type { Ban, Punishment, Warning } from "@/types/moderation";
import {
  AlertTriangle,
  Ban as BanIcon,
  Clock,
  History,
  Plus,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const ICON_MAP = {
  AlertTriangle,
  Clock,
  Ban: BanIcon,
  History,
} as const;

interface ModerationPanelProps {
  warnings: Warning[];
  punishments: Punishment[];
  bans: Ban[];
  respectScores: Record<
    string,
    {
      points: number;
      totalWarnings: number;
      totalPunishments: number;
      totalBans: number;
    }
  >;
  history: Array<{
    type: "warning" | "punishment" | "ban";
    id: string;
    kickUsername: string;
    reason: string;
    issuedAt: string;
    detail: string;
  }>;
  onRevokeWarning: (id: string) => void;
  onRevokePunishment: (id: string) => void;
  onRevokeBan: (id: string) => void;
  onDeleteHistoryItem: (
    id: string,
    type: "warning" | "punishment" | "ban",
  ) => void;
  onClearAllHistory: () => void;
  onNewAction: (
    kickUsername?: string,
    actionType?: "warning" | "punishment" | "ban",
  ) => void;
}

function formatDuration(duration: string): string {
  const mapping: Record<string, string> = {
    "1_game": "1 Maç",
    "2_game": "2 Maç",
    "1_day": "1 Gün",
    "1_week": "1 Hafta",
    "1_month": "1 Ay",
    permanent: "Kalıcı",
    custom: "Özel",
  };
  return mapping[duration] ?? duration.replace("_", " ");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTypeColor(type: "warning" | "punishment" | "ban") {
  switch (type) {
    case "warning":
      return "text-[var(--cl-warning)]";
    case "punishment":
      return "text-[var(--cl-punishment)]";
    case "ban":
      return "text-[var(--cl-banned)]";
  }
}

function getTypeBadgeVariant(type: "warning" | "punishment" | "ban") {
  switch (type) {
    case "warning":
      return "outline" as const;
    case "punishment":
      return "secondary" as const;
    case "ban":
      return "destructive" as const;
  }
}

function getTypeLabel(type: "warning" | "punishment" | "ban") {
  switch (type) {
    case "warning":
      return "Uyarı";
    case "punishment":
      return "Ceza";
    case "ban":
      return "Yasak";
  }
}

function RespectBar({ points }: { points: number }) {
  const color =
    points >= 70
      ? "bg-success"
      : points >= 40
        ? "bg-[var(--cl-warning)]"
        : "bg-[var(--cl-banned)]";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 min-w-[100px]">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${color}`}
              style={{ width: `${points}%` }}
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground w-8 text-right">
            {points}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Saygı Puanı: {points}/100</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function ModerationPanel({
  warnings,
  punishments,
  bans,
  respectScores,
  history,
  onRevokeWarning,
  onRevokePunishment,
  onRevokeBan,
  onDeleteHistoryItem,
  onClearAllHistory,
  onNewAction,
}: ModerationPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState("warnings");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmDescription, setConfirmDescription] = useState("");
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});

  const triggerConfirm = (
    title: string,
    description: string,
    action: () => void,
  ) => {
    setConfirmTitle(title);
    setConfirmDescription(description);
    setConfirmAction(() => action);
    setConfirmOpen(true);
  };

  const isModIndicatorFirst = useRef(true);
  const [modTabsList, setModTabsList] = useState<HTMLDivElement | null>(null);
  const [modIndicatorStyle, setModIndicatorStyle] =
    useState<React.CSSProperties>({
      position: "absolute",
      opacity: 0,
    });
  useEffect(() => {
    const tabsList = modTabsList;
    if (!tabsList) return;

    const updateIndicator = () => {
      const activeTrigger = tabsList.querySelector(
        '[data-state="active"]',
      ) as HTMLElement;
      if (!activeTrigger) return;

      const parentRect = tabsList.getBoundingClientRect();
      const activeRect = activeTrigger.getBoundingClientRect();

      setModIndicatorStyle({
        position: "absolute",
        left: `${activeRect.left - parentRect.left}px`,
        top: `${activeRect.top - parentRect.top}px`,
        width: `${activeRect.width}px`,
        height: `${activeRect.height}px`,
        opacity: 1,
        transition: isModIndicatorFirst.current
          ? "none"
          : "all 300ms cubic-bezier(0.16, 1, 0.3, 1)",
      });
    };

    updateIndicator();
    const frameId = requestAnimationFrame(updateIndicator);
    const timeoutId = setTimeout(updateIndicator, 50);

    // Allow mount layout updates to settle before enabling smooth sliding transitions
    const skipTimer = setTimeout(() => {
      isModIndicatorFirst.current = false;
    }, 200);

    const resizeObserver = new ResizeObserver(updateIndicator);
    resizeObserver.observe(tabsList);

    // Observe all child triggers to catch dynamic flex layout stretching
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
  }, [modTabsList, activeSubTab]);

  const now = new Date().toISOString();
  const activePunishments = useMemo(
    () =>
      punishments.filter(
        (p) => p.isActive && (p.expiresAt === null || p.expiresAt > now),
      ),
    [punishments, now],
  );
  const activeBans = useMemo(
    () =>
      bans.filter(
        (b) => b.isActive && (b.expiresAt === null || b.expiresAt > now),
      ),
    [bans, now],
  );

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Moderasyon Paneli
            </CardTitle>
            <CardDescription className="text-xs">
              Uyarı, ceza ve yasaklama yönetimi
            </CardDescription>
          </div>
          <Button
            size="sm"
            className="gap-2 h-8"
            onClick={() => onNewAction()}
            id="new-moderation-action"
          >
            <Plus className="h-3.5 w-3.5" />
            Yeni İşlem
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
          <TabsList
            ref={setModTabsList}
            className="relative flex w-full bg-muted/50 p-1 sliding-tabs mb-2"
          >
            <div
              className="absolute rounded-md bg-background shadow-sm dark:bg-input/40 pointer-events-none"
              style={modIndicatorStyle}
            />
            {MODERATION_TABS.map((tab) => {
              const IconComp = ICON_MAP[tab.icon as keyof typeof ICON_MAP];
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="relative z-10 text-xs gap-1.5"
                >
                  {IconComp && <IconComp className="h-3 w-3" />}
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* ─── Warnings Tab ──────────────────────────────────── */}
          <TabsContent value="warnings">
            <ContextMenu>
              <ContextMenuTrigger asChild>
                {warnings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center h-full min-h-[200px]">
                    <AlertTriangle className="h-8 w-8 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Henüz uyarı yok
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Oyuncu</TableHead>
                        <TableHead className="text-xs">Seviye</TableHead>
                        <TableHead className="text-xs">Sebep</TableHead>
                        <TableHead className="text-xs">Saygı</TableHead>
                        <TableHead className="text-xs">Tarih</TableHead>
                        <TableHead className="text-xs w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {warnings.map((w) => (
                        <ContextMenu key={w.id}>
                          <ContextMenuTrigger asChild>
                            <TableRow className="cursor-context-menu select-none">
                              <TableCell className="text-xs font-medium">
                                {w.kickUsername}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    w.level >= 2 ? "destructive" : "outline"
                                  }
                                  className="text-[10px]"
                                >
                                  {w.level}. Uyarı
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                                {w.reason}
                              </TableCell>
                              <TableCell>
                                <RespectBar
                                  points={
                                    respectScores[w.kickUsername.toLowerCase()]
                                      ?.points ?? 100
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {formatDate(w.issuedAt)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => onRevokeWarning(w.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="w-56">
                            <ContextMenuLabel className="text-xs">
                              İşlemler ({w.kickUsername})
                            </ContextMenuLabel>
                            <ContextMenuSeparator />
                            <ContextMenuItem
                              variant="destructive"
                              className="gap-2 cursor-pointer"
                              onClick={() => onRevokeWarning(w.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Uyarıyı Kaldır
                            </ContextMenuItem>
                            <ContextMenuItem
                              className="gap-2 cursor-pointer"
                              onClick={() =>
                                onNewAction(w.kickUsername, "punishment")
                              }
                            >
                              <Clock className="h-3.5 w-3.5" />
                              Türü Değiştir
                            </ContextMenuItem>
                            <ContextMenuItem
                              className="gap-2 cursor-pointer"
                              onClick={() => onNewAction(w.kickUsername, "ban")}
                            >
                              <BanIcon className="h-3.5 w-3.5" />
                              Yasakla
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ContextMenuTrigger>
              <ContextMenuContent className="w-56">
                <ContextMenuItem
                  className="gap-2 cursor-pointer"
                  onClick={() => onNewAction(undefined, "warning")}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Yeni Uyarı Ekle
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </TabsContent>

          {/* ─── Punishments Tab ───────────────────────────────── */}
          <TabsContent value="punishments">
            <ContextMenu>
              <ContextMenuTrigger asChild>
                {activePunishments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center h-full min-h-[200px]">
                    <Clock className="h-8 w-8 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Aktif ceza yok
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Oyuncu</TableHead>
                        <TableHead className="text-xs">Süre</TableHead>
                        <TableHead className="text-xs">Sebep</TableHead>
                        <TableHead className="text-xs">Saygı</TableHead>
                        <TableHead className="text-xs">Bitiş</TableHead>
                        <TableHead className="text-xs w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activePunishments.map((p) => (
                        <ContextMenu key={p.id}>
                          <ContextMenuTrigger asChild>
                            <TableRow className="cursor-context-menu select-none">
                              <TableCell className="text-xs font-medium">
                                {p.kickUsername}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] bg-[var(--cl-punishment)]/10 text-[var(--cl-punishment)]"
                                >
                                  {p.customDurationLabel ??
                                    formatDuration(p.duration)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                                {p.reason}
                              </TableCell>
                              <TableCell>
                                <RespectBar
                                  points={
                                    respectScores[p.kickUsername.toLowerCase()]
                                      ?.points ?? 100
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {p.expiresAt
                                  ? formatDate(p.expiresAt)
                                  : "Oyun bazlı"}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => onRevokePunishment(p.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="w-56">
                            <ContextMenuLabel className="text-xs">
                              İşlemler ({p.kickUsername})
                            </ContextMenuLabel>
                            <ContextMenuSeparator />
                            <ContextMenuItem
                              className="gap-2 cursor-pointer"
                              variant="destructive"
                              onClick={() => onRevokePunishment(p.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Cezayı Kaldır
                            </ContextMenuItem>
                            <ContextMenuItem
                              className="gap-2 cursor-pointer"
                              onClick={() =>
                                onNewAction(p.kickUsername, "punishment")
                              }
                            >
                              <Clock className="h-3.5 w-3.5" />
                              Süreyi Düzenle
                            </ContextMenuItem>
                            <ContextMenuItem
                              className="gap-2 cursor-pointer"
                              onClick={() => onNewAction(p.kickUsername, "ban")}
                            >
                              <BanIcon className="h-3.5 w-3.5" />
                              Yasakla
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ContextMenuTrigger>
              <ContextMenuContent className="w-56">
                <ContextMenuItem
                  className="gap-2 cursor-pointer"
                  onClick={() => onNewAction(undefined, "punishment")}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Yeni Ceza Ekle
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </TabsContent>

          {/* ─── Bans Tab ──────────────────────────────────────── */}
          <TabsContent value="bans">
            <ContextMenu>
              <ContextMenuTrigger asChild>
                {activeBans.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center h-full min-h-[200px]">
                    <BanIcon className="h-8 w-8 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Yasaklı oyuncu yok
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Oyuncu</TableHead>
                        <TableHead className="text-xs">Süre</TableHead>
                        <TableHead className="text-xs">Sebep</TableHead>
                        <TableHead className="text-xs">Saygı</TableHead>
                        <TableHead className="text-xs">Bitiş</TableHead>
                        <TableHead className="text-xs w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeBans.map((b) => (
                        <ContextMenu key={b.id}>
                          <ContextMenuTrigger asChild>
                            <TableRow className="cursor-context-menu select-none">
                              <TableCell className="text-xs font-medium">
                                {b.kickUsername}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="destructive"
                                  className="text-[10px]"
                                >
                                  {formatDuration(b.duration)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                                {b.reason}
                              </TableCell>
                              <TableCell>
                                <RespectBar
                                  points={
                                    respectScores[b.kickUsername.toLowerCase()]
                                      ?.points ?? 100
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {b.expiresAt
                                  ? formatDate(b.expiresAt)
                                  : "Süresiz"}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => onRevokeBan(b.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="w-56">
                            <ContextMenuLabel className="text-xs">
                              İşlemler ({b.kickUsername})
                            </ContextMenuLabel>
                            <ContextMenuSeparator />
                            <ContextMenuItem
                              className="gap-2 cursor-pointer"
                              variant="destructive"
                              onClick={() => onRevokeBan(b.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Yasağı Kaldır
                            </ContextMenuItem>
                            <ContextMenuItem
                              className="gap-2 cursor-pointer"
                              onClick={() => onNewAction(b.kickUsername, "ban")}
                            >
                              <BanIcon className="h-3.5 w-3.5" />
                              Süreyi Düzenle
                            </ContextMenuItem>
                            <ContextMenuItem
                              className="gap-2 cursor-pointer"
                              onClick={() =>
                                onNewAction(b.kickUsername, "punishment")
                              }
                            >
                              <Clock className="h-3.5 w-3.5" />
                              Cezaya Dönüştür
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ContextMenuTrigger>
              <ContextMenuContent className="w-56">
                <ContextMenuItem
                  className="gap-2 cursor-pointer"
                  onClick={() => onNewAction(undefined, "ban")}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Yeni Yasaklama Ekle
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </TabsContent>

          {/* ─── History Tab ───────────────────────────────────── */}
          <TabsContent value="history">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <History className="h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Henüz işlem geçmişi yok
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-xs text-muted-foreground">
                    Sağ tıklayarak tekil işlemleri silebilirsiniz.
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                    onClick={() => {
                      triggerConfirm(
                        "Geçmişi Temizle",
                        "Tüm moderasyon geçmişini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
                        onClearAllHistory,
                      );
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Geçmişi Temizle
                  </Button>
                </div>
                {history.map((item) => (
                  <ContextMenu key={item.id}>
                    <ContextMenuTrigger>
                      <div className="flex items-center gap-3 p-3 mb-2 rounded-lg bg-muted/30 border border-border/30 hover:bg-muted/40 transition-all cursor-context-menu select-none">
                        <div
                          className={`flex-shrink-0 ${getTypeColor(item.type)}`}
                        >
                          {item.type === "warning" && (
                            <AlertTriangle className="h-4 w-4" />
                          )}
                          {item.type === "punishment" && (
                            <Clock className="h-4 w-4" />
                          )}
                          {item.type === "ban" && (
                            <BanIcon className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">
                              {item.kickUsername}
                            </span>
                            <Badge
                              variant={getTypeBadgeVariant(item.type)}
                              className="text-[11px]"
                            >
                              {getTypeLabel(item.type)}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              {item.detail}{" "}
                            </span>
                          </div>
                          <p className="text-[13px] text-muted-foreground truncate mt-0.5">
                            {item.reason}
                          </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatDate(item.issuedAt)}
                        </span>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48">
                      <ContextMenuItem
                        className="cursor-pointer gap-2"
                        variant="destructive"
                        onClick={() =>
                          triggerConfirm(
                            "İşlemi Sil",
                            "Bu moderasyon işlemini geçmişten silmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
                            () => onDeleteHistoryItem(item.id, item.type),
                          )
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Geçmişi Sil
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => {
                confirmAction();
                setConfirmOpen(false);
              }}
            >
              Onayla
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
