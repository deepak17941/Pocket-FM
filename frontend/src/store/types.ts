export interface Track {
  id: string;
  title: string;
  artist: string;
  uri: string;
  duration: number; // seconds
  addedAt: number;
  size?: number;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
}
