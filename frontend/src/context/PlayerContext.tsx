import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { Track } from '../store/types';

// On web, react-native-track-player has no native implementation.
// Fall back to a stubbed player so the UI still works in the Expo web preview.
const IS_NATIVE = Platform.OS === 'ios' || Platform.OS === 'android';

type RNTP = typeof import('react-native-track-player');
let TP: RNTP | null = null;
let tpHooks: {
  usePlaybackState: () => any;
  useProgress: (ms?: number) => any;
  useActiveTrack: () => any;
} | null = null;
try {
  if (IS_NATIVE) {
    // Lazy require so web doesn't crash at import time.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod: RNTP = require('react-native-track-player');
    TP = mod;
    tpHooks = {
      usePlaybackState: mod.usePlaybackState,
      useProgress: mod.useProgress,
      useActiveTrack: mod.useActiveTrack,
    };
  }
} catch {
  TP = null;
  tpHooks = null;
}

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
  if (!TP) return;
  if (setupPromise) return setupPromise;
  setupPromise = (async () => {
    try {
      await TP!.setupPlayer({ autoHandleInterruptions: true });
    } catch (e: any) {
      if (!String(e?.message || e).includes('already')) throw e;
    }
    const { Capability } = TP!;
    await TP!.updateOptions({
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

// Safe hook wrappers — return sensible defaults on web.
const useSafePlaybackState = () =>
  tpHooks ? tpHooks.usePlaybackState() : { state: undefined };
const useSafeProgress = () =>
  tpHooks ? tpHooks.useProgress(500) : { position: 0, duration: 0 };
const useSafeActiveTrack = () =>
  tpHooks ? tpHooks.useActiveTrack() : null;

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [current, setCurrent] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [sleepTimerMs, setSleepTimerMs] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'off' | 'all' | 'one'>('off');
  const sleepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playbackState = useSafePlaybackState();
  const progress = useSafeProgress();
  const activeTrack = useSafeActiveTrack();

  const PlayingState = TP?.State?.Playing;
  const isPlaying = !!PlayingState && playbackState?.state === PlayingState;
  const positionMs = Math.floor((progress?.position ?? 0) * 1000);
  const durationMs = Math.floor((progress?.duration ?? current?.duration ?? 0) * 1000);

  useEffect(() => { ensureSetup().catch(() => {}); }, []);

  useEffect(() => {
    if (!activeTrack) return;
    if (current?.id !== activeTrack.id) {
      const match = queue.find((t) => t.id === activeTrack.id);
      if (match) setCurrent(match);
    }
  }, [activeTrack, current, queue]);

  useEffect(() => {
    if (!TP) return;
    const { RepeatMode } = TP;
    const mode = repeat === 'off' ? RepeatMode.Off : repeat === 'all' ? RepeatMode.Queue : RepeatMode.Track;
    TP.setRepeatMode(mode).catch(() => {});
  }, [repeat]);

  const playTrack = useCallback(async (track: Track, q?: Track[]) => {
    const newQueue = q && q.length > 0 ? q : [track];
    const startIdx = Math.max(0, newQueue.findIndex((t) => t.id === track.id));
    setQueue(newQueue);
    setCurrent(track);
    if (!TP) return;
    try {
      await ensureSetup();
      await TP.reset();
      await TP.add(newQueue.map(toRNTP));
      if (startIdx > 0) await TP.skip(startIdx);
      await TP.play();
    } catch (e) { /* swallow */ }
  }, []);

  const togglePlay = useCallback(async () => {
    if (!TP) return;
    try {
      await ensureSetup();
      if (isPlaying) await TP.pause();
      else await TP.play();
    } catch {}
  }, [isPlaying]);

  const seekTo = useCallback(async (ms: number) => {
    if (!TP) return;
    try { await TP.seekTo(ms / 1000); } catch {}
  }, []);

  const next = useCallback(async () => {
    if (!TP) return;
    try {
      if (shuffle && queue.length > 1) {
        const currentIdx = queue.findIndex((t) => t.id === current?.id);
        let nextIdx: number;
        do { nextIdx = Math.floor(Math.random() * queue.length); } while (nextIdx === currentIdx);
        await TP.skip(nextIdx);
      } else {
        await TP.skipToNext();
      }
    } catch {}
  }, [shuffle, queue, current]);

  const previous = useCallback(async () => {
    if (!TP) return;
    try {
      if (positionMs > 3000) { await TP.seekTo(0); return; }
      await TP.skipToPrevious();
    } catch {}
  }, [positionMs]);

  const stop = useCallback(async () => {
    if (TP) {
      try { await TP.stop(); await TP.reset(); } catch {}
    }
    setCurrent(null);
    setQueue([]);
  }, []);

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
        TP?.pause?.().catch?.(() => {});
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
