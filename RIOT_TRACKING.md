# Riot Live Game Tracking — Feature Documentation

## Overview

This feature adds Riot API live game tracking and post-match history to TheAtlas Queue.
It follows a **client-orchestrated, server-proxied** architecture with **no database** — all
persistence uses `localStorage` on the browser side, and all Riot API calls go through
secure Next.js API routes so the API key is never exposed to the client.

## Architecture

```
Browser (localStorage + React state)
  │
  ├── useGameTracker() hook
  │     ├── resolveAndTrack() → /api/riot/resolve
  │     ├── checkActiveGame() → /api/riot/active-game   (polls every 30s)
  │     ├── fetchMatchResult() → /api/riot/matches + /api/riot/match
  │     └── Leader tab election (BroadcastChannel fallback via localStorage)
  │
  └── localStorage keys:
        ├── theatlas_tracked_account   → resolved Riot identity
        ├── theatlas_tracking_session  → live tracking state machine
        ├── theatlas_match_history     → finalized match results (max 50)
        ├── theatlas_leader_tab        → multi-tab coordination
        └── theatlas_storage_version   → migration versioning
```

## State Machine

```
idle → polling → in_game → ended_waiting_match → match_found → polling
                    ↑                                              │
                    └──────────────────────────────────────────────┘
```

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/riot` | POST | Fetch player ranked data for queue (existing) |
| `/api/riot/resolve` | POST | Resolve Riot ID → PUUID + summoner ID |
| `/api/riot/active-game` | POST | Check if player is in a live game (Spectator-v5) |
| `/api/riot/matches` | POST | Get recent match IDs (Match-v5) |
| `/api/riot/match` | POST | Get detailed match result (Match-v5) |

All routes use `runtime = 'nodejs'` and `dynamic = 'force-dynamic'`.

## Security

- `RIOT_API_KEY` is **never** sent to the browser
- All Riot API calls go through server-side API routes
- API routes use the `server-only` package to prevent client-side imports
- The Riot client module (`src/lib/riot/client.ts`) has an `import "server-only"` guard
- PUUID is stored in localStorage for orchestration but is not rendered in UI
- Client sends only the minimum data needed for each API call

## Environment Variables

```env
RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

The `RIOT_API_KEY` is required for all Riot API features. Obtain one from the
[Riot Developer Portal](https://developer.riotgames.com/).

## UI Components

### Dashboard Tab: "Takip" (Tracking)

1. **Setup Card** — Riot ID input (`İsim#TAG`) + region selector + "Takibi Başlat" button
2. **Status Card** — Shows tracked player info with profile icon, tracking status badge
3. **Live Game Widget** — Appears during active games with:
   - Live pulse indicator
   - Real-time timer (updates every second, client-side calculated from `gameStartTime`)
   - Team participants with champion icons
   - Game mode badge
4. **Match Waiting Indicator** — Shows while waiting for Riot match ingestion (90s delay)
5. **Match Result (Maç Sonucu)** — Win/loss display with KDA, CS, gold, team summaries
6. **Match History (Maç Geçmişi)** — Scrollable list of past matches with aggregate win rate

## Polling Strategy

| Scenario | Interval |
|----------|----------|
| Active game check (tab visible) | 30s |
| Tab hidden | Paused |
| Match finalization (after game end) | 90s initial wait, then 30s retries |
| Max match check attempts | 10 |
| Leader tab heartbeat | 15s timeout |

## Multi-Tab Behavior

- Only one tab actively polls Riot APIs ("leader" tab)
- Other tabs refresh from localStorage
- Leadership is claimed via `theatlas_leader_tab` key with timestamp
- If the leader tab closes or goes stale (>15s), another tab auto-claims

## Match Finalization Flow

1. Spectator API previously returned active game data
2. Spectator API returns "not in game" → state transitions to `ended_waiting_match`
3. Wait 90 seconds for Riot's match ingestion delay
4. Fetch recent match IDs via Match-v5 by PUUID
5. For each match ID, fetch detail and compare `info.gameId` to stored spectator `gameId`
6. If match found → store in history, show result card, return to polling
7. If not found after 10 attempts (~5 minutes) → give up, return to polling

### Edge Cases Handled

- **Page refresh during waiting** — Pending state restored from localStorage
- **Remakes / no match produced** — Gives up after max retries
- **Multiple tabs** — Only leader polls; others consume shared state
- **Tab hidden** — Polling pauses to save resources
- **Network errors** — Silently retried, doesn't break the polling loop

## Known Limitations (No-Database Architecture)

1. **Browser-local history** — Match history is stored in localStorage and is NOT shared
   across devices or browsers
2. **No cross-device sync** — Each browser/device has its own tracking state and history
3. **Closing all tabs** — Tracking stops when all tabs are closed; it resumes when
   reopened IF the tracked account is still in localStorage
4. **No server-side durability** — There is no background job that continues tracking
   when no browser tab is open
5. **localStorage limits** — ~5-10MB depending on browser; history is capped at 50 matches
6. **Vercel stateless functions** — API routes don't maintain any state between invocations;
   each request independently calls the Riot API
7. **Riot API rate limits** — The server client has retry/429 handling, but heavy polling
   with many concurrent users may hit rate limits
8. **DDragon version** — Champion icon URL uses a hardcoded DDragon version (15.7.1);
   this should be updated periodically to stay current

## Files

### New Files
- `src/lib/riot/client.ts` — Server-only Riot API client
- `src/lib/riot/types.ts` — Type definitions for tracking feature
- `src/lib/riot/storage.ts` — Browser localStorage utilities
- `src/app/api/riot/resolve/route.ts` — Identity resolution API
- `src/app/api/riot/active-game/route.ts` — Spectator API proxy
- `src/app/api/riot/matches/route.ts` — Match list API
- `src/app/api/riot/match/route.ts` — Match detail API
- `src/hooks/use-game-tracker.ts` — Main tracking hook
- `src/components/live-game-widget.tsx` — Live game widget
- `src/components/match-result.tsx` — Match result card
- `src/components/match-history.tsx` — Match history list
- `src/components/game-tracker-panel.tsx` — Combined tracker panel

### Modified Files
- `src/app/api/riot/route.ts` — Updated to use new server client
- `src/components/dashboard.tsx` — Added "Takip" tab with tracker integration
- `package.json` — Added `server-only` dependency
