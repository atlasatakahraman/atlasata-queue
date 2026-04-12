import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ManualAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (kickUsername: string, riotId: string) => void;
  disableRiotApi: boolean;
}

export function ManualAddDialog({ open, onOpenChange, onAdd, disableRiotApi }: ManualAddDialogProps) {
  const [username, setUsername] = useState("");
  const [riotId, setRiotId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    if (!disableRiotApi && (!riotId.includes("#") || riotId.split("#")[1].trim() === "")) {
      toast.error("Hatalı Format", { description: "Lütfen '#TAG' kısmıyla birlikte tam bir Riot ID girin. Örn: İsim#TAG" });
      return;
    }

    onAdd(username.trim(), disableRiotApi ? username.trim() : riotId.trim());
    setUsername("");
    setRiotId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Yeni Oyuncu Ekle</DialogTitle>
            <DialogDescription>
              Aşağıdaki bilgileri doldurarak listeye manuel bir oyuncu ekleyebilirsiniz.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Kullanıcı Adı</Label>
              <Input
                placeholder="Örn: atlasata"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
              />
            </div>
            {!disableRiotApi && (
              <div className="space-y-2">
                <Label>Riot ID (İsim#TAG)</Label>
                <Input
                  placeholder="Örn: AtlasAta#TR1"
                  value={riotId}
                  onChange={(e) => setRiotId(e.target.value)}
                  required
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={!username.trim() || (!disableRiotApi && !riotId.trim())}>
              Ekle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
