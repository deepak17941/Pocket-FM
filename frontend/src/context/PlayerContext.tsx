import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import { Track } from '../store/types';

type Ctx = {
  current: Track | null;
  queue: Track[];
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  playTrack: (track: Track, queue?: Track[]) => void;
  togglePlay: () => void;
  seekTo: (ms: number) => void;
  next: () => void;
  previous: () => void;
  stop: () => void;
  sleepTimerMs: number | null;
  setSleepTimer: (minutes: number | null) => void;
  sleepTimerRemaining: number | null;
};

const PlayerContext = createContext<Ctx | null>(null);

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [current, setCurrent] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [sleepTimerMs, setSleepTimerMs] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const sleepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const player: AudioPlayer = useAudioPlayer(current ? { uri: current.uri } : null);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      shouldRouteThroughEarpiece: false,
    }).catch(() => {});
  }, []);

  const isPlaying = status?.playing ?? false;
  const positionMs = Math.floor((status?.currentTime ?? 0) * 1000);
  const durationMs = Math.floor((status?.duration ?? current?.duration ?? 0) * 1000);

  const playTrack = useCallback((track: Track, q?: Track[]) => {
    const newQueue = q && q.length > 0 ? q : [track];
    const idx = newQueue.findIndex(t => t.id === track.id);
    setQueue(newQueue);
    setQueueIndex(idx >= 0 ? idx : 0);
    setCurrent(track);
  }, []);

  // Autoplay when new track loaded
  useEffect(() => {
    if (current && player) {
      try { player.play(); } catch {}
    }
  }, [current, player]);

  const togglePlay = useCallback(() => {
    if (!player) return;
    if (isPlaying) player.pause();
    else player.play();
  }, [player, isPlaying]);

  const seekTo = useCallback((ms: number) => {
    if (!player) return;
    player.seekTo(ms / 1000);
  }, [player]);

  const next = useCallback(() => {
    if (queue.length === 0) return;
    const nextIdx = (queueIndex + 1) % queue.length;
    setQueueIndex(nextIdx);
    setCurrent(queue[nextIdx]);
  }, [queue, queueIndex]);

  const previous = useCallback(() => {
    if (!player) return;
    if (positionMs > 3000) {
      player.seekTo(0);
      return;
    }
    if (queue.length === 0) return;
    const prevIdx = (queueIndex - 1 + queue.length) % queue.length;
    setQueueIndex(prevIdx);
    setCurrent(queue[prevIdx]);
  }, [queue, queueIndex, player, positionMs]);

  const stop = useCallback(() => {
    if (player) {
      try { player.pause(); } catch {}
    }
    setCurrent(null);
    setQueue([]);
    setQueueIndex(0);
  }, [player]);

  // Auto-advance on track end
  const endHandledRef = useRef(false);
  useEffect(() => {
    if (!status) return;
    if (status.didJustFinish && !endHandledRef.current) {
      endHandledRef.current = true;
      setTimeout(() => { endHandledRef.current = false; }, 500);
      next();
    }
  }, [status, next]);

  // Sleep timer
  const setSleepTimer = useCallback((minutes: number | null) => {
    if (sleepIntervalRef.current) {
      clearInterval(sleepIntervalRef.current);
      sleepIntervalRef.current = null;
    }
    if (minutes === null || minutes <= 0) {
      setSleepTimerMs(null);
      setSleepTimerRemaining(null);
      return;
    }
    const endAt = Date.now() + minutes * 60 * 1000;
    setSleepTimerMs(endAt);
    setSleepTimerRemaining(endAt - Date.now());
    sleepIntervalRef.current = setInterval(() => {
      const remaining = endAt - Date.now();
      if (remaining <= 0) {
        if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
        sleepIntervalRef.current = null;
        setSleepTimerMs(null);
        setSleepTimerRemaining(null);
        try { player?.pause(); } catch {}
      } else {
        setSleepTimerRemaining(remaining);
      }
    }, 1000);
  }, [player]);

  useEffect(() => () => {
    if (sleepIntervalRef.current) clearInterval(sleepIntervalRef.current);
  }, []);

  return (
    <PlayerContext.Provider value={{
      current, queue, isPlaying, positionMs, durationMs,
      playTrack, togglePlay, seekTo, next, previous, stop,
      sleepTimerMs, setSleepTimer, sleepTimerRemaining,
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
