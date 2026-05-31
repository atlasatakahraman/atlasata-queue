import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

export function CommandSystemSettings({ settings, onUpdateSettings }: Props) {
  const [activeTab, setActiveTab] = useState("commands");
  const isDebugMode = process.env.NEXT_PUBLIC_DEBUG === "true";

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Komutlar & Sistem Ayarları</CardTitle>
            <CardDescription className="text-xs">
              Sohbet komutları ve sistem bildirimleri yapılandırması.
            </CardDescription>
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-3 w-full">
          <SlidingTabsList activeValue={activeTab} className="w-full sm:w-fit mb-2">
            <TabsTrigger value="commands" className="relative z-10 text-xs gap-1.5 px-4">
              Komutlar
            </TabsTrigger>
            <TabsTrigger value="system" className="relative z-10 text-xs gap-1.5 px-4">
              Sistem
            </TabsTrigger>
          </SlidingTabsList>

          <CardContent className="pt-4 px-0">
            <TabsContent value="commands" className="mt-0 grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="queue-command">Kayıt Komutu</Label>
                <Input
                  id="queue-command"
                  placeholder="!sıra"
                  value={settings.queueCommand}
                  onChange={(e) =>
                    onUpdateSettings({ queueCommand: e.target.value.trim() })
                  }
                  className="text-sm bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="afk-command">AFK Komutu</Label>
                <Input
                  id="afk-command"
                  placeholder="!afk"
                  value={settings.afkCommand}
                  onChange={(e) =>
                    onUpdateSettings({ afkCommand: e.target.value.trim() })
                  }
                  className="text-sm bg-background"
                />
              </div>
            </TabsContent>

            <TabsContent value="system" className="mt-0 space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4 bg-background">
                <div className="space-y-0.5">
                  <Label className="text-base">Sistem Bildirimleri (Toast)</Label>
                  <p className="text-sm text-muted-foreground">
                    Ekranın köşesinde çıkan başarı ve hata mesajlarını gösterir.
                  </p>
                </div>
                <Switch
                  checked={settings.enableToasts !== false}
                  onCheckedChange={(checked) =>
                    onUpdateSettings({ enableToasts: checked })
                  }
                />
              </div>

              {(isDebugMode || !!settings.manualChatroomId) && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-4 mt-6">
                  <h4 className="text-sm font-medium text-destructive">Hata Ayıklama (Troubleshooting)</h4>
                  <div className="space-y-2 max-w-sm">
                    <Label htmlFor="manual-chatroom-id" className="text-destructive">
                      Manuel Chatroom ID
                    </Label>
                    <Input
                      id="manual-chatroom-id"
                      placeholder="Örn: 65286905"
                      value={settings.manualChatroomId}
                      onChange={(e) =>
                        onUpdateSettings({
                          manualChatroomId: e.target.value.replace(/[^0-9]/g, ""),
                        })
                      }
                      className="text-sm bg-background border-destructive/20 focus-visible:ring-destructive"
                    />
                    <p className="text-xs text-muted-foreground">
                      Kanal ID otomatik bulunamazsa doldurun.
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </CardHeader>
    </Card>
  );
}
