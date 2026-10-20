import { PlaylistMetadata, SerializedPlaylist, MediaItem } from '../types/media.js';
import { CircularPlaylist } from '../data-structures/CircularPlaylist.js';
import { getFileBlob } from '../integrations/local/indexedDbStorage.js';
import { mediaRegistry } from '../integrations/local/mediaRegistry.js';

const META_KEY = 'loopify_playlists_metadata';
const ACTIVE_PLAYLIST_KEY = 'loopify_active_playlist_id';
const DATA_PREFIX = 'loopify_playlist_items_';

export class PersistenceService {
  /**
   * Save list of all playlist metadata.
   */
  public static savePlaylistsMeta(metaList: PlaylistMetadata[]): void {
    try {
      localStorage.setItem(META_KEY, JSON.stringify(metaList));
    } catch (err) {
      console.warn('Failed to save playlist metadata to localStorage:', err);
    }
  }

  /**
   * Load all playlist metadata.
   */
  public static loadPlaylistsMeta(): PlaylistMetadata[] {
    try {
      const raw = localStorage.getItem(META_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save an individual playlist's ordered items and selection state.
   * Notice: We serialize the ordered array of media items, NOT memory pointers!
   */
  public static savePlaylist(playlistId: string, name: string, playlist: CircularPlaylist): void {
    try {
      const items = playlist.getAll().map((node) => node.toJSON());
      const serialized: SerializedPlaylist = {
        id: playlistId,
        name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        selectedItemId: playlist.current ? playlist.current.id : null,
        items,
      };
      localStorage.setItem(`${DATA_PREFIX}${playlistId}`, JSON.stringify(serialized));
    } catch (err) {
      console.warn(`Failed to save playlist data for ${playlistId}:`, err);
    }
  }

  /**
   * Load and reconstruct a CircularPlaylist instance from serialized data.
   * Restores circular pointer invariants and re-hydrates IndexedDB blobs for local media.
   */
  public static async loadPlaylist(playlistId: string): Promise<{
    playlist: CircularPlaylist;
    name: string;
    selectedItemId: string | null;
  } | null> {
    try {
      const raw = localStorage.getItem(`${DATA_PREFIX}${playlistId}`);
      if (!raw) return null;

      const data: SerializedPlaylist = JSON.parse(raw);
      const playlist = new CircularPlaylist();

      for (const item of data.items) {
        let hydratedItem = { ...item };

        // If it was a local uploaded file, restore its Object URL from IndexedDB blob
        if (item.provider === 'local' && item.isCustomUploaded) {
          const blob = await getFileBlob(item.id);
          if (blob) {
            hydratedItem.source = mediaRegistry.createUrl(blob);
          }
        }

        playlist.add(hydratedItem);
      }

      if (data.selectedItemId) {
        playlist.select(data.selectedItemId);
      }

      return {
        playlist,
        name: data.name,
        selectedItemId: data.selectedItemId,
      };
    } catch (err) {
      console.warn(`Failed to load playlist ${playlistId}:`, err);
      return null;
    }
  }

  /**
   * Delete playlist data from localStorage.
   */
  public static deletePlaylist(playlistId: string): void {
    localStorage.removeItem(`${DATA_PREFIX}${playlistId}`);
  }

  /**
   * Active playlist ID persistence.
   */
  public static getActivePlaylistId(): string | null {
    return localStorage.getItem(ACTIVE_PLAYLIST_KEY);
  }

  public static setActivePlaylistId(id: string): void {
    localStorage.setItem(ACTIVE_PLAYLIST_KEY, id);
  }

  /**
   * Export all playlists as a backup JSON document.
   */
  public static exportAllPlaylistsJSON(): string {
    const meta = this.loadPlaylistsMeta();
    const fullData: Record<string, any> = {
      version: '1.0',
      exportedAt: Date.now(),
      playlists: [],
    };

    for (const m of meta) {
      const raw = localStorage.getItem(`${DATA_PREFIX}${m.id}`);
      if (raw) {
        fullData.playlists.push(JSON.parse(raw));
      }
    }

    return JSON.stringify(fullData, null, 2);
  }

  /**
   * Import playlists from JSON backup.
   */
  public static importPlaylistsJSON(jsonStr: string): number {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.playlists || !Array.isArray(parsed.playlists)) {
        throw new Error('Invalid JSON format: missing playlists array.');
      }

      const existingMeta = this.loadPlaylistsMeta();
      let importedCount = 0;

      for (const p of parsed.playlists) {
        if (!p.id || !p.name || !Array.isArray(p.items)) continue;

        localStorage.setItem(`${DATA_PREFIX}${p.id}`, JSON.stringify(p));

        const existingIndex = existingMeta.findIndex((m) => m.id === p.id);
        const metaItem: PlaylistMetadata = {
          id: p.id,
          name: p.name,
          description: p.description || '',
          createdAt: p.createdAt || Date.now(),
          updatedAt: Date.now(),
          itemCount: p.items.length,
        };

        if (existingIndex >= 0) {
          existingMeta[existingIndex] = metaItem;
        } else {
          existingMeta.push(metaItem);
        }
        importedCount++;
      }

      this.savePlaylistsMeta(existingMeta);
      return importedCount;
    } catch (err: any) {
      throw new Error(`Import failed: ${err.message}`);
    }
  }
}
