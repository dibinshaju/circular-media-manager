import React, { useState } from 'react';
import { X, Plus, Disc3 } from 'lucide-react';
import { playlistManager } from '../../services/PlaylistManager.js';

interface NewPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}

export const NewPlaylistModal: React.FC<NewPlaylistModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const id = playlistManager.createPlaylist(name.trim(), description.trim());
    setName('');
    setDescription('');
    onCreated?.(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="card-editorial bg-white max-w-md w-full overflow-hidden p-6 sm:p-7 relative shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-charcoal-light mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow border-2 border-charcoal-border flex items-center justify-center text-charcoal shadow-editorial-sm">
              <Plus className="w-5 h-5 text-charcoal" />
            </div>
            <div>
              <h3 className="font-extrabold text-charcoal text-lg">
                Create New Playlist
              </h3>
              <p className="text-xs font-semibold text-charcoal-muted">
                Initializes a new Circular Doubly Linked List
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-charcoal-border hover:bg-cream text-charcoal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-charcoal uppercase mb-1">
              Playlist Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Midnight Beats, Work Flow..."
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-charcoal-border bg-cream font-bold text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-purple/40"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-charcoal uppercase mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What makes this circular playlist special?"
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-charcoal-border bg-cream font-medium text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-purple/40 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-charcoal-light">
            <button
              type="button"
              onClick={onClose}
              className="btn-editorial-white text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="btn-editorial-purple text-xs px-5 py-2"
            >
              Create Circular List
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
