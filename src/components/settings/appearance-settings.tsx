import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { SlidingTabsList } from "@/components/ui/sliding-tabs";
import type { AppSettings } from "@/types";

interface Props {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
}

export function AppearanceSettings({ settings, onUpdateSettings }: Props) {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Görünüm Ayarları</CardTitle>
            <CardDescription className="text-xs">
              Sayfa üzerindeki metinleri ve başlıkları özelleştirin.
            </CardDescription>
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-3 w-full">
          <SlidingTabsList activeValue={activeTab} className="w-full sm:w-fit mb-2">
            <TabsTrigger value="general" className="relative z-10 text-xs gap-1.5 px-4">
              Genel
            </TabsTrigger>
            <TabsTrigger value="queue-card" className="relative z-10 text-xs gap-1.5 px-4">
              Sıra Kartı
            </TabsTrigger>
            <TabsTrigger value="empty-state" className="relative z-10 text-xs gap-1.5 px-4">
              Boş Durum
            </TabsTrigger>
          </SlidingTabsList>

          <CardContent className="pt-4 px-0">
            <TabsContent value="general" className="mt-0 grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="page-title">Sayfa Başlığı</Label>
                <Input
                  id="page-title"
                  placeholder="Şamata Sırası"
                  value={settings.pageTitle ?? ""}
                  onChange={(e) => onUpdateSettings({ pageTitle: e.target.value })}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="page-subtitle">Sayfa Alt Başlığı</Label>
                <Input
                  id="page-subtitle"
                  placeholder="ARAM Mayhem 5v5 özel lobi yönetimi"
                  value={settings.pageSubtitle ?? ""}
                  onChange={(e) => onUpdateSettings({ pageSubtitle: e.target.value })}
                  className="bg-background"
                />
              </div>
            </TabsContent>

            <TabsContent value="queue-card" className="mt-0 grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="queue-card-title">Oyuncu Sırası Başlığı</Label>
                <Input
                  id="queue-card-title"
                  placeholder="Oyuncu Sırası"
                  value={settings.queueCardTitle ?? ""}
                  onChange={(e) => onUpdateSettings({ queueCardTitle: e.target.value })}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="queue-card-desc">Oyuncu Sırası Açıklaması</Label>
                <Input
                  id="queue-card-desc"
                  placeholder="Kick sohbetinde {command} yazarak katılın"
                  value={settings.queueCardDescription ?? ""}
                  onChange={(e) => onUpdateSettings({ queueCardDescription: e.target.value })}
                  className="bg-background"
                />
              </div>
            </TabsContent>

            <TabsContent value="empty-state" className="mt-0 grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="empty-queue-title">Boş Sıra Başlığı</Label>
                <Input
                  id="empty-queue-title"
                  placeholder="Sırada henüz kimse yok"
                  value={settings.emptyQueueTitle ?? ""}
                  onChange={(e) => onUpdateSettings({ emptyQueueTitle: e.target.value })}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="empty-queue-desc">Boş Sıra Açıklaması</Label>
                <Input
                  id="empty-queue-desc"
                  placeholder="Kick sohbetinde {command} yazarak..."
                  value={settings.emptyQueueDescription ?? ""}
                  onChange={(e) => onUpdateSettings({ emptyQueueDescription: e.target.value })}
                  className="bg-background"
                />
                <p className="text-[10px] text-muted-foreground">
                  <code>{"{command}"}</code> yerine kayıt komutu otomatik yazılır.
                </p>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </CardHeader>
    </Card>
  );
}
