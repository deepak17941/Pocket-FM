import * as FileSystem from 'expo-file-system/legacy';
import { createAudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';
import { Track } from '../store/types';

const IS_WEB = Platform.OS === 'web';

const MUSIC_DIR = IS_WEB ? '' : `${FileSystem.documentDirectory}music/`;
const ART_DIR = IS_WEB ? '' : `${FileSystem.documentDirectory}art/`;

const ensureDirs = async () => {
  if (IS_WEB) return;
  for (const dir of [MUSIC_DIR, ART_DIR]) {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
};

const probeDuration = async (uri: string): Promise<number> => {
  try {
    const p = createAudioPlayer({ uri });
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 100));
      const d = p.duration;
      if (d && d > 0 && isFinite(d)) {
        try { p.remove(); } catch {}
        return d;
      }
    }
    try { p.remove(); } catch {}
  } catch {}
  return 0;
};

export type SearchHit = {
  id: string;
  title: string;
  creator: string;
  audio_url: string;
  duration: number;
  artwork_url?: string | null;
  plays?: number;
};

export type UrlCheck = {
  ok: boolean;
  title: string;
  artist: string;
  audio_url: string;
  duration: number;
  size: number;
  content_type: string;
};

const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL;

export const searchOnline = async (query: string): Promise<SearchHit[]> => {
  const url = `${BACKEND}/api/search?q=${encodeURIComponent(query)}&limit=20`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  return res.json();
};

export const checkUrl = async (audioUrl: string): Promise<UrlCheck> => {
  const url = `${BACKEND}/api/url-check?url=${encodeURIComponent(audioUrl)}`;
  const res = await fetch(url);
  if (!res.ok) {
    let msg = `URL check failed (${res.status})`;
    try { const j = await res.json(); if (j?.detail) msg = j.detail; } catch {}
    throw new Error(msg);
  }
  return res.json();
};

/** Download a SearchHit (Audius / URL) to local storage, also cache artwork if present. */
export const downloadToLibrary = async (hit: SearchHit): Promise<Track> => {
  await ensureDirs();
  const id = `tr_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

  // On web, we can't write to disk — just use the remote URL directly for streaming.
  if (IS_WEB) {
    return {
      id,
      title: hit.title,
      artist: hit.creator,
      uri: hit.audio_url,
      duration: hit.duration || 0,
      addedAt: Date.now(),
      artwork: hit.artwork_url ?? undefined,
    };
  }

  const urlLower = hit.audio_url.toLowerCase().split('?')[0];
  let ext = 'mp3';
  for (const e of ['mp3', 'm4a', 'aac', 'ogg', 'wav', 'flac']) {
    if (urlLower.endsWith('.' + e)) { ext = e; break; }
  }
  const destUri = `${MUSIC_DIR}${id}.${ext}`;
  const dl = FileSystem.createDownloadResumable(hit.audio_url, destUri);
  const res = await dl.downloadAsync();
  const finalUri = res?.uri ?? destUri;

  let duration = hit.duration;
  if (!duration || duration <= 0) duration = await probeDuration(finalUri);

  // Cache artwork if present — we save to file:// so RNTP can surface it on the lock screen
  let artwork: string | undefined;
  if (hit.artwork_url) {
    try {
      const artPath = `${ART_DIR}${id}.jpg`;
      const ares = await FileSystem.createDownloadResumable(hit.artwork_url, artPath).downloadAsync();
      if (ares?.uri) artwork = ares.uri;
    } catch {}
  }

  const info = await FileSystem.getInfoAsync(finalUri);
  return {
    id, title: hit.title, artist: hit.creator, uri: finalUri, duration,
    addedAt: Date.now(),
    size: info.exists && 'size' in info ? (info as any).size : undefined,
    artwork,
  };
};

/** Generate AI album art via backend and save to local file. Returns file:// uri. */
export const generateAiArt = async (trackId: string, title: string, artist: string, mood?: string): Promise<string> => {
  await ensureDirs();
  const url = `${BACKEND}/api/generate-art`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, artist, mood: mood ?? '' }),
  });
  if (!res.ok) {
    let msg = `Art generation failed (${res.status})`;
    try { const j = await res.json(); if (j?.detail) msg = j.detail; } catch {}
    throw new Error(msg);
  }
  const { data_uri } = await res.json();
  // data_uri like "data:image/jpeg;base64,...."
  const m = /^data:(image\/\w+);base64,(.+)$/.exec(data_uri);
  if (!m) throw new Error('Malformed art response');

  // On web we can't write to disk — return the data URI directly (<Image> handles data URIs fine).
  if (IS_WEB) return data_uri;

  const ext = m[1].split('/')[1] || 'jpeg';
  const b64 = m[2];
  const destPath = `${ART_DIR}${trackId}_ai_${Date.now()}.${ext}`;
  await FileSystem.writeAsStringAsync(destPath, b64, { encoding: FileSystem.EncodingType.Base64 });
  return destPath;
};
