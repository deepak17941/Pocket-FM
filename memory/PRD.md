# Pocket FM - Offline Music Player

## Overview
A minimal, modern offline music player for iOS + Android (Expo + React Native). Users add music from device files, discover new tracks from the **Audius** open-music network, paste any direct audio URL, and play everything offline with a beautiful Now Playing screen. No login, no server-side account.

## Key Features
- **Add music from device** (expo-document-picker + expo-file-system; files copied to app-local storage).
- **Discover tab (2 modes)**:
  - **Search** — queries Audius API for real tracks (indie, hip-hop, electronic, lofi, etc.) with artwork, duration, play counts. One-tap download saves the Audius stream to offline library.
  - **Paste URL** — paste any direct `.mp3 / .m4a / .ogg / .wav / .flac` link; backend validates content-type / reachability before the app downloads it. Includes a copyright disclaimer.
- **Library** — all tracks (device + downloaded) in one list with album-art tiles, count, more-menu.
- **Playlists** — create/delete/rename, add via sheet menu, playlist detail with Play-All.
- **Favorites** — heart toggle + filtered view.
- **Now Playing** — full-screen modal: large art tile, tap-to-seek bar, play/pause/next/prev, favorite.
- **Mini Player** — persistent blurred pill above tabs with live progress line.
- **Sleep Timer** — 5/15/30/45/60/90 min chips in Settings; auto-pauses playback.
- **Background + lock-screen playback** — expo-audio's `setActiveForLockScreen(true, metadata)` called on every new track: shows play/pause + artist/title on lock screen (Android notification + foreground service; iOS MPNowPlayingInfoCenter / Control Center). **Requires a custom dev build** — not supported by Expo Go.
- **Auto light/dark theme** — follows system.
- **Visual identity**: electric-violet `#7C5CFF` accent on monochrome base; AI-generated soundwave app icon (Nano Banana).

## Architecture
**Frontend (`/app/frontend/`)**
- Routes (expo-router file-based):
  - `app/_layout.tsx` — providers + Stack
  - `app/(tabs)/` — Library / Discover / Playlists / Favorites / Settings
  - `app/player.tsx` — Now Playing modal
  - `app/playlist/[id].tsx` — playlist detail
- Non-route code in `src/`:
  - `src/context/LibraryContext.tsx` — AsyncStorage-persisted tracks/playlists/favorites
  - `src/context/PlayerContext.tsx` — expo-audio, queue, sleep timer, lock-screen controls
  - `src/store/`, `src/components/`, `src/theme/`, `src/utils/`
  - `src/utils/online.ts` — search / url-check / download helpers

**Backend (`/app/backend/server.py`)**
- `GET /api/search?q=...&limit=...` — Audius `/v1/tracks/search` wrapper → normalized SearchHit list.
- `GET /api/url-check?url=...` — HEAD/range GET + content-type validation for user-pasted audio URLs.

## Deploy note for background / lock-screen audio
Expo Go cannot deliver background audio or lock-screen controls. To see them on a real device, build a dev client: `npx expo prebuild && npx expo run:android` (or `run:ios`) or use the Emergent Build / EAS Build. The required permissions are already in `app.json`.

## Business Enhancement Idea
Add an "Import from Google Drive / Dropbox" button next to Paste URL — one-tap cloud-to-offline imports drive strong activation for users migrating from streaming platforms.
