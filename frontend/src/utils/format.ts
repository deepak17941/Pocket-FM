export const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const s = Math.floor(seconds);
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const rem = mins % 60;
    return `${hours}:${String(rem).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

export const formatMs = (ms: number) => formatDuration(Math.floor((ms || 0) / 1000));

export const parseTitleFromFile = (name: string): { title: string; artist: string } => {
  const clean = name.replace(/\.[^/.]+$/, '').replace(/[_]+/g, ' ').trim();
  // Pattern: "Artist - Title"
  const m = clean.match(/^(.+?)\s*[-–]\s*(.+)$/);
  if (m) return { artist: m[1].trim(), title: m[2].trim() };
  return { title: clean || 'Unknown', artist: 'Unknown' };
};

export const colorFromId = (id: string): string => {
  // Deterministic HSL color from id hash — used for album art tint
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return `hsl(${h}, 55%, 45%)`;
};
