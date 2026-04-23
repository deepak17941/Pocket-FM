export interface Track {
  id: string;
  title: string;
  artist: string;
  uri: string;
  duration: number; // seconds
  addedAt: number;
  size?: number;
  /** Optional custom album art as base64 data URI ("data:image/jpeg;base64,...") */
  artwork?: string;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
}
