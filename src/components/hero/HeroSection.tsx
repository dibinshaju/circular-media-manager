import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, ArrowRight, Music, Film, 
  ExternalLink, Sparkles, RefreshCw, Volume2, ShieldCheck, Zap
} from 'lucide-react';
import { playlistManager } from '../../services/PlaylistManager.js';
import { playbackService, PlaybackState } from '../../services/PlaybackService.js';
import { MediaNode } from '../../data-structures/MediaNode.js';

interface HeroSectionProps {
  onBuildPlaylist: () => void;
  onExplorePlayer: () => void;
  onSelectTab: (tab: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onBuildPlaylist,
  onExplorePlayer,
  onSelectTab,
}) => {
  const [currentNode, setCurrentNode] = useState<MediaNode | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>(playbackService.getState());
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const update = () => {
      const active = playlistManager.getActivePlaylist();
      setCurrentNode(active?.list.current || null);
      setTotalItems(active?.list.count || 0);
    };

    update();
    const unsubPlaylist = playlistManager.subscribe(update);
    const unsubPlayback = playbackService.subscribe(setPlaybackState);

    return () => {
      unsubPlaylist();
      unsubPlayback();
    };
  }, []);

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const prevNode = currentNode?.prev;
  const nextNode = currentNode?.next;

  return (
    <section className="relative px-4 sm:px-8 pt-8 pb-16 md:pt-16 md:pb-24 max-w-7xl mx-auto overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        
        {/* Left Column: Headline, Copy & Actions */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Mint Pill */}
          <div className="inline-block">
            <span className="pill-mint">
              <span className="w-2 h-2 rounded-full bg-charcoal animate-pulse"></span>
              YOUR MEDIA, CONNECTED
            </span>
          </div>

          {/* Oversized Headline with Marker Yellow Highlight */}
          <h1 className="font-orbitron text-4xl sm:text-6xl lg:text-[68px] font-extrabold tracking-tight text-charcoal leading-[1.08]">
            Your music.<br />
            Your videos.<br />
            <span className="marker-highlight">One endless loop.</span>
          </h1>

          {/* Supporting Copy */}
          <p className="text-lg sm:text-xl text-charcoal-muted max-w-xl font-medium leading-relaxed">
            Build your own playlists, explore Spotify tracks, and move through your media without ever reaching the end.
          </p>

          {/* CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={onBuildPlaylist}
              className="btn-editorial-purple text-base sm:text-lg px-7 py-3.5 group"
            >
              Build a playlist
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onExplorePlayer}
              className="btn-editorial-white text-base sm:text-lg px-7 py-3.5 group"
            >
              Explore the player
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Data Structure Subtitle Note */}
          <div className="pt-2 flex items-center gap-2 text-xs sm:text-sm font-semibold text-charcoal-muted">
            <span className="w-2 h-2 rounded-full bg-purple"></span>
            Powered by a circular linked list. Designed for continuous discovery.
          </div>
        </div>

        {/* Right Column: Floating Interactive Player Preview Card */}
        <div className="lg:col-span-5 relative">
          
          {/* Main Card */}
          <div className="card-editorial p-6 sm:p-7 relative z-10 bg-white">
            
            {/* Card Header */}
            <div className="flex items-start justify-between pb-4 border-b-2 border-charcoal-light mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple flex items-center justify-center text-white border-2 border-charcoal-border shadow-editorial-sm">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-charcoal leading-tight">
                    Your playlist, in motion
                  </h3>
                  <p className="text-xs font-semibold text-charcoal-muted">
                    Every track connected ({totalItems} items)
                  </p>
                </div>
              </div>
              <span className="pill-yellow shadow-editorial-sm">
                LIVE PLAYER
              </span>
            </div>

            {/* Current Item Artwork & Metadata */}
            <div className="flex gap-4 items-center mb-5 bg-charcoal-light/40 p-3.5 rounded-2xl border-2 border-charcoal-border">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-charcoal-border shrink-0 bg-yellow-light">
                {currentNode?.artwork ? (
                  <img
                    src={currentNode.artwork}
                    alt={currentNode.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-charcoal">
                    {currentNode?.type === 'video' ? <Film className="w-8 h-8" /> : <Music className="w-8 h-8" />}
                  </div>
                )}
                {/* Loop badge */}
                <div className="absolute bottom-1 right-1 bg-yellow border border-charcoal-border rounded-full p-1 shadow-sm">
                  <RefreshCw className="w-2.5 h-2.5 text-charcoal" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-charcoal-border ${
                    currentNode?.provider === 'spotify'
                      ? 'bg-mint text-charcoal'
                      : currentNode?.type === 'video'
                      ? 'bg-yellow text-charcoal'
                      : 'bg-purple-light text-purple'
                  }`}>
                    {currentNode?.provider === 'spotify' ? 'Spotify' : currentNode?.type === 'video' ? 'Video' : 'Audio'}
                  </span>
                  <span className="text-[10px] font-bold text-charcoal-muted">
                    {currentNode?.duration ? formatTime(currentNode.duration) : 'Stream'}
                  </span>
                </div>

                <h4 className="font-black text-base sm:text-lg text-charcoal truncate leading-tight">
                  {currentNode?.title || 'No track selected'}
                </h4>
                <p className="text-xs sm:text-sm font-semibold text-charcoal-muted truncate">
                  {currentNode?.artist || 'Unknown creator'}
                </p>
              </div>
            </div>

            {/* Pointer Bubble Simulation (Curio Chat style) */}
            <div className="space-y-2 mb-5">
              {/* Prev & Next pointer indicator bubble */}
              <div className="bg-yellow-light border-2 border-charcoal-border p-3 rounded-2xl text-xs font-bold text-charcoal shadow-editorial-sm flex items-center justify-between">
                <span className="truncate max-w-[45%] text-charcoal-muted">
                  {prevNode ? prevNode.title : '—'}
                </span>
                <span className="text-purple shrink-0 px-2 font-black">
                  CDLL CYCLE
                </span>
                <span className="truncate max-w-[45%] text-right text-charcoal-muted">
                  {nextNode ? nextNode.title : '—'}
                </span>
              </div>

              {/* Status pill inside card */}
              <div className="flex items-center gap-2">
                <div className="pill-mint text-[11px] py-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  Invariants Valid: O(1) Wraparound
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-5 space-y-1.5">
              <div className="w-full bg-cream border-2 border-charcoal-border h-3.5 rounded-full overflow-hidden p-0.5 relative">
                <div 
                  className="bg-purple h-full rounded-full transition-all duration-150"
                  style={{
                    width: `${playbackState.duration > 0 ? (playbackState.currentTime / playbackState.duration) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-bold text-charcoal-muted">
                <span>{formatTime(playbackState.currentTime)}</span>
                <span>{formatTime(playbackState.duration || currentNode?.duration || 0)}</span>
              </div>
            </div>

            {/* Interactive Player Controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => playbackService.previous()}
                className="w-11 h-11 rounded-full bg-white border-2 border-charcoal-border flex items-center justify-center shadow-editorial-sm hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-editorial-press transition-all"
                title="Previous track (CDLL head/tail wraparound)"
              >
                <SkipBack className="w-5 h-5 text-charcoal fill-charcoal" />
              </button>

              <button
                onClick={() => playbackService.togglePlay()}
                className="w-14 h-14 rounded-full bg-yellow border-2 border-charcoal-border flex items-center justify-center shadow-editorial hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-editorial-press transition-all"
                title={playbackState.isPlaying ? 'Pause' : 'Play'}
              >
                {playbackState.isPlaying ? (
                  <Pause className="w-6 h-6 text-charcoal fill-charcoal" />
                ) : (
                  <Play className="w-6 h-6 text-charcoal fill-charcoal ml-0.5" />
                )}
              </button>

              <button
                onClick={() => playbackService.next()}
                className="w-11 h-11 rounded-full bg-white border-2 border-charcoal-border flex items-center justify-center shadow-editorial-sm hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-editorial-press transition-all"
                title="Next track (CDLL wraparound)"
              >
                <SkipForward className="w-5 h-5 text-charcoal fill-charcoal" />
              </button>
            </div>

            {/* Outbound Spotify Link if current is Spotify */}
            {currentNode?.provider === 'spotify' && (
              <div className="mt-4 pt-3 border-t border-charcoal-light flex justify-center">
                <a
                  href={currentNode.spotifyUrl || 'https://open.spotify.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-charcoal hover:text-purple"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in Spotify
                </a>
              </div>
            )}
          </div>

          {/* Under-card Pills Cluster (Inspired by Curio screenshot pill tags: Math, Physics, CS...) */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            <span className="pill-yellow cursor-default shadow-editorial-sm">
              Local Audio
            </span>
            <span className="pill-yellow cursor-default shadow-editorial-sm">
              Local Video
            </span>
            <span className="pill-yellow cursor-default shadow-editorial-sm">
              Spotify Reference
            </span>
            <span className="pill-yellow cursor-default shadow-editorial-sm">
              Endless Loop
            </span>
            <span className="pill-yellow cursor-default shadow-editorial-sm">
              O(1) Nav
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};
