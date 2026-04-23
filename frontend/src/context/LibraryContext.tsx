import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Track, Playlist } from '../store/types';
import {
  loadTracks, saveTracks,
  loadPlaylists, savePlaylists,
  loadFavorites, saveFavorites,
} from '../store/store';

type Ctx = {
  tracks: Track[];
  playlists: Playlist[];
  favorites: string[];
  addTracks: (t: Track[]) => void;
  removeTrack: (id: string) => void;
  toggleFavorite: (id: string) => void;
  createPlaylist: (name: string) => string;
  deletePlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  getTrackById: (id: string) => Track | undefined;
  ready: boolean;
};

const LibraryContext = createContext<Ctx | null>(null);

export const LibraryProvider = ({ children }: { children: React.ReactNode }) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const [t, p, f] = await Promise.all([loadTracks(), loadPlaylists(), loadFavorites()]);
      setTracks(t); setPlaylists(p); setFavorites(f);
      setReady(true);
    })();
  }, []);

  const addTracks = useCallback((incoming: Track[]) => {
    setTracks(prev => {
      const existingUris = new Set(prev.map(x => x.uri));
      const merged = [...prev, ...incoming.filter(t => !existingUris.has(t.uri))];
      saveTracks(merged);
      return merged;
    });
  }, []);

  const removeTrack = useCallback((id: string) => {
    setTracks(prev => {
      const next = prev.filter(t => t.id !== id);
      saveTracks(next);
      return next;
    });
    setFavorites(prev => {
      const next = prev.filter(x => x !== id);
      saveFavorites(next);
      return next;
    });
    setPlaylists(prev => {
      const next = prev.map(p => ({ ...p, trackIds: p.trackIds.filter(x => x !== id) }));
      savePlaylists(next);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      saveFavorites(next);
      return next;
    });
  }, []);

  const createPlaylist = useCallback((name: string) => {
    const id = `pl_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const pl: Playlist = { id, name: name.trim() || 'Untitled', trackIds: [], createdAt: Date.now() };
    setPlaylists(prev => {
      const next = [pl, ...prev];
      savePlaylists(next);
      return next;
    });
    return id;
  }, []);

  const deletePlaylist = useCallback((id: string) => {
    setPlaylists(prev => {
      const next = prev.filter(p => p.id !== id);
      savePlaylists(next);
      return next;
    });
  }, []);

  const addTrackToPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists(prev => {
      const next = prev.map(p => {
        if (p.id !== playlistId) return p;
        if (p.trackIds.includes(trackId)) return p;
        return { ...p, trackIds: [...p.trackIds, trackId] };
      });
      savePlaylists(next);
      return next;
    });
  }, []);

  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists(prev => {
      const next = prev.map(p =>
        p.id !== playlistId ? p : { ...p, trackIds: p.trackIds.filter(x => x !== trackId) }
      );
      savePlaylists(next);
      return next;
    });
  }, []);

  const getTrackById = useCallback((id: string) => tracks.find(t => t.id === id), [tracks]);

  return (
    <LibraryContext.Provider value={{
      tracks, playlists, favorites,
      addTracks, removeTrack, toggleFavorite,
      createPlaylist, deletePlaylist,
      addTrackToPlaylist, removeTrackFromPlaylist,
      getTrackById, ready,
    }}>
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
  return ctx;
};
