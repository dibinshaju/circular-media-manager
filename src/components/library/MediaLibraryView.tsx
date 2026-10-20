import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Plus, Music2, Film, Music, Check, Trash2, 
  ExternalLink, Play, Upload, Filter, ListMusic
} from 'lucide-react';
import { playlistManager } from '../../services/PlaylistManager.js';
import { playbackService } from '../../services/PlaybackService.js';
import { MediaItem } from '../../types/media.js';
import { processLocalFile } from '../../integrations/local/fileScanner.js';
import { DEMO_SPOTIFY_TRACKS } from '../../integrations/spotify/spotifyApi.js';

interface MediaLibraryViewProps {
  onOpenSpotifyModal: () => void;
  onOpenNewPlaylistModal: () => void;
}

export const MediaLibraryView: React.FC<MediaLibraryViewProps> = ({
  onOpenSpotifyModal,
  onOpenNewPlaylistModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'audio' | 'video' | 'spotify'>('all');
  const [activePlaylistId, setActivePlaylistId] = useState(playlistManager.getActivePlaylistId());
  const [playlistsMeta, setPlaylistsMeta] = useState(playlistManager.getAllPlaylistsMeta());
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active playlist items
  const [playlistItems, setPlaylistItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    const update = () => {
      setActivePlaylistId(playlistManager.getActivePlaylistId());
      setPlaylistsMeta(playlistManager.getAllPlaylistsMeta());
      const active = playlistManager.getActivePlaylist();
      if (active) {
        setPlaylistItems(active.list.getAll().map((n) => n.toJSON()));
        setCurrentTrackId(active.list.current?.id || null);
      } else {
        setPlaylistItems([]);
        setCurrentTrackId(null);
      }
    };

    update();
    return playlistManager.subscribe(update);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const mediaItem = await processLocalFile(file);
        playlistManager.addItem(mediaItem, activePlaylistId);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePlayItem = (item: MediaItem) => {
    playlistManager.selectItem(item.id, activePlaylistId);
    playbackService.play();
  };

  const handleRemoveItem = (item: MediaItem) => {
    playlistManager.removeItem(item.id, activePlaylistId);
  };

  // Filter items based on search query and type filter
  const filteredItems = playlistItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.artist && item.artist.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === 'audio') return item.type === 'audio' && item.provider === 'local';
    if (filterType === 'video') return item.type === 'video';
    if (filterType === 'spotify') return item.provider === 'spotify';
    return true;
  });

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <section className="py-12 px-4 sm:px-8 max-w-7xl mx-auto">
      
      {/* Hidden file input for uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        accept="audio/*,video/*,.mp3,.wav,.ogg,.m4a,.mp4,.webm,.mov"
        className="hidden"
      />

      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-block mb-2">
            <span className="pill-mint shadow-editorial-sm">
              <ListMusic className="w-3.5 h-3.5" />
              MEDIA VAULT
            </span>
          </div>
          <h2 className="font-orbitron text-3xl sm:text-5xl font-extrabold text-charcoal tracking-tight">
            Everything in your orbit.
          </h2>
          <p className="text-charcoal-muted text-base sm:text-lg font-medium mt-1">
            Your tracks, videos, and playlists — connected in one place.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="btn-editorial-purple text-sm"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? 'Importing Media...' : 'Add Media (Local)'}
          </button>

          <button
            onClick={onOpenSpotifyModal}
            className="btn-editorial-yellow text-sm"
          >
            <Music2 className="w-4 h-4 mr-2" />
            Connect Spotify
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="mb-6 p-4 rounded-2xl bg-red-100 border-2 border-red-500 text-red-900 font-bold text-sm shadow-editorial-sm">
          ⚠️ {uploadError}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card-editorial p-4 sm:p-5 mb-8 bg-white">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Search input with charcoal border */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-charcoal-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, artist or creator..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full border-2 border-charcoal-border bg-cream font-medium text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-purple/50 placeholder:text-charcoal-muted"
            />
          </div>

          {/* Type Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-charcoal-muted mr-1 hidden sm:inline">Filter:</span>
            
            {(['all', 'audio', 'video', 'spotify'] as const).map((type) => {
              const active = filterType === type;
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase border-2 border-charcoal-border transition-all ${
                    active
                      ? 'bg-yellow text-charcoal shadow-editorial-sm'
                      : 'bg-white text-charcoal hover:bg-cream'
                  }`}
                >
                  {type === 'all' ? 'All' : type === 'audio' ? 'Music' : type === 'video' ? 'Video' : 'Spotify'}
                </button>
              );
            })}
          </div>

          {/* Playlist Selector Dropdown */}
          <div className="w-full md:w-auto flex items-center gap-2">
            <span className="text-xs font-bold text-charcoal-muted">Active Playlist:</span>
            <select
              value={activePlaylistId}
              onChange={(e) => playlistManager.setActivePlaylist(e.target.value)}
              className="px-3 py-2 rounded-xl border-2 border-charcoal-border bg-white text-xs font-bold text-charcoal shadow-editorial-sm focus:outline-none"
            >
              {playlistsMeta.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.itemCount})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Media Items Responsive Grid */}
      {filteredItems.length === 0 ? (
        /* Designed Empty State */
        <div className="card-editorial p-12 text-center bg-white">
          <div className="w-16 h-16 rounded-3xl bg-yellow border-2 border-charcoal-border mx-auto flex items-center justify-center shadow-editorial mb-4">
            <Music className="w-8 h-8 text-charcoal" />
          </div>
          <h3 className="text-xl font-extrabold text-charcoal mb-2">
            No media found in orbit
          </h3>
          <p className="text-charcoal-muted text-sm font-semibold max-w-md mx-auto mb-6">
            {searchQuery
              ? `No tracks or videos match "${searchQuery}". Try a different keyword.`
              : 'Add your favorite MP3s, MP4s, or explore Spotify track references to get your endless loop rolling!'}
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-editorial-purple text-xs"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Upload Media
            </button>
            <button
              onClick={onOpenSpotifyModal}
              className="btn-editorial-yellow text-xs"
            >
              <Music2 className="w-3.5 h-3.5 mr-1.5" />
              Browse Spotify
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const isPlaying = item.id === currentTrackId;

            return (
              <div
                key={item.id}
                className={`card-editorial p-5 bg-white transition-all flex flex-col justify-between group ${
                  isPlaying ? 'ring-2 ring-purple bg-yellow-light/30' : 'hover:-translate-y-1'
                }`}
              >
                <div>
                  {/* Top row: Badges */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-charcoal-border ${
                      item.provider === 'spotify'
                        ? 'bg-mint text-charcoal'
                        : item.type === 'video'
                        ? 'bg-yellow text-charcoal'
                        : 'bg-purple-light text-purple'
                    }`}>
                      {item.provider === 'spotify' ? 'Spotify Ref' : item.type === 'video' ? 'Local Video' : 'Local Audio'}
                    </span>

                    <span className="text-xs font-bold text-charcoal-muted">
                      {formatDuration(item.duration)}
                    </span>
                  </div>

                  {/* Artwork & Title */}
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-charcoal-border shrink-0 bg-cream">
                      {item.artwork ? (
                        <img
                          src={item.artwork}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {item.type === 'video' ? (
                            <Film className="w-6 h-6 text-charcoal" />
                          ) : (
                            <Music className="w-6 h-6 text-charcoal" />
                          )}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-base text-charcoal truncate" title={item.title}>
                        {item.title}
                      </h4>
                      <p className="text-xs font-semibold text-charcoal-muted truncate">
                        {item.artist || 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Card Controls */}
                <div className="pt-3 border-t-2 border-charcoal-light flex items-center justify-between">
                  {/* Play / Select */}
                  <button
                    onClick={() => handlePlayItem(item)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-yellow border-2 border-charcoal-border shadow-editorial-sm hover:-translate-y-0.5 transition-all"
                  >
                    <Play className="w-3 h-3 fill-charcoal" />
                    {isPlaying ? 'Playing Now' : 'Play'}
                  </button>

                  <div className="flex items-center gap-2">
                    {/* External Spotify Link if applicable */}
                    {item.spotifyUrl && (
                      <a
                        href={item.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg border border-charcoal-border hover:bg-cream text-charcoal"
                        title="Open in Spotify"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {/* Remove Action */}
                    <button
                      onClick={() => handleRemoveItem(item)}
                      className="p-1.5 rounded-lg border border-charcoal-border hover:bg-red-100 text-charcoal hover:text-red-700 transition-colors"
                      title="Remove from playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
