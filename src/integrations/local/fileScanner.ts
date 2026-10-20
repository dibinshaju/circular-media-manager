import { MediaItem, MediaType } from '../../types/media.js';
import { mediaRegistry } from './mediaRegistry.js';
import { saveFileBlob } from './indexedDbStorage.js';

export function getMediaTypeFromMime(mime: string, filename: string): MediaType | null {
  if (mime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(filename)) {
    return 'audio';
  }
  if (mime.startsWith('video/') || /\.(mp4|webm|ogv|mov)$/i.test(filename)) {
    return 'video';
  }
  return null;
}

export function cleanFileName(name: string): { title: string; artist: string } {
  const withoutExt = name.replace(/\.[^/.]+$/, '');
  const parts = withoutExt.split(' - ');
  if (parts.length >= 2) {
    return {
      artist: parts[0].trim(),
      title: parts.slice(1).join(' - ').trim(),
    };
  }
  return {
    title: withoutExt.trim(),
    artist: 'Local File',
  };
}

export async function extractMediaDuration(file: File, type: MediaType): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const element = type === 'audio' ? new Audio() : document.createElement('video');
    element.preload = 'metadata';

    const cleanUp = () => {
      URL.revokeObjectURL(url);
    };

    element.onloadedmetadata = () => {
      const dur = element.duration;
      cleanUp();
      resolve(Number.isFinite(dur) && dur > 0 ? Math.round(dur) : 0);
    };

    element.onerror = () => {
      cleanUp();
      resolve(0);
    };

    element.src = url;
  });
}

export async function generateVideoThumbnail(file: File): Promise<string | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      URL.revokeObjectURL(url);
    };

    video.onloadeddata = () => {
      // Seek to 1s or middle to get a non-black frame
      video.currentTime = Math.min(1.0, video.duration / 2 || 0);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          cleanup();
          resolve(dataUrl);
          return;
        }
      } catch {
        // Ignore canvas read error
      }
      cleanup();
      resolve(undefined);
    };

    video.onerror = () => {
      cleanup();
      resolve(undefined);
    };

    video.src = url;
  });
}

export async function processLocalFile(file: File): Promise<MediaItem> {
  const type = getMediaTypeFromMime(file.type, file.name);
  if (!type) {
    throw new Error(`Unsupported media format: ${file.name}. Please upload an audio or video file.`);
  }

  const { title, artist } = cleanFileName(file.name);
  const id = `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Save blob in IndexedDB for persistent offline retrieval
  await saveFileBlob(id, file);

  // Managed Object URL for immediate playback
  const source = mediaRegistry.createUrl(file);

  // Extract duration and thumbnail in parallel
  const [duration, artwork] = await Promise.all([
    extractMediaDuration(file, type).catch(() => 0),
    type === 'video' ? generateVideoThumbnail(file).catch(() => undefined) : Promise.resolve(undefined),
  ]);

  return {
    id,
    title,
    artist,
    type,
    source,
    provider: 'local',
    duration: duration || undefined,
    artwork,
    mimeType: file.type || (type === 'audio' ? 'audio/mpeg' : 'video/mp4'),
    fileSize: file.size,
    addedAt: Date.now(),
    isCustomUploaded: true,
  };
}
