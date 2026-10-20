import { MediaItem } from '../../types/media.js';
import { getAccessToken } from './spotifyAuth.js';

export const DEMO_SPOTIFY_TRACKS: MediaItem[] = [
  {
    id: 'spotify-bohemian-rhapsody',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    type: 'audio',
    source: 'https://open.spotify.com/track/7tFiyTwD0nx5a1eklYtX2J',
    provider: 'spotify',
    duration: 354,
    artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
    spotifyUri: 'spotify:track:7tFiyTwD0nx5a1eklYtX2J',
    spotifyUrl: 'https://open.spotify.com/track/7tFiyTwD0nx5a1eklYtX2J',
  },
  {
    id: 'spotify-blinding-lights',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    type: 'audio',
    source: 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b',
    provider: 'spotify',
    duration: 200,
    artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80',
    spotifyUri: 'spotify:track:0VjIjW4GlUZAMYd2vXMi3b',
    spotifyUrl: 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b',
  },
  {
    id: 'spotify-dreams',
    title: 'Dreams',
    artist: 'Fleetwood Mac',
    type: 'audio',
    source: 'https://open.spotify.com/track/0ofHAoxe9vBkTCp2UQIavz',
    provider: 'spotify',
    duration: 257,
    artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
    spotifyUri: 'spotify:track:0ofHAoxe9vBkTCp2UQIavz',
    spotifyUrl: 'https://open.spotify.com/track/0ofHAoxe9vBkTCp2UQIavz',
  },
  {
    id: 'spotify-hotel-california',
    title: 'Hotel California',
    artist: 'Eagles',
    type: 'audio',
    source: 'https://open.spotify.com/track/40riOy7x9W7FXimmEdAhAn',
    provider: 'spotify',
    duration: 390,
    artwork: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&auto=format&fit=crop&q=80',
    spotifyUri: 'spotify:track:40riOy7x9W7FXimmEdAhAn',
    spotifyUrl: 'https://open.spotify.com/track/40riOy7x9W7FXimmEdAhAn',
  },
  {
    id: 'spotify-clair-de-lune',
    title: 'Clair de Lune',
    artist: 'Claude Debussy',
    type: 'audio',
    source: 'https://open.spotify.com/track/6N7gZr4OPcq592QEGvN479',
    provider: 'spotify',
    duration: 304,
    artwork: 'https://images.unsplash.com/photo-1520523839898-507121c7dcf6?w=300&auto=format&fit=crop&q=80',
    spotifyUri: 'spotify:track:6N7gZr4OPcq592QEGvN479',
    spotifyUrl: 'https://open.spotify.com/track/6N7gZr4OPcq592QEGvN479',
  },
  {
    id: 'spotify-take-five',
    title: 'Take Five',
    artist: 'The Dave Brubeck Quartet',
    type: 'audio',
    source: 'https://open.spotify.com/track/1YQWosTIljIvxAgHWTp7KP',
    provider: 'spotify',
    duration: 324,
    artwork: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&auto=format&fit=crop&q=80',
    spotifyUri: 'spotify:track:1YQWosTIljIvxAgHWTp7KP',
    spotifyUrl: 'https://open.spotify.com/track/1YQWosTIljIvxAgHWTp7KP',
  },
  {
    id: 'spotify-stayin-alive',
    title: 'Stayin Alive',
    artist: 'Bee Gees',
    type: 'audio',
    source: 'https://open.spotify.com/track/5ubvP9oKmgLzD28Z2Q5O2i',
    provider: 'spotify',
    duration: 285,
    artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&auto=format&fit=crop&q=80',
    spotifyUri: 'spotify:track:5ubvP9oKmgLzD28Z2Q5O2i',
    spotifyUrl: 'https://open.spotify.com/track/5ubvP9oKmgLzD28Z2Q5O2i',
  },
];

export async function searchSpotifyTracks(query: string): Promise<MediaItem[]> {
  const token = getAccessToken();

  if (!token) {
    // If not connected to Spotify API, search local demo catalog
    const q = query.trim().toLowerCase();
    if (!q) return DEMO_SPOTIFY_TRACKS;
    return DEMO_SPOTIFY_TRACKS.filter(
      (t) => t.title.toLowerCase().includes(q) || (t.artist && t.artist.toLowerCase().includes(q))
    );
  }

  try {
    const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      throw new Error('Spotify session expired. Please reconnect in Settings.');
    }
    if (res.status === 429) {
      throw new Error('Spotify rate limit exceeded. Please wait a moment.');
    }
    if (!res.ok) {
      throw new Error(`Spotify search failed with status ${res.status}`);
    }

    const data = await res.json();
    const tracks = data.tracks?.items || [];

    return tracks.map((track: any) => ({
      id: `spotify-${track.id}`,
      title: track.name,
      artist: track.artists?.map((a: any) => a.name).join(', ') || 'Unknown Artist',
      type: 'audio' as const,
      source: track.external_urls?.spotify || `https://open.spotify.com/track/${track.id}`,
      provider: 'spotify' as const,
      duration: Math.round(track.duration_ms / 1000),
      artwork: track.album?.images?.[0]?.url || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300',
      spotifyUri: track.uri,
      spotifyUrl: track.external_urls?.spotify || `https://open.spotify.com/track/${track.id}`,
    }));
  } catch (err: any) {
    console.warn('Spotify search fallback to demo tracks:', err.message);
    const q = query.trim().toLowerCase();
    return DEMO_SPOTIFY_TRACKS.filter(
      (t) => t.title.toLowerCase().includes(q) || (t.artist && t.artist.toLowerCase().includes(q))
    );
  }
}
