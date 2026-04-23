import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { createAudioPlayer } from 'expo-audio';
import { Track } from '../store/types';
import { parseTitleFromFile } from './format';

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
    // Wait up to 2 seconds for metadata to load
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

export const pickAudioFiles = async (): Promise<Track[]> => {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'audio/*',
    multiple: true,
    copyToCacheDirectory: true,
  });
  if (result.canceled) return [];

  await ensureDir();

  const tracks: Track[] = [];
  for (const asset of result.assets) {
    const name = asset.name || `audio_${Date.now()}`;
    const ext = name.includes('.') ? name.split('.').pop() : 'mp3';
    const id = `tr_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const destUri = `${MUSIC_DIR}${id}.${ext}`;

    try {
      await FileSystem.copyAsync({ from: asset.uri, to: destUri });
    } catch {
      // if copy fails, still try using original uri
    }

    const finalUri = (await FileSystem.getInfoAsync(destUri)).exists ? destUri : asset.uri;
    const duration = await probeDuration(finalUri);
    const { title, artist } = parseTitleFromFile(name);

    tracks.push({
      id,
      title,
      artist,
      uri: finalUri,
      duration,
      addedAt: Date.now(),
      size: asset.size,
    });
  }
  return tracks;
};
