/**
 * Tiny HTML5 <audio>-based player used only on web.
 * Keeps a module-level singleton so the PlayerContext can treat it
 * like a minimal RNTP interface.
 */
import type { Track } from '../store/types';

type Listener = () => void;

class WebPlayer {
  audio: HTMLAudioElement | null = null;
  queue: Track[] = [];
  index = 0;
  private listeners = new Set<Listener>();
  private _isPlaying = false;
  private _position = 0;
  private _duration = 0;

  private ensureAudio() {
    if (this.audio) return this.audio;
    const a = new Audio();
    a.preload = 'auto';
    a.crossOrigin = 'anonymous';
    a.addEventListener('play', () => { this._isPlaying = true; this.emit(); });
    a.addEventListener('pause', () => { this._isPlaying = false; this.emit(); });
    a.addEventListener('ended', () => {
      this._isPlaying = false;
      this.skipToNext().catch(() => {});
    });
    a.addEventListener('timeupdate', () => {
      this._position = a.currentTime || 0;
      this.emit();
    });
    a.addEventListener('loadedmetadata', () => {
      this._duration = a.duration || 0;
      this.emit();
    });
    a.addEventListener('error', (e) => {
      // eslint-disable-next-line no-console
      console.warn('[WebPlayer] audio error', a.error?.code, a.error?.message);
    });
    this.audio = a;
    return a;
  }

  on(l: Listener) { this.listeners.add(l); return () => this.listeners.delete(l); }
  private emit() { this.listeners.forEach((l) => l()); }

  get state() { return { isPlaying: this._isPlaying, position: this._position, duration: this._duration }; }
  get active(): Track | null { return this.queue[this.index] ?? null; }

  async setQueue(tracks: Track[], startIdx = 0) {
    this.queue = tracks;
    this.index = Math.max(0, Math.min(startIdx, tracks.length - 1));
    await this.loadCurrent();
  }

  private async loadCurrent() {
    const a = this.ensureAudio();
    const t = this.queue[this.index];
    if (!t) {
      a.pause(); a.removeAttribute('src'); a.load();
      this._isPlaying = false; this._position = 0; this._duration = 0;
      this.emit();
      return;
    }
    a.src = t.uri;
    this._position = 0;
    this._duration = t.duration || 0;
    this.emit();
    try { a.load(); } catch {}
  }

  async play() { const a = this.ensureAudio(); try { await a.play(); } catch (e) { console.warn('[WebPlayer] play() failed', e); } }
  async pause() { this.ensureAudio().pause(); }
  async stop() {
    const a = this.ensureAudio();
    a.pause(); a.currentTime = 0;
    this._isPlaying = false; this._position = 0;
    this.emit();
  }
  async seekTo(sec: number) { const a = this.ensureAudio(); a.currentTime = Math.max(0, sec); }
  async skipToNext() {
    if (this.queue.length === 0) return;
    if (this.index >= this.queue.length - 1) {
      // end of queue → stop
      await this.stop();
      return;
    }
    this.index++;
    await this.loadCurrent();
    await this.play();
  }
  async skipToPrevious() {
    if (this.queue.length === 0) return;
    if (this.index <= 0) {
      await this.seekTo(0);
      return;
    }
    this.index--;
    await this.loadCurrent();
    await this.play();
  }
  async skip(idx: number) {
    if (idx < 0 || idx >= this.queue.length) return;
    this.index = idx;
    await this.loadCurrent();
    await this.play();
  }
}

export const webPlayer = new WebPlayer();
