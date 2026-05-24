"use client";

import { useState, useMemo, useEffect } from "react";
import type { PunishmentDuration, BanDuration, ModerationActionType } from "@/types/moderation";
import { PUNISHMENT_DURATIONS, BAN_DURATIONS } from "@/lib/moderation-constants";
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
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Clock,
  Ban,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";

interface ModerationActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerNames: string[]; // list of kick usernames for autocomplete
  currentWarningLevel: (kickUsername: string) => number;
  onIssueWarning: (kickUsername: string, reason: string) => void;
  onIssuePunishment: (
    kickUsername: string,
    duration: PunishmentDuration,
    reason: string,
    customDurationMs?: number,
    customDurationLabel?: string,
  ) => void;
  onIssueBan: (kickUsername: string, duration: BanDuration, reason: string) => void;
  initialKickUsername?: string;
  initialActionType?: ModerationActionType;
}

const ACTION_TYPES: Array<{
  value: ModerationActionType;
  label: string;
  icon: typeof AlertTriangle;
  colorClass: string;
}> = [
  { value: "warning", label: "Uyarı", icon: AlertTriangle, colorClass: "border-[var(--cl-warning)] text-[var(--cl-warning)] bg-[var(--cl-warning)]/10" },
  { value: "punishment", label: "Ceza", icon: Clock, colorClass: "border-[var(--cl-punishment)] text-[var(--cl-punishment)] bg-[var(--cl-punishment)]/10" },
  { value: "ban", label: "Yasak", icon: Ban, colorClass: "border-[var(--cl-banned)] text-[var(--cl-banned)] bg-[var(--cl-banned)]/10" },
];

export function ModerationActionDialog({
  open,
  onOpenChange,
  playerNames,
  currentWarningLevel,
  onIssueWarning,
  onIssuePunishment,
  onIssueBan,
  initialKickUsername = "",
  initialActionType = "warning",
}: ModerationActionDialogProps) {
  const [actionType, setActionType] = useState<ModerationActionType>(initialActionType);
  const [kickUsername, setKickUsername] = useState(initialKickUsername);
  const [reason, setReason] = useState("Silivri..");
  const [punishmentDuration, setPunishmentDuration] = useState<PunishmentDuration>("1_game");
  const [banDuration, setBanDuration] = useState<BanDuration>("permanent");
  const [customHours, setCustomHours] = useState("");
  const [playerPopoverOpen, setPlayerPopoverOpen] = useState(false);

  // Synchronize state when the dialog is opened or initial values change
  useEffect(() => {
    if (open) {
      setActionType(initialActionType);
      setKickUsername(initialKickUsername);
      setReason("Silivri.."); // Reset reason on open
    }
  }, [open, initialKickUsername, initialActionType]);

  const warningLevel = kickUsername ? currentWarningLevel(kickUsername) : 0;
  const shouldEscalate = warningLevel >= 2;

  const filteredPlayers = useMemo(() => {
    if (!kickUsername) return playerNames;
    return playerNames.filter(name =>
      name.toLowerCase().includes(kickUsername.toLowerCase())
    );
  }, [playerNames, kickUsername]);

  function handleSubmit() {
    if (!kickUsername.trim() || !reason.trim()) return;

    switch (actionType) {
      case "warning":
        onIssueWarning(kickUsername.trim(), reason.trim());
        break;
      case "punishment": {
        let customMs: number | undefined;
        let customLabel: string | undefined;
        if (punishmentDuration === "custom" && customHours) {
          customMs = parseFloat(customHours) * 60 * 60 * 1000;
          customLabel = `${customHours} Saat`;
        }
        onIssuePunishment(kickUsername.trim(), punishmentDuration, reason.trim(), customMs, customLabel);
        break;
      }
      case "ban":
        onIssueBan(kickUsername.trim(), banDuration, reason.trim());
        break;
    }

    // Reset form
    setKickUsername("");
    setReason("");
    setPunishmentDuration("1_game");
    setBanDuration("permanent");
    setCustomHours("");
    onOpenChange(false);
  }

  const confirmColor = actionType === "warning"
    ? "bg-[var(--cl-warning)] hover:bg-[var(--cl-warning)]/90 text-white"
    : actionType === "punishment"
    ? "bg-[var(--cl-punishment)] hover:bg-[var(--cl-punishment)]/90 text-white"
    : "bg-[var(--cl-banned)] hover:bg-[var(--cl-banned)]/90 text-white";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" id="moderation-action-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">Yeni Moderasyon İşlemi</DialogTitle>
          <DialogDescription>
            Oyuncuya uyarı, ceza veya yasak verin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Action Type Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">İşlem Türü</Label>
            <div className="grid grid-cols-3 gap-2">
              {ACTION_TYPES.map(at => {
                const Icon = at.icon;
                const isActive = actionType === at.value;
                return (
                  <button
                    key={at.value}
                    type="button"
                    onClick={() => setActionType(at.value)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border-2 px-3 py-2.5 text-xs font-medium transition-all ${
                      isActive
                        ? at.colorClass
                        : "border-border text-muted-foreground hover:border-border/80 hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {at.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Player Name with Autocomplete */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Oyuncu</Label>
            <Popover open={playerPopoverOpen} onOpenChange={setPlayerPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between text-sm font-normal h-9"
                >
                  {kickUsername || "Oyuncu seçin veya yazın..."}
                  <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Oyuncu ara..."
                    value={kickUsername}
                    onValueChange={setKickUsername}
                  />
                  <CommandList>
                    <CommandEmpty>Sonuç bulunamadı. Manuel girin.</CommandEmpty>
                    <CommandGroup>
                      {filteredPlayers.slice(0, 10).map(name => (
                        <CommandItem
                          key={name}
                          value={name}
                          onSelect={(v) => {
                            setKickUsername(v);
                            setPlayerPopoverOpen(false);
                          }}
                        >
                          {name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {/* Manual input fallback */}
            <Input
              placeholder="veya manuel kullanıcı adı girin"
              value={kickUsername}
              onChange={(e) => setKickUsername(e.target.value)}
              className="text-sm h-9"
            />
          </div>

          {/* Escalation warning */}
          {actionType === "warning" && shouldEscalate && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--cl-warning)]/10 border border-[var(--cl-warning)]/30">
              <AlertTriangle className="h-4 w-4 text-[var(--cl-warning)] shrink-0" />
              <p className="text-xs text-[var(--cl-warning)]">
                Bu oyuncu zaten {warningLevel} uyarı almış. Ceza uygulamayı düşünebilirsiniz.
              </p>
            </div>
          )}

          {/* Conditional: Punishment Duration */}
          {actionType === "punishment" && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Ceza Süresi</Label>
              <Select
                value={punishmentDuration}
                onValueChange={(v) => setPunishmentDuration(v as PunishmentDuration)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PUNISHMENT_DURATIONS.map(d => (
                    <SelectItem key={d.value} value={d.value}>
                      <span className="flex items-center gap-2">
                        {d.label}
                        <span className="text-muted-foreground text-[10px]">— {d.description}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {punishmentDuration === "custom" && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Özel Süre (Saat)</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Örn: 12"
                    value={customHours}
                    onChange={(e) => setCustomHours(e.target.value)}
                    className="text-sm h-9"
                  />
                </div>
              )}
            </div>
          )}

          {/* Conditional: Ban Duration */}
          {actionType === "ban" && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Yasaklama Süresi</Label>
              <Select
                value={banDuration}
                onValueChange={(v) => setBanDuration(v as BanDuration)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BAN_DURATIONS.map(d => (
                    <SelectItem key={d.value} value={d.value}>
                      <span className="flex items-center gap-2">
                        {d.label}
                        <span className="text-muted-foreground text-[10px]">— {d.description}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Sebep</Label>
            <Textarea
              placeholder="İşlem sebebini yazın..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-sm min-h-[80px] resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button
            className={confirmColor}
            onClick={handleSubmit}
            disabled={!kickUsername.trim() || !reason.trim()}
          >
            {actionType === "warning" ? "Uyarı Ver" : actionType === "punishment" ? "Ceza Ver" : "Yasakla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
