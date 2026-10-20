import React, { useState, useEffect } from 'react';
import { Disc3, Plus, Music2, CheckCircle2, AlertCircle, Menu, X, Settings as SettingsIcon } from 'lucide-react';
import { subscribeSpotifyAuth, SpotifyAuthStatus, getSpotifyAuthStatus } from '../../integrations/spotify/spotifyAuth.js';
import { playlistManager } from '../../services/PlaylistManager.js';

interface AppHeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNewPlaylistModal: () => void;
  onOpenSpotifyModal: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewPlaylistModal,
  onOpenSpotifyModal,
}) => {
  const [spotifyStatus, setSpotifyStatus] = useState<SpotifyAuthStatus>(getSpotifyAuthStatus());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    return subscribeSpotifyAuth((status) => {
      setSpotifyStatus(status);
    });
  }, []);

  const navItems = [
    { id: 'discover', label: 'Discover' },
    { id: 'library', label: 'My Library' },
    { id: 'playlist', label: 'Playlists' },
    { id: 'visualizer', label: 'How It Works' },
    { id: 'settings', label: 'Docs & Settings' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-sm border-b-2 border-charcoal-border px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Left: Original Loopify Logo */}
        <div 
          onClick={() => onSelectTab('discover')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-yellow border-2 border-charcoal-border flex items-center justify-center shadow-editorial-sm group-hover:-translate-y-0.5 transition-transform">
            <Disc3 className="w-6 h-6 text-charcoal animate-[spin_8s_linear_infinite]" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-2xl tracking-wide text-charcoal flex items-center gap-1">
              Loopify
              <span className="w-2 h-2 rounded-full bg-purple"></span>
            </span>
          </div>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-charcoal text-white shadow-editorial-sm'
                    : 'text-charcoal hover:bg-white/60 hover:text-charcoal'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Spotify Status & New Playlist CTA */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Spotify Connection Pill */}
          <button
            onClick={onOpenSpotifyModal}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-charcoal-border transition-all shadow-editorial-sm hover:-translate-y-0.5 ${
              spotifyStatus.isConnected
                ? 'bg-mint text-charcoal'
                : 'bg-white text-charcoal hover:bg-yellow-light'
            }`}
          >
            {spotifyStatus.isConnected ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-charcoal" />
                <span>Spotify Connected</span>
              </>
            ) : (
              <>
                <Music2 className="w-3.5 h-3.5 text-purple" />
                <span>Connect Spotify</span>
              </>
            )}
          </button>

          {/* Primary Action Button */}
          <button
            onClick={onOpenNewPlaylistModal}
            className="btn-editorial-purple text-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Playlist
          </button>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-white border-2 border-charcoal-border shadow-editorial-sm"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden pt-4 pb-2 border-t-2 border-charcoal-border mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`px-3 py-2 text-center rounded-xl text-sm font-bold border border-charcoal-border ${
                  currentTab === item.id
                    ? 'bg-charcoal text-white'
                    : 'bg-white text-charcoal'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => {
                onOpenSpotifyModal();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 bg-yellow text-charcoal font-bold text-xs rounded-xl border border-charcoal-border shadow-editorial-sm"
            >
              {spotifyStatus.isConnected ? '✓ Spotify Connected' : 'Connect Spotify'}
            </button>
            <button
              onClick={() => {
                onOpenNewPlaylistModal();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 bg-purple text-white font-bold text-sm rounded-xl border-2 border-charcoal-border shadow-editorial-sm"
            >
              + New Playlist
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
