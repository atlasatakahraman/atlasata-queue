import { useState } from "react";
import { Label } from "@/components/ui/label";
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
import type { AppSettings } from "@/types";

interface Props {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
}

export function GameTeamSettings({ settings, onUpdateSettings }: Props) {
  const [activeTab, setActiveTab] = useState("team");

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Oyun & Takım Ayarları</CardTitle>
            <CardDescription className="text-xs">
              Takım kapasitesi ve çekim animasyonu gibi ayarları yönetin.
            </CardDescription>
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-3 w-full">
          <SlidingTabsList activeValue={activeTab} className="w-full sm:w-fit mb-2">
            <TabsTrigger value="team" className="relative z-10 text-xs gap-1.5 px-4">
              Takım
            </TabsTrigger>
            <TabsTrigger value="animation" className="relative z-10 text-xs gap-1.5 px-4">
              Animasyon
            </TabsTrigger>
          </SlidingTabsList>

          <CardContent className="pt-4 px-0">
            <TabsContent value="team" className="mt-0 grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="team-size">Takım Boyutu</Label>
                <Select
                  value={String(settings.teamSize)}
                  onValueChange={(v) => onUpdateSettings({ teamSize: parseInt(v) })}
                >
                  <SelectTrigger id="team-size" className="w-full bg-background">
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
            </TabsContent>

            <TabsContent value="animation" className="mt-0 grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pick-animation">Çekim Animasyonu</Label>
                <Select
                  value={settings.pickAnimationStyle ?? "classic"}
                  onValueChange={(v) =>
                    onUpdateSettings({
                      pickAnimationStyle: v as "classic" | "list" | "spin" | "none",
                    })
                  }
                >
                  <SelectTrigger id="pick-animation" className="w-full bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Kartlar</SelectItem>
                    <SelectItem value="list">Listeleme</SelectItem>
                    <SelectItem value="spin">Çarkıfelek</SelectItem>
                    <SelectItem value="none">Yok</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Tek Çekim sırasında oyuncu seçim animasyonu türü.
                </p>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </CardHeader>
    </Card>
  );
}
