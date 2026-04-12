"use client";

import type { AppSettings, RiotRegion } from "@/types";
import { REGION_LABELS } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Key, Globe, Users, Radio, MessageSquare, Ghost, UserX, Hash, AlertTriangle } from "lucide-react";

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
}

export function SettingsSheet({
  open,
  onOpenChange,
  settings,
  onUpdateSettings,
}: SettingsSheetProps) {
  const regions = Object.entries(REGION_LABELS) as [RiotRegion, string][];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto" id="settings-sheet">
        <SheetHeader>
          <SheetTitle className="text-lg">Ayarlar</SheetTitle>
          <SheetDescription>
            API anahtarlarını ve bölge tercihlerini yapılandırın.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 *:mx-5 space-y-6">
          {/* Riot API Key */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="riot-api-key" className="text-sm font-medium">
                Riot API Anahtarı
              </Label>
              {settings.riotApiKey && (
                <Badge variant="secondary" className="text-[10px]">
                  Yapılandırıldı
                </Badge>
              )}
            </div>
            <Input
              id="riot-api-key"
              type="password"
              placeholder="RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={settings.riotApiKey}
              onChange={(e) =>
                onUpdateSettings({ riotApiKey: e.target.value })
              }
              className="font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              developer.riotgames.com adresinden alabilirsiniz.
            </p>
          </div>

          <Separator />

          {/* Region */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Bölge</Label>
            </div>
            <Select
              value={settings.riotRegion}
              onValueChange={(v) =>
                onUpdateSettings({ riotRegion: v as RiotRegion })
              }
            >
              <SelectTrigger id="region-select" className="w-full">
                <SelectValue placeholder="Bölge seçin" />
              </SelectTrigger>
              <SelectContent>
                {regions.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Yönlendirme bölgesi:{" "}
              <span className="font-medium text-foreground">
                {settings.riotRoutingRegion}
              </span>
            </p>
          </div>

          <Separator />

          {/* Team Size */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="team-size" className="text-sm font-medium">
                Takım Boyutu
              </Label>
            </div>
            <Select
              value={String(settings.teamSize)}
              onValueChange={(v) =>
                onUpdateSettings({ teamSize: parseInt(v) })
              }
            >
              <SelectTrigger id="team-size-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}v{size} ({size * 2} oyuncu)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Kick Channel */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="kick-channel" className="text-sm font-medium">
                Kick Kanal Adı
              </Label>
              {settings.kickChannelName && (
                <Badge variant="secondary" className="text-[10px]">
                  Aktif
                </Badge>
              )}
            </div>
            <Input
              id="kick-channel"
              placeholder="kanal-adi"
              value={settings.kickChannelName}
              onChange={(e) =>
                onUpdateSettings({ kickChannelName: e.target.value.toLowerCase().trim() })
              }
              className="text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              kick.com/
              <span className="font-medium text-foreground">
                {settings.kickChannelName || "kanal-adi"}
              </span>{" "}
              adresindeki kanalınızın slug adı.
            </p>
          </div>

          <Separator />

          {/* Debug / Troubleshooting Section */}
          <div className="space-y-4 bg-destructive/5 p-4 rounded-lg border border-destructive/20 mt-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <Label className="text-sm font-bold uppercase tracking-wider">Hata Ayıklama (Debug)</Label>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="manual-chatroom-id" className="text-xs font-medium">
                  Manuel Chatroom ID
                </Label>
              </div>
              <Input
                id="manual-chatroom-id"
                placeholder="Örn: 65286905"
                value={settings.manualChatroomId}
                onChange={(e) =>
                  onUpdateSettings({ manualChatroomId: e.target.value.replace(/[^0-9]/g, "") })
                }
                className="text-xs bg-background/50 border-destructive/20 focus-visible:ring-destructive"
              />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Vercel'de <strong>"Could not resolve chatroom"</strong> hatası alıyorsanız, kanal ID'nizi buraya elle girin. 
                <br />
                <span className="text-destructive/80 italic">Tip: atlasatakahraman için bu ID: 65286905</span>
              </p>
            </div>
          </div>

          <Separator />

          {/* Queue Command */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="queue-command" className="text-sm font-medium">
                Kayıt Komutu
              </Label>
            </div>
            <Input
              id="queue-command"
              placeholder="!sıra"
              value={settings.queueCommand}
              onChange={(e) =>
                onUpdateSettings({ queueCommand: e.target.value.trim() })
              }
              className="text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Kick chatine yazılacak sıraya girme komutu (örn: !sıra, !katıl).
            </p>
          </div>

          <Separator />

          {/* AFK Command */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="afk-command" className="text-sm font-medium">
                AFK Komutu
              </Label>
            </div>
            <Input
              id="afk-command"
              placeholder="!afk"
              value={settings.afkCommand}
              onChange={(e) =>
                onUpdateSettings({ afkCommand: e.target.value.trim() })
              }
              className="text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Kick chatine yazılınca oyuncuyu "Uzakta" işaretler.
            </p>
          </div>

          <Separator />

          {/* Disable Riot API */}
          <div className="space-y-3 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ghost className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="disable-riot-api" className="text-sm font-medium">
                  Riot ID Zorunluluğunu Kaldır
                </Label>
              </div>
              <Switch
                id="disable-riot-api"
                checked={settings.disableRiotApi}
                onCheckedChange={(checked) =>
                  onUpdateSettings({ disableRiotApi: checked })
                }
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Bu ayar açıldığında GameName#TAG kontrolü yapılmaz. Sisteme kayıt olanlar sadece Kick adıyla "Oyuncu" olarak eklenir. Şamata modları için tavsiye edilir.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
