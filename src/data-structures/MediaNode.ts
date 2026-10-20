import { MediaItem, MediaType, MediaProvider } from '../types/media.js';

/**
 * MediaNode represents an individual node in the Circular Doubly Linked List.
 * 
 * Invariants:
 * - In a nonempty list, next and prev must always point to valid MediaNode instances (never null).
 * - For a single node list, next and prev point to the node itself (next === this && prev === this).
 */
export class MediaNode {
  public readonly id: string;
  public title: string;
  public artist?: string;
  public type: MediaType;
  public source: string;
  public provider: MediaProvider;
  public duration?: number;
  public artwork?: string;
  public spotifyUri?: string;
  public spotifyUrl?: string;
  public mimeType?: string;
  public media: MediaItem;

  public next: MediaNode | null = null;
  public prev: MediaNode | null = null;

  constructor(media: MediaItem) {
    this.id = media.id;
    this.title = media.title;
    this.artist = media.artist;
    this.type = media.type;
    this.source = media.source;
    this.provider = media.provider;
    this.duration = media.duration;
    this.artwork = media.artwork;
    this.spotifyUri = media.spotifyUri;
    this.spotifyUrl = media.spotifyUrl;
    this.mimeType = media.mimeType;
    this.media = { ...media };
  }

  /**
   * Returns a snapshot of this node's media data for UI/persistence.
   */
  public toJSON(): MediaItem {
    return { ...this.media };
  }

  /**
   * Helper for debugging pointer state.
   */
  public inspectPointer(): { id: string; title: string; prevId: string | null; nextId: string | null } {
    return {
      id: this.id,
      title: this.title,
      prevId: this.prev ? this.prev.id : null,
      nextId: this.next ? this.next.id : null,
    };
  }
}
