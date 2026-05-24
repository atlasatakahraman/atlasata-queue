# MEMORY.md — Antigravity Dream Memory Index
<!-- Last consolidated: 2026-05-24T23:06:00+03:00 -->
<!-- Conversations scanned: 10 -->
<!-- Dream scope: project -->

## User Profile
- **Name**: atlasata / TheAtlas / atlasfirarda
- **Platform**: Windows (primary dev machine as of 2026-05-24); previously Arch Linux — Hyprland
- **GPU**: NVIDIA GTX 1600 series (Turing)
- **Preferred AI model**: Claude Opus 4.6 (Thinking)
- **Coding prefs**: Research first, plan before exec, premium dark aesthetics, modern tooling
- **Language**: Turkish UI labels, English code/comments

## Active Projects
### 1. TheAtlas Queue (ACTIVE — this workspace)
- **Location**: `c:\atlasfirarda\TheAtlas (NextJS)\TheAtlas-Queue`
- **Stack**: Next.js 16.2.3, React 19.2.4, Tailwind 4, Shadcn 4.2, @dnd-kit, next-auth 5 beta, Sonner, cmdk, lucide-react, @base-ui/react, radix-ui
- **Fonts**: Anthropic Sans / Serif / Mono (custom woff2 in `src/app/fonts/`)
- **Theme**: "Caelestia Light Fidelity" (light) / "Caelestia Dark" (dark) — oklch-based palette
- **Version**: 3.0.6
- **Status**: UI redesign complete. Randomization animations implemented. Easter eggs active. Auth flow works. Moderation system integrated. Queue chat commands (`!sıra`, `!afk`) working.

## Architecture
- `src/app/` — Next.js App Router pages (page.tsx, login/page.tsx, not-found.tsx, error.tsx, layout.tsx, loading.tsx)
- `src/components/` — UI components:
  - `dashboard.tsx` — Main orchestrator (~1550 lines)
  - `header.tsx` — App header
  - `player-card.tsx` — Player card display
  - `player-context-menu.tsx` — Right-click actions for players
  - `sortable-player-row.tsx` — Drag-and-drop queue rows
  - `queue-table.tsx` — Queue table view
  - `team-display.tsx` — Team assignment display
  - `single-pick-dialog.tsx` — Pick animation dialogs (Liste Çekimi / Çark Çekimi)
  - `settings-sheet.tsx` — Settings panel
  - `moderation-panel.tsx` — Moderation dashboard
  - `moderation-action-dialog.tsx` — Moderation action workflow
  - `moderation-player-badge.tsx` — Player moderation badges
  - `manual-add-dialog.tsx` — Manual player add
  - `edit-player-dialog.tsx` — Edit player details
  - `global-context-menu.tsx` — App-wide context menu
  - `github-button.tsx` — GitHub link button
  - `login-form.tsx` — Login UI
  - `bad-apple-overlay.tsx` — Bad Apple easter egg
  - `confetti-overlay.tsx` — Confetti easter egg
  - `watermark.tsx` — App watermark
  - `theme-toggle.tsx` — Theme switcher
  - `providers.tsx` — Context providers
- `src/components/ui/` — Shadcn primitives (button, card, dialog, sheet, tabs, table, select, etc.)
- `src/hooks/` — Custom hooks: use-queue.ts, use-settings.ts, use-easter-eggs.ts, use-kick-chat.ts, use-live-status.ts, use-moderation.ts
- `src/lib/` — Utilities: kick.ts, riot.ts, auth.ts, utils.ts, constants.ts, moderation-constants.ts
- `src/types/` — TypeScript types: index.ts, moderation.ts
- `src/proxy.ts` — Proxy config

## Key Technical Decisions
- **Caelestia palette**: oklch-based color system defined in `globals.css` — both light and dark themes
- **Anthropic typography**: Custom serif/sans/mono font family loaded as local woff2
- **Glass morphism**: `.glass`, `.glass-subtle`, `.glass-warm` utility classes in globals.css
- **Underline tabs**: Tab navigation uses underline variant instead of boxed tabs
- **Moderation system**: Warning/punishment/banned severity levels with dialog workflow
- **Randomization modes**: "Yok" (none), "Liste Çekimi" (sequential scroll), "Çark Çekimi" (SVG fortune wheel)
- **Fortune wheel colors**: Alternate between primary palette colors (0-1-0-1 pattern)
- **Team randomization**: All members randomized together — no duplicate players across teams
- **Easter eggs**: Trophy "Chickenn!" tooltip, logo 5-tap toast, watermark 3s hover, Konami confetti, "badapple" typing trigger
- **Dynamic imports**: SinglePickDialog loaded via `next/dynamic` with `ssr: false`
- **Toast control**: All toast() calls gated by `settings.enableToasts`
- **Chat commands**: `!sıra` (join queue), `!afk` (toggle away status) — processed in use-kick-chat.ts
- **RiotId toggle**: Setting to show/hide Riot IDs in player cards

## User Corrections & Preferences
- player-card-info hover delay: 1000ms to avoid annoying overlays during drag (2026-05-24)
- "Çarkıfelek" means fortune wheel (2026-05-24)
- Rename animation options: "Kapalı" → "Yok", scroll → "Liste Çekimi", wheel → "Çark Çekimi" (2026-05-24)
- Trophy tooltip background must use primary brand color (2026-05-24)
- Turkish labels in UI, English in code
- "Chickenn!" is the recurring inside joke / easter egg phrase

## Resolved Issues
- Logo not loading on login page — fixed Next.js Image path
- Auth `ClientFetchError` — NEXTAUTH_SECRET / provider config resolved
- Build errors from moderation system integration — fixed
- Randomization loop repeating same players — fixed with proper shuffling
- `!sıra` and `!afk` command parity issues — multiple fixes applied (2026-05-24)
- isAway queue ordering bug — fixed (2026-05-24)
- RiotId toggle setting not persisting — fixed (2026-05-24)
- Transition delays regression — fixed (2026-05-24)
- Banned users moderation logic — fixed (2026-05-24)

## Environment Notes
- **Workspace root**: `c:\atlasfirarda\TheAtlas (NextJS)\TheAtlas-Queue`
- **Package manager**: npm (bun.lock also present)
- **Dev server**: `npm run dev` → localhost:3000
- **Build**: `npm run build` — clean as of 2026-05-24
