import * as FileSystem from 'expo-file-system/legacy';
import { createAudioPlayer } from 'expo-audio';
import { Track } from '../store/types';

const MUSIC_DIR = `${FileSystem.documentDirectory}music/`;

const ensureDir = async () => {
  const info = await FileSystem.getInfoAsync(MUSIC_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MUSIC_DIR, { intermediates: true });
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
};

const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL;

export const searchOnline = async (query: string): Promise<SearchHit[]> => {
  const url = `${BACKEND}/api/search?q=${encodeURIComponent(query)}&limit=15`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  return res.json();
};

export const downloadToLibrary = async (hit: SearchHit): Promise<Track> => {
  await ensureDir();
  const id = `tr_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const ext = hit.audio_url.toLowerCase().endsWith('.ogg') ? 'ogg' : 'mp3';
  const destUri = `${MUSIC_DIR}${id}.${ext}`;

  const dl = FileSystem.createDownloadResumable(hit.audio_url, destUri);
  const res = await dl.downloadAsync();
  const finalUri = res?.uri ?? destUri;

  let duration = hit.duration;
  if (!duration || duration <= 0) {
    duration = await probeDuration(finalUri);
  }

  const info = await FileSystem.getInfoAsync(finalUri);
  return {
    id,
    title: hit.title,
    artist: hit.creator,
    uri: finalUri,
    duration,
    addedAt: Date.now(),
    size: info.exists && 'size' in info ? (info as any).size : undefined,
  };
};
