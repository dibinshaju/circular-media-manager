import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Repeat, Repeat1, ExternalLink, Film, Music, Maximize2
} from 'lucide-react';
import { playlistManager } from '../../services/PlaylistManager.js';
import { playbackService, PlaybackState } from '../../services/PlaybackService.js';
import { MediaNode } from '../../data-structures/MediaNode.js';

export const DockedPlayerBar: React.FC = () => {
  const [currentNode, setCurrentNode] = useState<MediaNode | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>(playbackService.getState());

  useEffect(() => {
    const update = () => {
      const active = playlistManager.getActivePlaylist();
      setCurrentNode(active?.list.current || null);
    };

    update();
    const unsubPlaylist = playlistManager.subscribe(update);
    const unsubPlayback = playbackService.subscribe(setPlaybackState);

    return () => {
      unsubPlaylist();
      unsubPlayback();
    };
  }, []);

  if (!currentNode) {
    return null;
  }

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = Number(e.target.value);
    playbackService.seek(targetTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    playbackService.setVolume(Number(e.target.value));
  };

  const handleCycleRepeat = () => {
    if (playbackState.repeatMode === 'playlist') {
      playbackService.setRepeatMode('track');
    } else if (playbackState.repeatMode === 'track') {
      playbackService.setRepeatMode('off');
    } else {
      playbackService.setRepeatMode('playlist');
    }
  };

  const maxDuration = playbackState.duration || currentNode.duration || 100;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-cream/95 backdrop-blur-md border-t-2 border-charcoal-border px-4 sm:px-8 py-3 shadow-[0_-4px_12px_rgba(41,41,41,0.08)]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Left: Track Information */}
        <div className="flex items-center gap-3 w-full md:w-1/4 min-w-0">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-charcoal-border shrink-0 bg-yellow-light">
            {currentNode.artwork ? (
              <img
                src={currentNode.artwork}
                alt={currentNode.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {currentNode.type === 'video' ? <Film className="w-5 h-5 text-charcoal" /> : <Music className="w-5 h-5 text-charcoal" />}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border border-charcoal-border ${
                currentNode.provider === 'spotify'
                  ? 'bg-mint text-charcoal'
                  : currentNode.type === 'video'
                  ? 'bg-yellow text-charcoal'
                  : 'bg-purple-light text-purple'
              }`}>
                {currentNode.provider === 'spotify' ? 'Spotify' : currentNode.type === 'video' ? 'Video' : 'Audio'}
              </span>
              <h4 className="font-extrabold text-sm text-charcoal truncate" title={currentNode.title}>
                {currentNode.title}
              </h4>
            </div>
            <p className="text-xs font-semibold text-charcoal-muted truncate">
              {currentNode.artist || 'Unknown'}
            </p>
          </div>
        </div>

        {/* Center: Playback Controls & Timeline */}
        <div className="flex flex-col items-center gap-1.5 w-full md:w-2/4 max-w-xl">
          <div className="flex items-center gap-4">
            
            {/* Repeat Toggle */}
            <button
              onClick={handleCycleRepeat}
              className={`p-1.5 rounded-full border border-charcoal-border text-xs transition-colors ${
                playbackState.repeatMode !== 'off'
                  ? 'bg-yellow text-charcoal font-black'
                  : 'bg-white text-charcoal-muted hover:text-charcoal'
              }`}
              title={`Repeat: ${playbackState.repeatMode}`}
            >
              {playbackState.repeatMode === 'track' ? (
                <Repeat1 className="w-3.5 h-3.5" />
              ) : (
                <Repeat className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Previous */}
            <button
              onClick={() => playbackService.previous()}
              className="w-9 h-9 rounded-full bg-white border-2 border-charcoal-border flex items-center justify-center shadow-editorial-sm hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all"
              title="Previous Node"
            >
              <SkipBack className="w-4 h-4 text-charcoal fill-charcoal" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={() => playbackService.togglePlay()}
              className="w-11 h-11 rounded-full bg-yellow border-2 border-charcoal-border flex items-center justify-center shadow-editorial-sm hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all"
              title={playbackState.isPlaying ? 'Pause' : 'Play'}
            >
              {playbackState.isPlaying ? (
                <Pause className="w-5 h-5 text-charcoal fill-charcoal" />
              ) : (
                <Play className="w-5 h-5 text-charcoal fill-charcoal ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={() => playbackService.next()}
              className="w-9 h-9 rounded-full bg-white border-2 border-charcoal-border flex items-center justify-center shadow-editorial-sm hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all"
              title="Next Node"
            >
              <SkipForward className="w-4 h-4 text-charcoal fill-charcoal" />
            </button>

            {/* Expand Video Button if Video */}
            {currentNode.type === 'video' && (
              <button
                onClick={() => playbackService.setVideoModalOpen(true)}
                className="p-1.5 rounded-full bg-purple text-white border border-charcoal-border hover:bg-purple-hover shadow-editorial-sm"
                title="Expand Video Theatre"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Seek Bar */}
          <div className="w-full flex items-center gap-2 text-[11px] font-bold text-charcoal-muted">
            <span className="w-8 text-right">{formatTime(playbackState.currentTime)}</span>
            <input
              type="range"
              min={0}
              max={maxDuration}
              step={0.5}
              value={playbackState.currentTime}
              onChange={handleSeek}
              className="flex-1 accent-purple cursor-pointer h-1.5 bg-charcoal-border/20 rounded-lg"
            />
            <span className="w-8">{formatTime(maxDuration)}</span>
          </div>
        </div>

        {/* Right: Volume & Outbound Links */}
        <div className="hidden md:flex items-center justify-end gap-3 w-1/4">
          {currentNode.provider === 'spotify' ? (
            <a
              href={currentNode.spotifyUrl || 'https://open.spotify.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-editorial-yellow text-xs px-3 py-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              Open in Spotify
            </a>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => playbackService.toggleMute()}
                className="text-charcoal hover:text-purple"
              >
                {playbackState.isMuted || playbackState.volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={playbackState.isMuted ? 0 : playbackState.volume}
                onChange={handleVolumeChange}
                className="w-20 accent-charcoal cursor-pointer h-1.5 bg-charcoal-border/20 rounded-lg"
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
