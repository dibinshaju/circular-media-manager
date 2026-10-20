export type MediaType = 'audio' | 'video';
export type MediaProvider = 'local' | 'spotify';

export interface MediaItem {
  id: string;
  title: string;
  artist?: string;
  type: MediaType;
  source: string; // Object URL, persistent ID, or Spotify URL/URI
  provider: MediaProvider;
  duration?: number; // In seconds
  artwork?: string;
  spotifyUri?: string;
  spotifyUrl?: string;
  mimeType?: string;
  fileSize?: number;
  addedAt?: number;
  isCustomUploaded?: boolean;
}

export interface PlaylistMetadata {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  itemCount: number;
  coverColor?: string;
}

export interface SerializedPlaylist {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  selectedItemId: string | null;
  items: MediaItem[]; // Ordered array of media items to rebuild CDLL pointers from
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: 'playlist' | 'track' | 'off';
  shuffle: boolean;
  playbackRate: number;
  bufferedPercent: number;
}
