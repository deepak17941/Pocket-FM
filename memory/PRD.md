# Pocket FM - Offline Music Player

## Overview
A minimal, modern offline music player for iOS + Android built with Expo + React Native. Users add audio files from their device, organize them into playlists and favorites, and play them back with a beautiful Now Playing screen. Fully local, no auth, no server.

## Key Features
- **Add music from device**: Pick audio files via `expo-document-picker`; files are copied to the app's document directory for persistence.
- **Library**: Track list with album art (deterministic color tiles), count, title + artist parsed from filename, favorite indicator.
- **Playlists**: Create / delete / rename, add tracks via sheet menu, dedicated playlist detail screen with Play-All.
- **Favorites**: Quick heart toggle; filtered view.
- **Now Playing**: Full-screen modal with gorgeous album art, seek bar (tap-to-seek), play/pause, next/prev, favorite toggle.
- **Mini Player**: Persistent blur-pill above bottom tabs with progress line; tap to expand.
- **Sleep Timer**: 5/15/30/45/60/90 min options in Settings; auto-pauses playback.
- **Background audio**: Configured via `expo-audio`'s `setAudioModeAsync({ shouldPlayInBackground: true })` + iOS `UIBackgroundModes: ["audio"]` + Android `FOREGROUND_SERVICE_MEDIA_PLAYBACK`.
- **Auto theme**: Light + dark, follows system.

## Architecture
- Routes (expo-router file-based):
  - `app/_layout.tsx` — providers + Stack
  - `app/(tabs)/` — Library / Playlists / Favorites / Settings
  - `app/player.tsx` — Now Playing modal
  - `app/playlist/[id].tsx` — playlist detail
- Non-route code in `src/`:
  - `src/context/LibraryContext.tsx` — tracks, playlists, favorites (AsyncStorage persisted)
  - `src/context/PlayerContext.tsx` — expo-audio playback, queue, sleep timer
  - `src/store/` — AsyncStorage helpers + types
  - `src/components/` — AlbumArt, TrackItem, MiniPlayer, EmptyState
  - `src/theme/theme.ts` — Swiss high-contrast palette (#FF4500 accent)
  - `src/utils/picker.ts` — file picker + copy + duration probe

## Known Limitations
- **Lock-screen / notification controls**: require a custom dev client (won't work in Expo Go). Background audio itself does work.
- **Album art from file metadata**: not yet implemented — we use deterministic colored tiles derived from track id. Can be added later via a native metadata reader.
- **Web preview**: file picker works but selected files are memory-only; persistent storage is device-only.

## Business Enhancement Idea
Add a "Local Import from Cloud" action (Google Drive / Dropbox one-tap) so users can pull audio from cloud without leaving the app — boosts activation for users switching from streaming services.
