"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AppSettings, RiotRegion } from "@/types";
import { REGION_LABELS } from "@/types";
import {
  AlertTriangle,
  Bell,
  BellOff,
  Dices,
  Eye,
  EyeOff,
  Ghost,
  Globe,
  Hash,
  Key,
  MessageSquare,
  Radio,
  Settings,
  Sliders,
  Users,
  UserX,
} from "lucide-react";
import React, { useState } from "react";

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  hasResolutionError?: boolean;
}

export function SettingsPanel({
  settings,
  onUpdateSettings,
  hasResolutionError = false,
}: SettingsPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState("api");
  const [showApiKey, setShowApiKey] = useState(false);

  const regions = Object.entries(REGION_LABELS) as [RiotRegion, string][];
  const isDebugMode = process.env.NEXT_PUBLIC_DEBUG === "true";
  const showManualId = isDebugMode || hasResolutionError || !!settings.manualChatroomId;

  return (
    <Card className="border-border/50 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <div>
            <CardTitle className="text-sm">Sistem Ayarları</CardTitle>
            <CardDescription className="text-xs">
              Uygulama, Riot API ve Kick kanalı yapılandırmaları
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md bg-muted/50 p-1 mb-6">
            <TabsTrigger value="api" className="text-xs gap-1.5 py-1.5">
              <Key className="h-3.5 w-3.5" />
              API & Bağlantı
            </TabsTrigger>
            <TabsTrigger value="game" className="text-xs gap-1.5 py-1.5">
              <Sliders className="h-3.5 w-3.5" />
              Oyun & Sıra
            </TabsTrigger>
            <TabsTrigger value="general" className="text-xs gap-1.5 py-1.5">
              <Bell className="h-3.5 w-3.5" />
              Uygulama
            </TabsTrigger>
          </TabsList>

          {/* 🔑 API & CONNECTION TAB */}
          <TabsContent value="api" className="space-y-6 mt-0 animate-in fade-in-50 duration-200">
            {/* Riot API Key */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="panel-riot-key" className="text-sm font-semibold text-foreground">
                    Riot API Anahtarı
                  </Label>
                </div>
                {settings.riotApiKey ? (
                  <Badge className="bg-success/10 text-success border-success/20 text-[10px] font-bold">
                    Aktif / Yapılandırıldı
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground text-[10px]">
                    Boş
                  </Badge>
                )}
              </div>
              <div className="relative">
                <Input
                  id="panel-riot-key"
                  type={showApiKey ? "text" : "password"}
                  placeholder="RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  value={settings.riotApiKey}
                  onChange={(e) => onUpdateSettings({ riotApiKey: e.target.value })}
                  className="font-mono text-xs pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-9 w-9 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Sıradaki oyuncuların Lig dereceleri ve profil ikonlarını çekmek için gereklidir.{" "}
                <a
                  href="https://developer.riotgames.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  developer.riotgames.com
                </a>{" "}
                adresinden temin edebilirsiniz.
              </p>
            </div>

            <Separator className="border-border/30" />

            {/* Region & Kick Channel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Region */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-semibold text-foreground">Sunucu Bölgesi</Label>
                </div>
                <Select
                  value={settings.riotRegion}
                  onValueChange={(v) =>
                    onUpdateSettings({ riotRegion: v as RiotRegion })
                  }
                >
                  <SelectTrigger id="panel-region-select" className="w-full">
                    <SelectValue placeholder="Bölge seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label} ({value.toUpperCase()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Riot API üzerinden oyuncu verileri sorgulanırken kullanılacak varsayılan bölge.
                </p>
              </div>

              {/* Kick Channel */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="panel-kick-channel" className="text-sm font-semibold text-foreground">
                    Kick Yayıncı Kanalı
                  </Label>
                </div>
                <Input
                  id="panel-kick-channel"
                  value={settings.kickChannelName || "Oturum Açılmamış"}
                  disabled
                  readOnly
                  className="text-xs opacity-75 cursor-not-allowed bg-muted/30"
                />
                <p className="text-[11px] text-muted-foreground">
                  Güvenlik nedeniyle Kick kanal adı, yaptığınız Kick entegrasyonundan otomatik olarak çekilir.
                </p>
              </div>
            </div>

            {/* Manual Chatroom Troubleshooting */}
            {showManualId && (
              <>
                <Separator className="border-border/30" />
                <div className="space-y-3 p-4 rounded-lg bg-destructive/5 border border-destructive/10">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4 animate-pulse" />
                    <Label className="text-xs font-bold uppercase tracking-wider">
                      Hata Ayıklama & Manuel Chatroom ID
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="panel-chatroom-id" className="text-xs font-semibold">
                        Manuel Chatroom ID
                      </Label>
                    </div>
                    <Input
                      id="panel-chatroom-id"
                      placeholder="Örn: 65286905"
                      value={settings.manualChatroomId || ""}
                      onChange={(e) =>
                        onUpdateSettings({
                          manualChatroomId: e.target.value.replace(/[^0-9]/g, ""),
                        })
                      }
                      className="text-xs bg-background/50 border-destructive/20 focus-visible:ring-destructive"
                    />
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Sohbet odasına bağlanırken ID otomatik bulunamazsa kullanılır.
                      <br />
                      <span className="text-destructive/80 italic font-semibold">
                        Kanalınızın varsayılan sohbet odası ID&apos;si: 65286905
                      </span>
                    </p>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* 🎮 QUEUE & GAMEPLAY SETTINGS TAB */}
          <TabsContent value="game" className="space-y-6 mt-0 animate-in fade-in-50 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team Size */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-semibold text-foreground">Takım Modu</Label>
                </div>
                <Select
                  value={String(settings.teamSize)}
                  onValueChange={(v) => onUpdateSettings({ teamSize: parseInt(v) })}
                >
                  <SelectTrigger id="panel-teamsize-select" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}v{size} Lobi ({size * 2} Oyuncu)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Lobi kurulumlarında oluşturulacak takımların oyuncu sayısı limitini belirler.
                </p>
              </div>

              {/* Pick Animation Style */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Dices className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-semibold text-foreground">Kura Çekim Animasyonu</Label>
                </div>
                <Select
                  value={settings.pickAnimationStyle ?? "classic"}
                  onValueChange={(v) =>
                    onUpdateSettings({
                      pickAnimationStyle: v as "classic" | "list" | "spin" | "none",
                    })
                  }
                >
                  <SelectTrigger id="panel-animation-select" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Seçim Kartları (Klasik)</SelectItem>
                    <SelectItem value="list">Dikey Listeleme Efekti</SelectItem>
                    <SelectItem value="spin">Çarkıfelek (Exciting Spin)</SelectItem>
                    <SelectItem value="none">Animasyonsuz (Anında Seçim)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Tekli kura çekimlerinde izleyicilere sunulacak görsel şölen temasını belirler.
                </p>
              </div>
            </div>

            <Separator className="border-border/30" />

            {/* Custom Commands Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Queue Command */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="panel-queue-cmd" className="text-sm font-semibold text-foreground">
                    Sıraya Katılma Komutu
                  </Label>
                </div>
                <Input
                  id="panel-queue-cmd"
                  placeholder="!sıra"
                  value={settings.queueCommand}
                  onChange={(e) =>
                    onUpdateSettings({ queueCommand: e.target.value.trim() })
                  }
                  className="text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  İzleyicilerin sıraya girmek için Kick sohbetinde yazacağı komut.
                </p>
              </div>

              {/* AFK Command */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <UserX className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="panel-afk-cmd" className="text-sm font-semibold text-foreground">
                    AFK Modu Komutu
                  </Label>
                </div>
                <Input
                  id="panel-afk-cmd"
                  placeholder="!afk"
                  value={settings.afkCommand}
                  onChange={(e) =>
                    onUpdateSettings({ afkCommand: e.target.value.trim() })
                  }
                  className="text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Sıradaki oyuncunun durumunu &apos;Uzakta&apos; yapmak için yazacağı sohbet komutu.
                </p>
              </div>
            </div>

            <Separator className="border-border/30" />

            {/* Riot ID Obligation */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Ghost className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="panel-disable-riot" className="text-sm font-semibold text-foreground cursor-pointer">
                      Riot ID Zorunluluğunu Kaldır
                    </Label>
                  </div>
                  <p className="text-[11px] text-muted-foreground max-w-xl">
                    Aktif edilirse izleyiciler Riot ID girmeden sadece komutu yazarak sıraya girebilir. Riot API entegrasyonu tamamen atlanır.
                  </p>
                </div>
                <Switch
                  id="panel-disable-riot"
                  checked={settings.disableRiotApi}
                  onCheckedChange={(checked) =>
                    onUpdateSettings({ disableRiotApi: checked })
                  }
                />
              </div>
            </div>
          </TabsContent>

          {/* 🔔 APPLICATION PREFERENCES TAB */}
          <TabsContent value="general" className="space-y-6 mt-0 animate-in fade-in-50 duration-200">
            {/* Toast Alerts Switch */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    {settings.enableToasts !== false ? (
                      <Bell className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <BellOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Label htmlFor="panel-enable-toasts" className="text-sm font-semibold text-foreground cursor-pointer">
                      Sistem Bildirimleri (Toast Alerts)
                    </Label>
                  </div>
                  <p className="text-[11px] text-muted-foreground max-w-xl">
                    Sıraya yeni oyuncu girdiğinde, kura çekildiğinde veya bir ceza uygulandığında ekranda kayan uyarı pencerelerini gösterir.
                  </p>
                </div>
                <Switch
                  id="panel-enable-toasts"
                  checked={settings.enableToasts !== false}
                  onCheckedChange={(checked) =>
                    onUpdateSettings({ enableToasts: checked })
                  }
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
