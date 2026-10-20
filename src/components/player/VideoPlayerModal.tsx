import React, { useEffect, useRef } from 'react';
import { X, Film, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { playbackService, PlaybackState } from '../../services/PlaybackService.js';
import { playlistManager } from '../../services/PlaylistManager.js';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ isOpen, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playbackState, setPlaybackState] = React.useState<PlaybackState>(playbackService.getState());

  useEffect(() => {
    return playbackService.subscribe(setPlaybackState);
  }, []);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      playbackService.registerVideoElement(videoRef.current);
    } else {
      playbackService.registerVideoElement(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const active = playlistManager.getActivePlaylist();
  const current = active?.list.current;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="card-editorial bg-white max-w-4xl w-full overflow-hidden shadow-2xl relative">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-charcoal-light bg-cream">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-yellow border border-charcoal-border flex items-center justify-center text-charcoal shadow-editorial-sm">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-charcoal text-base truncate max-w-md">
                {current?.title || 'Video Player'}
              </h3>
              <p className="text-xs font-semibold text-charcoal-muted">
                {current?.artist || 'Local Video Stream'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border-2 border-charcoal-border bg-white hover:bg-yellow shadow-editorial-sm transition-all"
            aria-label="Close video player"
          >
            <X className="w-5 h-5 text-charcoal" />
          </button>
        </div>

        {/* Video Canvas / Element */}
        <div className="relative bg-black aspect-video flex items-center justify-center">
          {current?.source ? (
            <video
              ref={videoRef}
              src={current.source}
              className="w-full h-full object-contain"
              playsInline
              controls
              autoPlay
            />
          ) : (
            <div className="text-white text-sm font-semibold">
              No video source available.
            </div>
          )}
        </div>

        {/* Bottom controls / info */}
        <div className="p-4 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="pill-mint text-[11px]">
              HTML5 Video Player
            </span>
            <span className="pill-yellow text-[11px]">
              Continuous CDLL Looping
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => playbackService.previous()}
              className="btn-editorial-white text-xs px-3 py-1.5"
            >
              <SkipBack className="w-3.5 h-3.5 mr-1" />
              Prev Video
            </button>
            <button
              onClick={() => playbackService.next()}
              className="btn-editorial-purple text-xs px-3 py-1.5"
            >
              Next Video
              <SkipForward className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
