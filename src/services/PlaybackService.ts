import { playlistManager } from './PlaylistManager.js';
import { MediaNode } from '../data-structures/MediaNode.js';

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: 'playlist' | 'track' | 'off';
  isVideoModalOpen: boolean;
  error?: string | null;
}

type PlaybackListener = (state: PlaybackState) => void;

class PlaybackService {
  private audio: HTMLAudioElement;
  private videoRef: HTMLVideoElement | null = null;
  private listeners: Set<PlaybackListener> = new Set();

  private state: PlaybackState = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
    repeatMode: 'playlist',
    isVideoModalOpen: false,
    error: null,
  };

  private currentLoadedId: string | null = null;

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.volume = this.state.volume;

    this.setupAudioListeners();

    // Listen for playlist changes
    playlistManager.subscribe(() => {
      const active = playlistManager.getActivePlaylist();
      const current = active?.list.current;
      if (current && current.id !== this.currentLoadedId) {
        this.loadMedia(current, this.state.isPlaying);
      }
    });
  }

  private setupAudioListeners(): void {
    this.audio.addEventListener('timeupdate', () => {
      this.state.currentTime = this.audio.currentTime;
      this.notify();
    });

    this.audio.addEventListener('loadedmetadata', () => {
      this.state.duration = this.audio.duration || 0;
      this.notify();
    });

    this.audio.addEventListener('ended', () => {
      this.handleMediaEnded();
    });

    this.audio.addEventListener('error', () => {
      const active = playlistManager.getActivePlaylist();
      const current = active?.list.current;
      if (current?.provider === 'local') {
        this.state.error = 'Unable to play local audio stream. Media might be unavailable.';
      }
      this.state.isPlaying = false;
      this.notify();
    });
  }

  private handleMediaEnded(): void {
    if (this.state.repeatMode === 'track') {
      this.seek(0);
      this.play();
    } else {
      // In a circular playlist, next() naturally wraps around continuously!
      this.next();
      if (this.state.repeatMode !== 'off') {
        this.play();
      }
    }
  }

  public registerVideoElement(el: HTMLVideoElement | null): void {
    this.videoRef = el;
    if (this.videoRef) {
      this.videoRef.volume = this.state.volume;
      this.videoRef.muted = this.state.isMuted;

      this.videoRef.ontimeupdate = () => {
        this.state.currentTime = this.videoRef?.currentTime || 0;
        this.notify();
      };
      this.videoRef.onloadedmetadata = () => {
        this.state.duration = this.videoRef?.duration || 0;
        this.notify();
      };
      this.videoRef.onended = () => {
        this.handleMediaEnded();
      };
    }
  }

  public subscribe(listener: PlaybackListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const copy = { ...this.state };
    this.listeners.forEach((l) => l(copy));
  }

  public getState(): PlaybackState {
    return { ...this.state };
  }

  public loadMedia(node: MediaNode, autoPlay: boolean = false): void {
    this.currentLoadedId = node.id;
    this.state.currentTime = 0;
    this.state.duration = node.duration || 0;
    this.state.error = null;

    if (node.provider === 'spotify') {
      // Spotify content: pauses local player; relies on Open in Spotify or Spotify Embed
      this.audio.pause();
      if (this.videoRef) this.videoRef.pause();
      this.state.isPlaying = false;
      this.notify();
      return;
    }

    if (node.type === 'video') {
      this.audio.pause();
      this.audio.removeAttribute('src');
      if (this.videoRef) {
        this.videoRef.src = node.source;
        if (autoPlay) {
          this.videoRef.play().catch(() => {
            this.state.isPlaying = false;
            this.notify();
          });
          this.state.isPlaying = true;
        }
      }
      this.state.isVideoModalOpen = true;
    } else {
      // Local audio
      if (this.videoRef) {
        this.videoRef.pause();
        this.videoRef.removeAttribute('src');
      }
      this.audio.src = node.source;
      if (autoPlay) {
        this.audio.play().catch(() => {
          this.state.isPlaying = false;
          this.notify();
        });
        this.state.isPlaying = true;
      }
    }

    this.notify();
  }

  public async play(): Promise<void> {
    const active = playlistManager.getActivePlaylist();
    const current = active?.list.current;
    if (!current) return;

    if (this.currentLoadedId !== current.id) {
      this.loadMedia(current, true);
      return;
    }

    this.state.error = null;

    if (current.provider === 'spotify') {
      // Outbound Spotify link or preview
      if (current.spotifyUrl) {
        window.open(current.spotifyUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    if (current.type === 'video') {
      this.state.isVideoModalOpen = true;
      if (this.videoRef) {
        try {
          await this.videoRef.play();
          this.state.isPlaying = true;
        } catch (e: any) {
          this.state.isPlaying = false;
        }
      }
    } else {
      try {
        await this.audio.play();
        this.state.isPlaying = true;
      } catch (e: any) {
        this.state.isPlaying = false;
      }
    }

    this.notify();
  }

  public pause(): void {
    const active = playlistManager.getActivePlaylist();
    const current = active?.list.current;

    if (current?.type === 'video' && this.videoRef) {
      this.videoRef.pause();
    } else {
      this.audio.pause();
    }

    this.state.isPlaying = false;
    this.notify();
  }

  public togglePlay(): void {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public next(): void {
    const wasPlaying = this.state.isPlaying;
    const nextNode = playlistManager.next();
    if (nextNode) {
      this.loadMedia(nextNode, wasPlaying);
    }
  }

  public previous(): void {
    const wasPlaying = this.state.isPlaying;
    const prevNode = playlistManager.previous();
    if (prevNode) {
      this.loadMedia(prevNode, wasPlaying);
    }
  }

  public seek(time: number): void {
    const clamped = Math.max(0, Math.min(time, this.state.duration || 1000));
    this.state.currentTime = clamped;

    const active = playlistManager.getActivePlaylist();
    const current = active?.list.current;

    if (current?.type === 'video' && this.videoRef) {
      this.videoRef.currentTime = clamped;
    } else {
      this.audio.currentTime = clamped;
    }

    this.notify();
  }

  public setVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(volume, 1));
    this.state.volume = clamped;
    this.state.isMuted = clamped === 0;

    this.audio.volume = clamped;
    if (this.videoRef) this.videoRef.volume = clamped;

    this.notify();
  }

  public toggleMute(): void {
    this.state.isMuted = !this.state.isMuted;
    this.audio.muted = this.state.isMuted;
    if (this.videoRef) this.videoRef.muted = this.state.isMuted;
    this.notify();
  }

  public setRepeatMode(mode: 'playlist' | 'track' | 'off'): void {
    this.state.repeatMode = mode;
    this.notify();
  }

  public setVideoModalOpen(open: boolean): void {
    this.state.isVideoModalOpen = open;
    this.notify();
  }
}

export const playbackService = new PlaybackService();
