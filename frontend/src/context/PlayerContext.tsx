import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import TrackPlayer, {
  Capability, RepeatMode, State, Event,
  useProgress, usePlaybackState, useActiveTrack,
} from 'react-native-track-player';
import { Track } from '../store/types';

type Ctx = {
  current: Track | null;
  queue: Track[];
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  playTrack: (track: Track, queue?: Track[]) => Promise<void>;
  togglePlay: () => Promise<void>;
  seekTo: (ms: number) => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  stop: () => Promise<void>;
  sleepTimerMs: number | null;
  setSleepTimer: (minutes: number | null) => void;
  sleepTimerRemaining: number | null;
  shuffle: boolean;
  toggleShuffle: () => void;
  repeat: 'off' | 'all' | 'one';
  cycleRepeat: () => void;
};

const PlayerContext = createContext<Ctx | null>(null);

let setupPromise: Promise<void> | null = null;
const ensureSetup = async () => {
  if (setupPromise) return setupPromise;
  setupPromise = (async () => {
    try {
      await TrackPlayer.setupPlayer({
        autoHandleInterruptions: true,
        maxCacheSize: 1024 * 10, // 10MB buffer
      });
    } catch (e: any) {
      // "already initialized" — ignore
      if (!String(e?.message || e).includes('already')) throw e;
    }
    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play, Capability.Pause, Capability.SkipToNext, Capability.SkipToPrevious,
        Capability.Stop, Capability.SeekTo, Capability.JumpBackward, Capability.JumpForward,
      ],
      compactCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext, Capability.SkipToPrevious],
      notificationCapabilities: [
        Capability.Play, Capability.Pause, Capability.SkipToNext, Capability.SkipToPrevious, Capability.Stop,
      ],
      progressUpdateEventInterval: 2,
    });
  })();
  return setupPromise;
};

const toRNTP = (t: Track) => ({
  id: t.id,
  url: t.uri,
  title: t.title || 'Untitled',
  artist: t.artist || 'Unknown',
  duration: t.duration || 0,
  artwork: t.artwork || undefined,
});

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [current, setCurrent] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [sleepTimerMs, setSleepTimerMs] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'off' | 'all' | 'one'>('off');
  const sleepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playbackState = usePlaybackState();
  const progress = useProgress(500);
  const activeTrack = useActiveTrack();

  const isPlaying = playbackState?.state === State.Playing;
  const positionMs = Math.floor((progress?.position ?? 0) * 1000);
  const durationMs = Math.floor((progress?.duration ?? current?.duration ?? 0) * 1000);

  // Setup on mount
  useEffect(() => { ensureSetup().catch(() => {}); }, []);

  // Sync local `current` with RNTP's active track
  useEffect(() => {
    if (!activeTrack) return;
    if (current?.id !== activeTrack.id) {
      const match = queue.find((t) => t.id === activeTrack.id);
      if (match) setCurrent(match);
    }
  }, [activeTrack, current, queue]);

  // Apply RNTP repeat mode
  useEffect(() => {
    const mode = repeat === 'off' ? RepeatMode.Off : repeat === 'all' ? RepeatMode.Queue : RepeatMode.Track;
    TrackPlayer.setRepeatMode(mode).catch(() => {});
  }, [repeat]);

  const playTrack = useCallback(async (track: Track, q?: Track[]) => {
    await ensureSetup();
    const newQueue = q && q.length > 0 ? q : [track];
    const startIdx = Math.max(0, newQueue.findIndex((t) => t.id === track.id));
    const rntpTracks = newQueue.map(toRNTP);
    await TrackPlayer.reset();
    await TrackPlayer.add(rntpTracks);
    if (startIdx > 0) await TrackPlayer.skip(startIdx);
    setQueue(newQueue);
    setCurrent(track);
    await TrackPlayer.play();
  }, []);

  const togglePlay = useCallback(async () => {
    await ensureSetup();
    if (isPlaying) await TrackPlayer.pause();
    else await TrackPlayer.play();
  }, [isPlaying]);

  const seekTo = useCallback(async (ms: number) => {
    await TrackPlayer.seekTo(ms / 1000);
  }, []);

  const next = useCallback(async () => {
    if (shuffle && queue.length > 1) {
      const currentIdx = queue.findIndex((t) => t.id === current?.id);
      let nextIdx: number;
      do {
        nextIdx = Math.floor(Math.random() * queue.length);
      } while (nextIdx === currentIdx);
      try { await TrackPlayer.skip(nextIdx); } catch {}
    } else {
      try { await TrackPlayer.skipToNext(); } catch {}
    }
  }, [shuffle, queue, current]);

  const previous = useCallback(async () => {
    if (positionMs > 3000) { await TrackPlayer.seekTo(0); return; }
    try { await TrackPlayer.skipToPrevious(); } catch {}
  }, [positionMs]);

  const stop = useCallback(async () => {
    try { await TrackPlayer.stop(); await TrackPlayer.reset(); } catch {}
    setCurrent(null);
    setQueue([]);
  }, []);

  // Sleep timer
  const setSleepTimer = useCallback((minutes: number | null) => {
    if (sleepIntervalRef.current) { clearInterval(sleepIntervalRef.current); sleepIntervalRef.current = null; }
    if (minutes === null || minutes <= 0) {
      setSleepTimerMs(null); setSleepTimerRemaining(null); return;
    }
    const endAt = Date.now() + minutes * 60 * 1000;
    setSleepTimerMs(endAt); setSleepTimerRemaining(endAt - Date.now());
    sleepIntervalRef.current = setInterval(() => {
      const remaining = endAt - Date.now();
      if (remaining <= 0) {
        if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
        sleepIntervalRef.current = null;
        setSleepTimerMs(null); setSleepTimerRemaining(null);
        TrackPlayer.pause().catch(() => {});
      } else {
        setSleepTimerRemaining(remaining);
      }
    }, 1000);
  }, []);

  useEffect(() => () => {
    if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
  }, []);

  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const cycleRepeat = useCallback(() => {
    setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off'));
  }, []);

  return (
    <PlayerContext.Provider value={{
      current, queue, isPlaying, positionMs, durationMs,
      playTrack, togglePlay, seekTo, next, previous, stop,
      sleepTimerMs, setSleepTimer, sleepTimerRemaining,
      shuffle, toggleShuffle, repeat, cycleRepeat,
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
};
