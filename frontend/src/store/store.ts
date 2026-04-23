import AsyncStorage from '@react-native-async-storage/async-storage';
import { Track, Playlist } from './types';

const KEYS = {
  TRACKS: '@pfm/tracks',
  PLAYLISTS: '@pfm/playlists',
  FAVORITES: '@pfm/favorites',
};

export const loadTracks = async (): Promise<Track[]> => {
  const raw = await AsyncStorage.getItem(KEYS.TRACKS);
  return raw ? JSON.parse(raw) : [];
};

export const saveTracks = async (tracks: Track[]) => {
  await AsyncStorage.setItem(KEYS.TRACKS, JSON.stringify(tracks));
};

export const loadPlaylists = async (): Promise<Playlist[]> => {
  const raw = await AsyncStorage.getItem(KEYS.PLAYLISTS);
  return raw ? JSON.parse(raw) : [];
};

export const savePlaylists = async (pls: Playlist[]) => {
  await AsyncStorage.setItem(KEYS.PLAYLISTS, JSON.stringify(pls));
};

export const loadFavorites = async (): Promise<string[]> => {
  const raw = await AsyncStorage.getItem(KEYS.FAVORITES);
  return raw ? JSON.parse(raw) : [];
};

export const saveFavorites = async (ids: string[]) => {
  await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(ids));
};
