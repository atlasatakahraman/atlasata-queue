# MEMORY.md — Antigravity Dream Memory Index
<!-- Last consolidated: 2026-05-24T05:06:00+03:00 -->
<!-- Conversations scanned: 9 -->
<!-- Dream scope: project -->

## User Profile
- **Name**: atlasata / TheAtlas
- **Platform**: Arch Linux — Hyprland (Wayland), caelestia-shell rice
- **GPU**: NVIDIA GTX 1600 series (Turing)
- **Preferred AI model**: Claude Opus 4.6 (Thinking)
- **Coding prefs**: Research first, plan before exec, premium dark aesthetics, modern tooling
- **Language**: Turkish UI labels, English code/comments

## Active Projects
### 1. TheAtlas Queue (ACTIVE — this workspace)
- **Location**: `/home/atlasata/code/web/TheAtlas-Queue/`
- **Stack**: Next.js 16.2.3, React 19.2.4, Tailwind 4, Shadcn 4.2, @dnd-kit, next-auth 5 beta, Sonner, cmdk, lucide-react
- **Fonts**: Anthropic Sans / Serif / Mono (custom woff2 in `src/app/fonts/`)
- **Theme**: "Caelestia Light Fidelity" (light) / "Caelestia Dark" (dark) — oklch-based palette
- **Status**: UI redesign complete. Randomization animations (Çark Çekimi / Liste Çekimi) implemented. Easter eggs added. Auth flow works. Build passes clean.

## Architecture
- `src/app/` — Next.js App Router pages (page.tsx, login/page.tsx, not-found.tsx, error.tsx, layout.tsx)
- `src/components/` — All UI components (dashboard.tsx is the main orchestrator, ~860 lines)
- `src/components/ui/` — Shadcn primitives (button, card, dialog, sheet, tabs, table, etc.)
- `src/hooks/` — Custom hooks: use-queue.ts, use-settings.ts, use-easter-eggs.ts, use-kick-chat.ts, use-live-status.ts, use-moderation.ts
- `src/lib/` — Utilities: kick.ts, riot.ts, auth.ts, utils.ts, constants.ts, moderation-constants.ts
- `src/types/` — TypeScript types: index.ts, moderation.ts
- `src/proxy.ts` — Proxy config
- `public/` — Static assets including TheAtlas logos (dark/light variants)
- `assets/` — Additional assets

## Key Technical Decisions
- **Caelestia palette**: oklch-based color system defined in `globals.css` — both light and dark themes
- **Anthropic typography**: Custom serif/sans/mono font family loaded as local woff2
- **Glass morphism**: `.glass`, `.glass-subtle`, `.glass-warm` utility classes in globals.css
- **Underline tabs**: Tab navigation uses underline variant instead of boxed tabs
- **Moderation system**: Integrated with warning/punishment/banned severity levels and dialog workflow
- **Randomization modes**: "Yok" (none), "Liste Çekimi" (sequential scroll animation), "Çark Çekimi" (SVG fortune wheel)
- **Fortune wheel colors**: Alternate between primary palette colors (0-1-0-1 pattern)
- **Team randomization**: All team members randomized together — no duplicate players across teams
- **Easter eggs**: Trophy "Chickenn!" tooltip, logo 5-tap toast, watermark 3s hover, Konami confetti, "badapple" typing trigger
- **Dynamic imports**: SinglePickDialog loaded via `next/dynamic` with `ssr: false`
- **Toast control**: All toast() calls gated by `settings.enableToasts`

## User Corrections & Preferences
- player-card-info hover details delay set to 1 second (1000ms) to avoid annoying overlays during dragging/scanning (2026-05-24)
- User accidentally rewrote files mid-session — needed restoration of easter egg code (2026-05-24)
- "Çarkıfelek" means fortune wheel — user clarified with attachment reference (2026-05-24)
- Rename animation options: "Kapalı" → "Yok", existing scroll → "Liste Çekimi", new wheel → "Çark Çekimi" (2026-05-24)
- Trophy tooltip background must use primary brand color (2026-05-24)
- User prefers Turkish labels in UI, English in code
- "Chickenn!" is the recurring inside joke / easter egg phrase

## Resolved Issues
- Logo not loading on login page — fixed Next.js Image path
- Auth `ClientFetchError` — NEXTAUTH_SECRET / provider config resolved
- Build errors from moderation system integration — fixed and verified clean compile
- Randomization loop repeating same players — fixed with proper shuffling

## Environment Notes
- **Workspace root**: `/home/atlasata/code/web/TheAtlas-Queue/`
- **Package manager**: npm (bun.lock also present)
- **Dev server**: `npm run dev` → localhost:3000
- **Build**: `npm run build` — clean as of 2026-05-24
- **Spotify**: User listens to NEFFEX while coding
