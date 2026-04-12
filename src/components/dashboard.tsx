"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useQueue } from "@/hooks/use-queue";
import { useSettings } from "@/hooks/use-settings";
import { useKickChat } from "@/hooks/use-kick-chat";
import { useLiveStatus } from "@/hooks/use-live-status";
import type { QueuePlayer } from "@/types";
import { Header } from "./header";
import { QueueTable } from "./queue-table";
import { TeamDisplay } from "./team-display";
import { SettingsSheet } from "./settings-sheet";
import { SinglePickDialog } from "./single-pick-dialog";
import { ManualAddDialog } from "./manual-add-dialog";
import { GlobalContextMenu } from "./global-context-menu";
import { Watermark } from "./watermark";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Shuffle,
  Dices,
  Trash2,
  AlertTriangle,
  ListOrdered,
  Swords,
  Sparkles,
} from "lucide-react";

export function Dashboard() {
  const { data: session } = useSession();
  const { settings, updateSettings, isConfigured } = useSettings();

  const liveStatus = useLiveStatus({
    channelSlug: settings.kickChannelName,
    pollInterval: 120000,
    enabled: !!settings.kickChannelName,
    onStreamEnd: () => {
      queue.clearSession();
      toast.info("Yayın Sona Erdi", {
        description: "Sıra oturumu temizlendi.",
      });
    },
  });

  const queue = useQueue(liveStatus.isLive);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [singlePickOpen, setSinglePickOpen] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("queue");
  const [queueFilter, setQueueFilter] = useState<"all" | "queue" | "ingame" | "away">("all");
  const [randomizeAlertOpen, setRandomizeAlertOpen] = useState(false);
  const [pickAlertOpen, setPickAlertOpen] = useState(false);
  const [pickOnlyInGame, setPickOnlyInGame] = useState(false);
  const [pendingTeamAddition, setPendingTeamAddition] = useState<{ playerId: string, teamId: "A" | "B" } | null>(null);
  const [manualAddOpen, setManualAddOpen] = useState(false);

  const kickAccessToken = (session as unknown as Record<string, unknown>)?.accessToken as string | undefined;

  const fetchRiotData = useCallback(
    async (player: QueuePlayer) => {

      queue.updatePlayer(player.id, { isLoading: true });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const res = await fetch("/api/riot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameName: player.riotGameName,
            tagLine: player.riotTagLine,
            apiKey: settings.riotApiKey,
            region: settings.riotRegion,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          queue.updatePlayer(player.id, {
            ...data,
            isLoading: false,
            hasError: false,
          });
        } else {
          queue.updatePlayer(player.id, {
            isLoading: false,
            hasError: true,
            rankedTier: "UNRANKED",
          });
        }
      } catch {
        clearTimeout(timeoutId);
        queue.updatePlayer(player.id, {
          isLoading: false,
          hasError: true,
          rankedTier: "UNRANKED",
        });
      }
    },
    [settings.riotApiKey, settings.riotRegion, queue]
  );

  const handleQueueCommand = useCallback(
    (kickUsername: string, gameName: string, tagLine: string) => {
      const newPlayer: QueuePlayer = {
        id: `${gameName}#${tagLine}-${Date.now()}`,
        kickUsername,
        riotGameName: gameName,
        riotTagLine: tagLine,
        joinedAt: new Date(),
        isLoading: !settings.disableRiotApi,
      };

      queue.addPlayer(newPlayer);

      if (settings.disableRiotApi) {
        toast.success("Sıraya Eklendi", {
          description: `${kickUsername}`,
        });
        return;
      }

      toast.success("Sıraya Eklendi", {
        description: `${kickUsername} → ${gameName}#${tagLine}`,
      });

      fetchRiotData(newPlayer);
    },
    [queue, fetchRiotData]
  );

  const filteredPlayers = useMemo(() => {
    return queue.players.filter(p => {
      if (queueFilter === "all") return true;
      if (queueFilter === "queue") return !p.isInGame && !p.isAway;
      if (queueFilter === "ingame") return p.isInGame;
      if (queueFilter === "away") return p.isAway;
      return true;
    });
  }, [queue.players, queueFilter]);

  const handleDuplicateAttempt = useCallback(
    (kickUsername: string, riotId: string) => {
      const isRiotDisabled = settings.disableRiotApi || kickUsername === riotId;
      toast.warning("Tekrarlanan Kayıt", {
        description: isRiotDisabled
          ? `${kickUsername} kullanıcısı zaten sırada.`
          : `${kickUsername} kullanıcısı zaten ${riotId} olarak sırada.`
      });
    },
    [settings.disableRiotApi]
  );

  const handleManualAdd = useCallback((kickUsername: string, riotIdStr: string) => {
    let gameName = kickUsername;
    let tagLine = "";

    if (!settings.disableRiotApi) {
      const parts = riotIdStr.split("#");
      gameName = parts[0] || kickUsername;
      tagLine = parts[1] || "TR1";
    } else {
      tagLine = "MANUEL";
    }

    if (queue.isDuplicate(gameName, tagLine)) {
      handleDuplicateAttempt(kickUsername, `${gameName}#${tagLine}`);
      return;
    }

    const newPlayer: QueuePlayer = {
      id: crypto.randomUUID(),
      kickUsername,
      riotGameName: gameName,
      riotTagLine: tagLine,
      joinedAt: new Date(),
      isInGame: false,
      isAway: false,
      isLoading: !settings.disableRiotApi,
    };

    queue.addPlayer(newPlayer);
    toast.success("Oyuncu Eklendi", { description: `${kickUsername} sıraya eklendi.` });

    if (!settings.disableRiotApi) {
      fetchRiotData(newPlayer);
    }
  }, [queue, settings.disableRiotApi, handleDuplicateAttempt, fetchRiotData]);

  const handleAfkCommand = useCallback((kickUsername: string) => {
    const existingPlayer = queue.players.find(p => p.kickUsername.toLowerCase() === kickUsername.toLowerCase());
    if (existingPlayer) {
      const isCurrentlyAway = existingPlayer.isAway;
      queue.updatePlayer(existingPlayer.id, { isAway: !isCurrentlyAway });
      
      if (isCurrentlyAway) {
        toast.info("Geri Döndü", { description: `${existingPlayer.kickUsername} tekrar bilgisayar başında.` });
      } else {
        toast.info("AFK Bildirimi", { description: `${existingPlayer.kickUsername} şu an bilgisayar başında değil (Uzakta).` });
      }
    }
  }, [queue]);

  const kickChat = useKickChat({
    channelSlug: settings.kickChannelName,
    accessToken: kickAccessToken,
    onQueueCommand: handleQueueCommand,
    onDuplicateAttempt: handleDuplicateAttempt,
    isDuplicate: queue.isDuplicate,
    enabled: !!settings.kickChannelName,
    queueCommand: settings.queueCommand,
    afkCommand: settings.afkCommand,
    onAfkCommand: handleAfkCommand,
    disableRiotApi: settings.disableRiotApi,
    initialChatroomId: settings.manualChatroomId ? parseInt(settings.manualChatroomId) : (status === "authenticated" ? (session?.user as any)?.chatroomId : null),
  });

  const executeRandomize = useCallback((onlyInGame: boolean) => {
    const minPlayers = onlyInGame ? 3 : settings.teamSize * 2;
    const inGameCount = queue.players.filter(p => !p.isAway && p.isInGame).length;

    if (onlyInGame && inGameCount < minPlayers) {
      toast.error("Yetersiz Oyuncu", {
        description: `Takımları karıştırmak için en az 3 "Oyunda" işaretli oyuncu gerekli. ${inGameCount} oyuncu bulundu.`,
      });
      return;
    }

    const result = queue.randomizeTeams(settings.teamSize, onlyInGame);
    if (result) {
      setActiveTab("teams");
      toast.success("Takımlar Oluşturuldu", {
        description: `${result.teamA.name} vs ${result.teamB.name}`,
      });
    }
  }, [queue, settings.teamSize]);

  const handleRandomize = useCallback(() => {
    const minPlayersFull = settings.teamSize * 2;
    const minPlayersInGame = 3;

    const activeLength = queue.players.filter(p => !p.isAway).length;
    const inGameCount = queue.players.filter(p => !p.isAway && p.isInGame).length;

    const canDoFull = activeLength >= minPlayersFull;
    const canDoInGameOnly = inGameCount >= minPlayersInGame;

    if (!canDoFull && !canDoInGameOnly) {
      toast.error("Yetersiz Oyuncu", {
        description: `Takım oluşturmak için sıradan en az ${minPlayersFull} veya takımları karıştırmak için takımdan en az ${minPlayersInGame} oyuncu gerekli.`,
      });
      return;
    }

    if (canDoFull && canDoInGameOnly) {
      setRandomizeAlertOpen(true);
      return;
    }

    if (canDoFull && !canDoInGameOnly) {
      executeRandomize(false);
      return;
    }

    if (!canDoFull && canDoInGameOnly) {
      executeRandomize(true);
      return;
    }
  }, [queue.players, settings.teamSize, executeRandomize]);

  const handleClearQueue = useCallback(() => {
    if (queue.players.length === 0) return;
    setClearConfirm(true);
  }, [queue.players.length]);

  const confirmClear = useCallback(() => {
    queue.clearQueue();
    setClearConfirm(false);
    setActiveTab("queue");
    toast.info("Sıra Temizlendi", {
      description: "Tüm oyuncular sıradan kaldırıldı.",
    });
  }, [queue]);

  const handleSinglePick = useCallback(() => {
    const activeLength = queue.players.filter(p => !p.isAway).length;
    const inGameCount = queue.players.filter(p => !p.isAway && p.isInGame).length;

    if (activeLength === 0) {
      toast.error("Sırada aktif oyuncu bulunmuyor");
      return;
    }

    if (inGameCount > 0) {
      setPickAlertOpen(true);
      return;
    }

    setPickOnlyInGame(false);
    setSinglePickOpen(true);
  }, [queue.players]);

  return (
    <GlobalContextMenu
      playerCount={queue.players.length}
      isTeamsCreated={!!queue.teamResult}
      onClearQueue={handleClearQueue}
      onRandomize={handleRandomize}
      onSinglePick={handleSinglePick}
      onOpenSettings={() => setSettingsOpen(true)}
      onReconnect={kickChat.reconnect}
    >
      <div className="flex min-h-screen flex-col">
        <Header
          isConnected={kickChat.isConnected}
          isLive={liveStatus.isLive}
          streamTitle={liveStatus.streamTitle}
          playerCount={queue.players.length}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Şamata Sırası
              </h2>
              <p className="text-sm text-muted-foreground">
                ARAM Mayhem 5v5 özel lobi yönetimi
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={queue.players.filter(p => !p.isAway).length === 0 ? 0 : undefined}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 h-9"
                      onClick={handleSinglePick}
                      disabled={queue.players.filter(p => !p.isAway).length === 0}
                      id="single-pick-button"
                    >
                      <Dices className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Tek Çekim</span>
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sıradan rastgele bir oyuncu seç</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={
                    !(queue.players.filter(p => !p.isAway).length >= settings.teamSize * 2 || (!!queue.teamResult && queue.players.filter(p => !p.isAway && p.isInGame).length >= 3)) ? 0 : undefined
                  }>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 h-9"
                      onClick={handleRandomize}
                      disabled={!(queue.players.filter(p => !p.isAway).length >= settings.teamSize * 2 || (queue.teamResult && queue.players.filter(p => !p.isAway && p.isInGame).length >= 3))}
                      id="randomize-button"
                    >
                      <Shuffle className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Karıştır</span>
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {!(queue.players.filter(p => !p.isAway).length >= settings.teamSize * 2 || (queue.teamResult && queue.players.filter(p => !p.isAway && p.isInGame).length >= 3)) ? (
                    <p>Karıştırmak için sırada en az {settings.teamSize * 2} aktif oyuncu veya takımlarda en az 3 kişi olmalı.</p>
                  ) : (
                    <p>Takımları rastgele oluştur veya karıştır</p>
                  )}
                </TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={queue.players.length === 0 ? 0 : undefined}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleClearQueue}
                      disabled={queue.players.length === 0}
                      id="clear-queue-button"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Temizle</span>
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sırayı tamamen temizle</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="queue" className="gap-2" id="tab-queue">
                <ListOrdered className="h-3.5 w-3.5" />
                Sıra
                {queue.players.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 min-w-5 px-1.5 text-[10px]"
                  >
                    {queue.players.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="teams"
                className="gap-2"
                id="tab-teams"
              >
                <Swords className="h-3.5 w-3.5" />
                Takımlar
                {queue.teamResult && (
                  <Sparkles className="h-3 w-3 text-warning" />
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="queue" className="mt-0">
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">
                        Oyuncu Sırası
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {queue.players.length === 0
                          ? `Kick sohbetinde "${settings.queueCommand}${settings.disableRiotApi ? "" : " İsim#TAG"}" yazarak katılın`
                          : `${queue.players.length} oyuncu sırada bekliyor`}
                      </CardDescription>
                    </div>
                    {queue.stats.loading > 0 && (
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
                        {queue.stats.loading} yükleniyor
                      </Badge>
                    )}
                  </div>
                  <Tabs value={queueFilter} onValueChange={(v) => setQueueFilter(v as any)} className="mt-4 w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-muted/50">
                      <TabsTrigger value="all" className="text-xs">Tümü</TabsTrigger>
                      <TabsTrigger value="queue" className="text-xs">Sıradakiler</TabsTrigger>
                      <TabsTrigger value="ingame" className="text-xs">Oyundakiler</TabsTrigger>
                      <TabsTrigger value="away" className="text-xs">Uzaktalar</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                <CardContent className="pt-0">
                  <GlobalContextMenu
                    playerCount={queue.players.length}
                    isTeamsCreated={!!queue.teamResult}
                    onClearQueue={handleClearQueue}
                    onRandomize={handleRandomize}
                    onSinglePick={handleSinglePick}
                    onOpenSettings={() => setSettingsOpen(true)}
                    onReconnect={kickChat.reconnect}
                    onManualAddRequest={() => setManualAddOpen(true)}
                  >
                    <div className="h-full w-full">
                      <QueueTable
                        players={filteredPlayers}
                        onRemovePlayer={queue.removePlayer}
                        onUpdatePlayer={queue.updatePlayer}
                        queueCommand={settings.queueCommand}
                        disableRiotApi={settings.disableRiotApi}
                        onAddToTeam={(id, tid) => queue.addPlayerToTeam(id, tid, settings.teamSize)}
                        onRemoveFromTeam={queue.removePlayerFromTeam}
                        isTeamsCreated={!!queue.teamResult}
                        onCreateTeamsRequest={(playerId, teamId) => setPendingTeamAddition({ playerId, teamId })}
                      />
                    </div>
                  </GlobalContextMenu>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="teams" className="mt-0">
              {queue.teamResult ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium">Takım Sonuçları</h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(
                          queue.teamResult.createdAt
                        ).toLocaleString("tr-TR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRandomize}
                        className="gap-2"
                        id="re-randomize-button"
                      >
                        <Shuffle className="h-3.5 w-3.5" />
                        Yeniden Karıştır
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => queue.clearTeams()}
                        className="gap-2 text-destructive hover:text-destructive focus:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Sil
                      </Button>
                    </div>
                  </div>
                  <TeamDisplay
                    result={queue.teamResult}
                    movePlayerBetweenTeams={(id, tid) => queue.movePlayerBetweenTeams(id, tid, settings.teamSize)}
                    removePlayerFromTeam={queue.removePlayerFromTeam}
                    onUpdatePlayer={queue.updatePlayer}
                    onRemovePlayer={queue.removePlayer}
                    disableRiotApi={settings.disableRiotApi}
                  />
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Swords className="h-10 w-10 text-muted-foreground/30 mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Henüz takım oluşturulmadı
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1 mb-6">
                      Aşağıdaki butona tıklayarak takımları oluşturabilir ve kurrayı başlatabilirsiniz.
                    </p>
                    <Button onClick={() => queue.createEmptyTeams()}>
                      Takımları Oluştur
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </main>

        <Watermark />

        <SettingsSheet
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          settings={settings}
          onUpdateSettings={updateSettings}
        />

        <SinglePickDialog
          open={singlePickOpen}
          onOpenChange={setSinglePickOpen}
          players={queue.players}
          pickRandomPlayer={queue.pickRandomPlayer}
          onlyInGame={pickOnlyInGame}
          onRemoveFromTeam={queue.removePlayerFromTeam}
        />

        <ManualAddDialog
          open={manualAddOpen}
          onOpenChange={setManualAddOpen}
          onAdd={handleManualAdd}
          disableRiotApi={!!settings.disableRiotApi}
        />

        <AlertDialog open={clearConfirm} onOpenChange={setClearConfirm}>
          <AlertDialogContent id="clear-confirm">
            <AlertDialogHeader>
              <AlertDialogTitle>Sırayı Temizle</AlertDialogTitle>
              <AlertDialogDescription>
                Sıradaki tüm oyuncular kaldırılacak. Bu işlem geri alınamaz.
                Devam etmek istiyor musunuz?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmClear}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Temizle
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={randomizeAlertOpen} onOpenChange={setRandomizeAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Kimi Karıştıralım?</AlertDialogTitle>
              <AlertDialogDescription>
                Şu anda "Oyunda" olarak işaretli hazır bir grubunuz var. Yeniden takımları oluştururken mevcut takımdakiler kendi aralarında mı karıştırılsın, yoksa tüm sıra listesi mi dahil edilsin?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end sm:space-x-0">
              <AlertDialogCancel className="mt-0 sm:mr-auto">İptal</AlertDialogCancel>
              <Button variant="outline" onClick={() => { setRandomizeAlertOpen(false); executeRandomize(false); }}>
                Tüm Sıra
              </Button>
              <Button onClick={() => { setRandomizeAlertOpen(false); executeRandomize(true); }}>
                Sadece Takımlar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={pickAlertOpen} onOpenChange={setPickAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Nereden Çekelim?</AlertDialogTitle>
              <AlertDialogDescription>
                Mevcut sırada "Oyunda" olarak atanmış oyuncular bulunuyor. Çekilişi tüm sıradaki oyuncular arasından mı, yoksa sadece "Oyunda" olan takımlar arasından mı yapmak istersiniz?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end sm:space-x-0">
              <AlertDialogCancel className="mt-0 sm:mr-auto">İptal</AlertDialogCancel>
              <Button variant="outline" onClick={() => { setPickAlertOpen(false); setPickOnlyInGame(false); setSinglePickOpen(true); }}>
                Tüm Sıra
              </Button>
              <Button onClick={() => { setPickAlertOpen(false); setPickOnlyInGame(true); setSinglePickOpen(true); }}>
                Sadece Takımlar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!pendingTeamAddition} onOpenChange={(open) => { if (!open) setPendingTeamAddition(null); }}>
          <AlertDialogContent id="create-teams-alert">
            <AlertDialogHeader>
              <AlertDialogTitle>Takımlar Oluşturulmadı</AlertDialogTitle>
              <AlertDialogDescription>
                Henüz takımlar oluşturulmadı. Mavi ve Kırmızı takımları manuel olarak doldurmaya hazır hale getirip, seçili oyuncuyu eklemek ister misiniz?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (!queue.teamResult) {
                    queue.createEmptyTeams();
                  }
                  
                  if (pendingTeamAddition) {
                    queue.addPlayerToTeam(pendingTeamAddition.playerId, pendingTeamAddition.teamId, settings.teamSize);
                  }
                  setPendingTeamAddition(null);
                }}
              >
                Oluştur ve Ekle
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </GlobalContextMenu>
  );
}
