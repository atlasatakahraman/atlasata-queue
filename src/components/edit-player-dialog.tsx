"use client";

import { useState, useEffect } from "react";
import type { QueuePlayer } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface EditPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: QueuePlayer | null;
  onSave: (id: string, data: Partial<QueuePlayer>) => void;
  disableRiotApi: boolean;
}

export function EditPlayerDialog({
  open,
  onOpenChange,
  player,
  onSave,
  disableRiotApi,
}: EditPlayerDialogProps) {
  const [kickUsername, setKickUsername] = useState("");
  const [gameName, setGameName] = useState("");
  const [tagLine, setTagLine] = useState("");

  // Sync form with player when dialog opens
  useEffect(() => {
    if (player && open) {
      setKickUsername(player.kickUsername);
      setGameName(player.riotGameName);
      setTagLine(player.riotTagLine);
    }
  }, [player, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!player) return;
    if (!kickUsername.trim()) return;

    if (!disableRiotApi && !gameName.trim()) {
      toast.error("Hatalı Format", {
        description: "Lütfen oyuncu adını girin.",
      });
      return;
    }

    onSave(player.id, {
      kickUsername: kickUsername.trim(),
      ...(disableRiotApi
        ? { riotGameName: kickUsername.trim() }
        : {
            riotGameName: gameName.trim(),
            riotTagLine: tagLine.trim() || "TR1",
          }),
    });

    toast.success("Oyuncu Güncellendi", {
      description: `${kickUsername.trim()} bilgileri güncellendi.`,
    });
    onOpenChange(false);
  };

  if (!player) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Oyuncu Düzenle</DialogTitle>
            <DialogDescription>
              {player.riotGameName}#{player.riotTagLine} oyuncusunun bilgilerini
              düzenleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Kick Kullanıcı Adı</Label>
              <Input
                placeholder="Örn: atlasata"
                value={kickUsername}
                onChange={(e) => setKickUsername(e.target.value)}
                autoFocus
                required
              />
            </div>
            {!disableRiotApi && (
              <>
                <div className="space-y-2">
                  <Label>Oyuncu Adı</Label>
                  <Input
                    placeholder="Örn: AtlasAta"
                    value={gameName}
                    onChange={(e) => setGameName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tag</Label>
                  <Input
                    placeholder="Örn: TR1"
                    value={tagLine}
                    onChange={(e) => setTagLine(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={
                !kickUsername.trim() ||
                (!disableRiotApi && !gameName.trim())
              }
            >
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
