import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SlidingTabsList } from "@/components/ui/sliding-tabs";
import type { AppSettings, RiotRegion } from "@/types";
import { REGION_LABELS } from "@/types";

interface Props {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
}

export function ApiConnectionSettings({ settings, onUpdateSettings }: Props) {
  const [activeTab, setActiveTab] = useState("riot");
  const regions = Object.entries(REGION_LABELS) as [RiotRegion, string][];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">API & Bağlantılar</CardTitle>
            <CardDescription className="text-xs">
              Platform entegrasyonlarını yapılandırın.
            </CardDescription>
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-3 w-full">
          <SlidingTabsList activeValue={activeTab} className="w-full sm:w-fit mb-2">
            <TabsTrigger value="riot" className="relative z-10 text-xs gap-1.5 px-4">
              Riot Games
            </TabsTrigger>
            <TabsTrigger value="kick" className="relative z-10 text-xs gap-1.5 px-4">
              Kick
            </TabsTrigger>
          </SlidingTabsList>

          <CardContent className="pt-4 px-0">
            <TabsContent value="riot" className="mt-0 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="riot-api-key">Riot API Anahtarı</Label>
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
                    onChange={(e) => onUpdateSettings({ riotApiKey: e.target.value })}
                    className="font-mono text-sm bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    developer.riotgames.com adresinden alabilirsiniz.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region-select">Bölge</Label>
                  <Select
                    value={settings.riotRegion}
                    onValueChange={(v) =>
                      onUpdateSettings({ riotRegion: v as RiotRegion })
                    }
                  >
                    <SelectTrigger id="region-select" className="w-full bg-background">
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
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4 bg-background">
                <div className="space-y-0.5">
                  <Label className="text-base">Riot ID Zorunluluğunu Kaldır</Label>
                  <p className="text-sm text-muted-foreground">
                    Oyuncular sadece Kick kullanıcı adı ile sıraya katılabilir (Riot API kullanılmaz).
                  </p>
                </div>
                <Switch
                  checked={settings.disableRiotApi}
                  onCheckedChange={(checked) =>
                    onUpdateSettings({ disableRiotApi: checked })
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="kick" className="mt-0">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="kick-channel">Kick Kanal Adı</Label>
                  {settings.kickChannelName && (
                    <Badge variant="secondary" className="text-[10px]">
                      Aktif
                    </Badge>
                  )}
                </div>
                <Input
                  id="kick-channel"
                  placeholder="Kanal adı oturum açıldığında otomatik ayarlanır"
                  value={settings.kickChannelName}
                  disabled
                  readOnly
                  className="text-sm opacity-70 cursor-not-allowed max-w-sm bg-background/50"
                />
                <p className="text-xs text-muted-foreground">
                  Kick girişinden otomatik alınır, düzenlenemez.
                </p>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </CardHeader>
    </Card>
  );
}
