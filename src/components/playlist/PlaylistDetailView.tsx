import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, Trash2, Edit2, Plus, Film, Music, 
  ArrowRight, ArrowLeft, RefreshCw, Layers, ShieldCheck, ChevronRight
} from 'lucide-react';
import { playlistManager, ManagedPlaylist } from '../../services/PlaylistManager.js';
import { playbackService, PlaybackState } from '../../services/PlaybackService.js';
import { MediaNode } from '../../data-structures/MediaNode.js';

interface PlaylistDetailViewProps {
  onOpenNewPlaylistModal: () => void;
  onOpenAddMediaModal: () => void;
}

export const PlaylistDetailView: React.FC<PlaylistDetailViewProps> = ({
  onOpenNewPlaylistModal,
  onOpenAddMediaModal,
}) => {
  const [activePlaylist, setActivePlaylist] = useState<ManagedPlaylist | null>(playlistManager.getActivePlaylist());
  const [allPlaylists, setAllPlaylists] = useState(playlistManager.getAllPlaylistsMeta());
  const [playbackState, setPlaybackState] = useState<PlaybackState>(playbackService.getState());
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');

  useEffect(() => {
    const update = () => {
      const active = playlistManager.getActivePlaylist();
      setActivePlaylist(active);
      setAllPlaylists(playlistManager.getAllPlaylistsMeta());
      if (active) {
        setEditNameValue(active.meta.name);
      }
    };

    update();
    const unsubPlaylist = playlistManager.subscribe(update);
    const unsubPlayback = playbackService.subscribe(setPlaybackState);

    return () => {
      unsubPlaylist();
      unsubPlayback();
    };
  }, []);

  if (!activePlaylist) {
    return (
      <div className="py-16 text-center text-charcoal">
        <h3 className="text-xl font-bold">No active playlist selected</h3>
      </div>
    );
  }

  const nodes = activePlaylist.list.getAll();
  const currentId = activePlaylist.list.current?.id;

  const handleSaveName = () => {
    if (editNameValue.trim()) {
      playlistManager.renamePlaylist(activePlaylist.meta.id, editNameValue.trim());
      setIsEditingName(false);
    }
  };

  const handlePlayNode = (node: MediaNode) => {
    playlistManager.selectItem(node.id, activePlaylist.meta.id);
    playbackService.play();
  };

  const handleRemoveNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playlistManager.removeItem(id, activePlaylist.meta.id);
  };

  const handleDeletePlaylist = () => {
    if (confirm(`Are you sure you want to delete "${activePlaylist.meta.name}"?`)) {
      playlistManager.deletePlaylist(activePlaylist.meta.id);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const totalDuration = nodes.reduce((acc, curr) => acc + (curr.duration || 0), 0);

  return (
    <section className="py-10 px-4 sm:px-8 max-w-7xl mx-auto">
      
      {/* Header Container */}
      <div className="card-editorial p-6 sm:p-8 bg-white mb-8">
        
        {/* Playlist Switcher Pills */}
        <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b-2 border-charcoal-light">
          <span className="text-xs font-bold text-charcoal-muted mr-1">Your Playlists:</span>
          {allPlaylists.map((p) => {
            const isSelected = p.id === activePlaylist.meta.id;
            return (
              <button
                key={p.id}
                onClick={() => playlistManager.setActivePlaylist(p.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold border-2 border-charcoal-border transition-all ${
                  isSelected
                    ? 'bg-purple text-white shadow-editorial-sm'
                    : 'bg-white text-charcoal hover:bg-cream'
                }`}
              >
                {p.name} ({p.itemCount})
              </button>
            );
          })}
          
          <button
            onClick={onOpenNewPlaylistModal}
            className="px-3 py-1.5 rounded-full text-xs font-bold bg-yellow border-2 border-charcoal-border hover:bg-yellow-hover shadow-editorial-sm transition-all"
          >
            + New
          </button>
        </div>

        {/* Playlist Details */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="pill-mint shadow-editorial-sm text-[11px]">
                <Layers className="w-3.5 h-3.5" />
                CIRCULAR LIST ORDER
              </span>
              <span className="pill-yellow text-[11px]">
                {nodes.length} Items ({formatDuration(totalDuration)})
              </span>
            </div>

            {/* Editable Title */}
            {isEditingName ? (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  className="font-orbitron text-2xl sm:text-3xl font-black text-charcoal px-3 py-1 rounded-xl border-2 border-charcoal-border bg-cream focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="btn-editorial-purple text-xs px-3 py-2"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  className="btn-editorial-white text-xs px-3 py-2"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="font-orbitron text-3xl sm:text-4xl font-extrabold text-charcoal tracking-tight">
                  {activePlaylist.meta.name}
                </h1>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1.5 rounded-lg border border-charcoal-border hover:bg-cream text-charcoal"
                  title="Rename Playlist"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}

            <p className="text-charcoal-muted font-medium text-sm">
              {activePlaylist.meta.description || 'Traverse your media smoothly without reaching the end.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                if (nodes.length > 0) {
                  playlistManager.selectItem(nodes[0].id);
                  playbackService.play();
                }
              }}
              disabled={nodes.length === 0}
              className="btn-editorial-purple text-sm"
            >
              <Play className="w-4 h-4 mr-1.5 fill-white" />
              Play From Head
            </button>

            <button
              onClick={handleDeletePlaylist}
              disabled={allPlaylists.length <= 1}
              className="btn-editorial-white text-sm text-red-700 hover:bg-red-50"
              title="Delete Playlist"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Delete Playlist
            </button>
          </div>
        </div>

      </div>

      {/* Ordered CDLL Table / Cards List */}
      <div className="card-editorial bg-white p-6 sm:p-8">
        
        <div className="flex items-center justify-between pb-4 border-b-2 border-charcoal-light mb-6">
          <h3 className="text-lg font-extrabold text-charcoal">
            Nodes in Linked Order (Head ➔ Tail ➔ Head)
          </h3>
          <div className="text-xs font-semibold text-charcoal-muted flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-purple" />
            Continuous Cycle
          </div>
        </div>

        {nodes.length === 0 ? (
          <div className="py-12 text-center text-charcoal-muted font-bold space-y-3">
            <p>This playlist is empty.</p>
            <button
              onClick={onOpenAddMediaModal}
              className="btn-editorial-purple text-xs"
            >
              + Add First Media Item
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {nodes.map((node, index) => {
              const isCurrent = node.id === currentId;
              const isHead = index === 0;
              const isTail = index === nodes.length - 1;

              return (
                <div
                  key={node.id}
                  onClick={() => handlePlayNode(node)}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 border-charcoal-border transition-all cursor-pointer flex items-center justify-between gap-4 group ${
                    isCurrent
                      ? 'bg-yellow shadow-editorial ring-2 ring-purple -translate-y-0.5'
                      : 'bg-cream hover:bg-white hover:-translate-y-0.5 shadow-editorial-sm'
                  }`}
                >
                  {/* Left: Position & Artwork */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-center text-xs font-black text-charcoal-muted">
                      {index + 1}
                    </span>

                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-charcoal-border shrink-0 bg-yellow-light">
                      {node.artwork ? (
                        <img
                          src={node.artwork}
                          alt={node.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {node.type === 'video' ? <Film className="w-5 h-5 text-charcoal" /> : <Music className="w-5 h-5 text-charcoal" />}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm sm:text-base text-charcoal truncate">
                          {node.title}
                        </h4>

                        {/* Badges */}
                        {isHead && (
                          <span className="text-[10px] font-black px-1.5 py-0.2 bg-purple text-white rounded border border-charcoal-border">
                            HEAD
                          </span>
                        )}
                        {isTail && (
                          <span className="text-[10px] font-black px-1.5 py-0.2 bg-mint text-charcoal rounded border border-charcoal-border">
                            TAIL
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] font-black px-1.5 py-0.2 bg-charcoal text-white rounded animate-pulse">
                            NOW PLAYING
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-medium text-charcoal-muted truncate">
                        {node.artist || 'Unknown'} • {node.provider === 'spotify' ? 'Spotify Track' : node.type === 'video' ? 'Video' : 'Audio'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Next pointer summary & Controls */}
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Next pointer info */}
                    <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-charcoal-muted bg-white/70 px-2.5 py-1 rounded-lg border border-charcoal-border">
                      <span className="text-purple font-bold">next:</span>
                      <span className="truncate max-w-[100px]">
                        {node.next?.title || '—'}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-charcoal-muted">
                      {formatDuration(node.duration)}
                    </span>

                    {/* Play Button Icon */}
                    <button
                      className="w-8 h-8 rounded-full bg-white border border-charcoal-border flex items-center justify-center shadow-editorial-sm group-hover:bg-yellow transition-colors"
                      title="Play Node"
                    >
                      <Play className="w-3.5 h-3.5 fill-charcoal text-charcoal ml-0.5" />
                    </button>

                    {/* Remove Action */}
                    <button
                      onClick={(e) => handleRemoveNode(node.id, e)}
                      className="p-1.5 rounded-lg border border-charcoal-border hover:bg-red-200 text-charcoal hover:text-red-900 transition-colors"
                      title="Remove Node"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Visual Indicator of Circular Wraparound */}
            <div className="pt-4 mt-6 border-t-2 border-charcoal-light flex items-center justify-center gap-2 text-xs font-extrabold text-charcoal bg-yellow-light/60 py-3 rounded-2xl border-2 border-charcoal-border shadow-editorial-sm">
              <RefreshCw className="w-4 h-4 text-purple animate-spin" style={{ animationDuration: '6s' }} />
              <span>Tail connects directly back to Head: continuous navigation without end!</span>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
