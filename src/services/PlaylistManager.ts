import { CircularPlaylist } from '../data-structures/CircularPlaylist.js';
import { MediaItem, PlaylistMetadata } from '../types/media.js';
import { PersistenceService } from './PersistenceService.js';
import { DEMO_SPOTIFY_TRACKS } from '../integrations/spotify/spotifyApi.js';

export interface ManagedPlaylist {
  meta: PlaylistMetadata;
  list: CircularPlaylist;
}

export const SEED_MEDIA_ITEMS: MediaItem[] = [
  {
    id: 'seed-malayalam-aaromale',
    title: 'Aaromale',
    artist: 'Vijay Yesudas',
    type: 'audio',
    source: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    provider: 'local',
    duration: 268,
    artwork: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=300&auto=format&fit=crop&q=80',
    addedAt: Date.now() - 300000,
  },
  {
    id: 'seed-malayalam-mizhiyoram',
    title: 'Mizhiyoram',
    artist: 'K. J. Yesudas',
    type: 'audio',
    source: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    provider: 'local',
    duration: 294,
    artwork: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=300&auto=format&fit=crop&q=80',
    addedAt: Date.now() - 280000,
  },
  {
    id: 'seed-malayalam-nila',
    title: 'Nila',
    artist: 'Haricharan',
    type: 'audio',
    source: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    provider: 'local',
    duration: 312,
    artwork: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=300&auto=format&fit=crop&q=80',
    addedAt: Date.now() - 260000,
  },
  {
    id: 'seed-audio-ambient',
    title: 'Acoustic Sunrise',
    artist: 'SoundHelix Collective',
    type: 'audio',
    source: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    provider: 'local',
    duration: 372,
    artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
    addedAt: Date.now() - 240000,
  },
  {
    id: 'seed-video-nature',
    title: 'Ocean Coastline Waves',
    artist: 'Earth Visuals (Loop)',
    type: 'video',
    source: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    provider: 'local',
    duration: 15,
    artwork: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&auto=format&fit=crop&q=80',
    addedAt: Date.now() - 250000,
  },
  {
    id: 'seed-spotify-bohemian',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    type: 'audio',
    source: 'https://open.spotify.com/track/7tFiyTwD0nx5a1eklYtX2J',
    provider: 'spotify',
    duration: 354,
    artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
    spotifyUri: 'spotify:track:7tFiyTwD0nx5a1eklYtX2J',
    spotifyUrl: 'https://open.spotify.com/track/7tFiyTwD0nx5a1eklYtX2J',
    addedAt: Date.now() - 200000,
  },
  {
    id: 'seed-audio-synth',
    title: 'Electronic Odyssey',
    artist: 'SoundHelix Collective',
    type: 'audio',
    source: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    provider: 'local',
    duration: 423,
    artwork: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80',
    addedAt: Date.now() - 150000,
  },
  {
    id: 'seed-video-bigbuck',
    title: 'Big Buck Bunny (Animation Sample)',
    artist: 'Blender Open Movie',
    type: 'video',
    source: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    provider: 'local',
    duration: 596,
    artwork: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&auto=format&fit=crop&q=80',
    addedAt: Date.now() - 100000,
  },
  {
    id: 'seed-spotify-blinding',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    type: 'audio',
    source: 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b',
    provider: 'spotify',
    duration: 200,
    artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
    spotifyUri: 'spotify:track:0VjIjW4GlUZAMYd2vXMi3b',
    spotifyUrl: 'https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b',
    addedAt: Date.now() - 50000,
  },
];

class PlaylistManager {
  private playlists: Map<string, ManagedPlaylist> = new Map();
  private activePlaylistId: string = '';
  private subscribers: Set<() => void> = new Set();
  private isInitialized: boolean = false;

  constructor() {
    this.init();
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;

    const savedMetas = PersistenceService.loadPlaylistsMeta();

    if (savedMetas.length === 0) {
      // Seed initial playlists
      this.seedDefaultPlaylists();
    } else {
      for (const meta of savedMetas) {
        const loaded = await PersistenceService.loadPlaylist(meta.id);
        if (loaded) {
          this.playlists.set(meta.id, {
            meta: { ...meta, itemCount: loaded.playlist.count },
            list: loaded.playlist,
          });
        }
      }

      const activeId = PersistenceService.getActivePlaylistId();
      if (activeId && this.playlists.has(activeId)) {
        this.activePlaylistId = activeId;
      } else if (this.playlists.size > 0) {
        this.activePlaylistId = Array.from(this.playlists.keys())[0];
      }
    }

    this.isInitialized = true;
    this.notify();
  }

  private seedDefaultPlaylists(): void {
    // Playlist 1: Loopify Starter Pack (Mixed)
    const p1Id = 'playlist-starter';
    const p1List = new CircularPlaylist();
    SEED_MEDIA_ITEMS.forEach((item) => p1List.add(item));

    const p1Meta: PlaylistMetadata = {
      id: p1Id,
      name: 'Loopify Essentials',
      description: 'Audio, video, and Spotify tracks linked in continuous circular harmony.',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      itemCount: p1List.count,
      coverColor: '#7450E8',
    };

    this.playlists.set(p1Id, { meta: p1Meta, list: p1List });
    PersistenceService.savePlaylist(p1Id, p1Meta.name, p1List);

    // Playlist 2: Spotify Discovery Reference
    const p2Id = 'playlist-spotify';
    const p2List = new CircularPlaylist();
    DEMO_SPOTIFY_TRACKS.forEach((track) => p2List.add(track));

    const p2Meta: PlaylistMetadata = {
      id: p2Id,
      name: 'Spotify Orbit',
      description: 'Curated Spotify track references ready for continuous traversal.',
      createdAt: Date.now() - 10000,
      updatedAt: Date.now() - 10000,
      itemCount: p2List.count,
      coverColor: '#FFD93D',
    };

    this.playlists.set(p2Id, { meta: p2Meta, list: p2List });
    PersistenceService.savePlaylist(p2Id, p2Meta.name, p2List);

    this.activePlaylistId = p1Id;
    PersistenceService.setActivePlaylistId(p1Id);
    this.persistMeta();
  }

  private persistMeta(): void {
    const metas = Array.from(this.playlists.values()).map((p) => ({
      ...p.meta,
      itemCount: p.list.count,
    }));
    PersistenceService.savePlaylistsMeta(metas);
  }

  public subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  public notify(): void {
    this.subscribers.forEach((cb) => cb());
  }

  public getActivePlaylist(): ManagedPlaylist | null {
    return this.playlists.get(this.activePlaylistId) || null;
  }

  public getActivePlaylistId(): string {
    return this.activePlaylistId;
  }

  public getAllPlaylistsMeta(): PlaylistMetadata[] {
    return Array.from(this.playlists.values()).map((p) => ({
      ...p.meta,
      itemCount: p.list.count,
    }));
  }

  public getPlaylist(id: string): ManagedPlaylist | null {
    return this.playlists.get(id) || null;
  }

  public setActivePlaylist(id: string): void {
    if (this.playlists.has(id)) {
      this.activePlaylistId = id;
      PersistenceService.setActivePlaylistId(id);
      this.notify();
    }
  }

  public createPlaylist(name: string, description: string = ''): string {
    const id = `playlist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const list = new CircularPlaylist();
    const meta: PlaylistMetadata = {
      id,
      name: name.trim() || 'Untitled Playlist',
      description: description.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      itemCount: 0,
      coverColor: '#75E6C1',
    };

    this.playlists.set(id, { meta, list });
    this.activePlaylistId = id;
    PersistenceService.setActivePlaylistId(id);
    this.persistMeta();
    PersistenceService.savePlaylist(id, meta.name, list);
    this.notify();
    return id;
  }

  public renamePlaylist(id: string, newName: string): void {
    const managed = this.playlists.get(id);
    if (managed && newName.trim()) {
      managed.meta.name = newName.trim();
      managed.meta.updatedAt = Date.now();
      this.persistMeta();
      PersistenceService.savePlaylist(id, managed.meta.name, managed.list);
      this.notify();
    }
  }

  public deletePlaylist(id: string): boolean {
    if (this.playlists.size <= 1) {
      return false; // Prevent deleting the sole remaining playlist
    }

    if (this.playlists.delete(id)) {
      PersistenceService.deletePlaylist(id);
      this.persistMeta();
      if (this.activePlaylistId === id) {
        this.activePlaylistId = Array.from(this.playlists.keys())[0];
        PersistenceService.setActivePlaylistId(this.activePlaylistId);
      }
      this.notify();
      return true;
    }
    return false;
  }

  public addItem(item: MediaItem, targetPlaylistId?: string): void {
    const pid = targetPlaylistId || this.activePlaylistId;
    const managed = this.playlists.get(pid);
    if (!managed) return;

    managed.list.add(item);
    managed.meta.itemCount = managed.list.count;
    managed.meta.updatedAt = Date.now();

    this.persistMeta();
    PersistenceService.savePlaylist(pid, managed.meta.name, managed.list);
    this.notify();
  }

  public insertAfter(targetId: string, item: MediaItem, targetPlaylistId?: string): boolean {
    const pid = targetPlaylistId || this.activePlaylistId;
    const managed = this.playlists.get(pid);
    if (!managed) return false;

    const res = managed.list.insertAfter(targetId, item);
    if (res) {
      managed.meta.itemCount = managed.list.count;
      managed.meta.updatedAt = Date.now();
      this.persistMeta();
      PersistenceService.savePlaylist(pid, managed.meta.name, managed.list);
      this.notify();
      return true;
    }
    return false;
  }

  public removeItem(itemId: string, targetPlaylistId?: string): boolean {
    const pid = targetPlaylistId || this.activePlaylistId;
    const managed = this.playlists.get(pid);
    if (!managed) return false;

    const success = managed.list.remove(itemId);
    if (success) {
      managed.meta.itemCount = managed.list.count;
      managed.meta.updatedAt = Date.now();
      this.persistMeta();
      PersistenceService.savePlaylist(pid, managed.meta.name, managed.list);
      this.notify();
    }
    return success;
  }

  public selectItem(itemId: string, targetPlaylistId?: string): void {
    const pid = targetPlaylistId || this.activePlaylistId;
    const managed = this.playlists.get(pid);
    if (!managed) return;

    const selected = managed.list.select(itemId);
    if (selected) {
      PersistenceService.savePlaylist(pid, managed.meta.name, managed.list);
      this.notify();
    }
  }

  public next(targetPlaylistId?: string) {
    const pid = targetPlaylistId || this.activePlaylistId;
    const managed = this.playlists.get(pid);
    if (!managed) return null;

    const item = managed.list.next();
    if (item) {
      PersistenceService.savePlaylist(pid, managed.meta.name, managed.list);
      this.notify();
    }
    return item;
  }

  public previous(targetPlaylistId?: string) {
    const pid = targetPlaylistId || this.activePlaylistId;
    const managed = this.playlists.get(pid);
    if (!managed) return null;

    const item = managed.list.previous();
    if (item) {
      PersistenceService.savePlaylist(pid, managed.meta.name, managed.list);
      this.notify();
    }
    return item;
  }
}

export const playlistManager = new PlaylistManager();
