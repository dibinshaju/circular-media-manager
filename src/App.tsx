import React, { useState, useEffect } from 'react';
import { AppHeader } from './components/layout/AppHeader.js';
import { HeroSection } from './components/hero/HeroSection.js';
import { CircularListVisualizer } from './components/visualizer/CircularListVisualizer.js';
import { MediaLibraryView } from './components/library/MediaLibraryView.js';
import { PlaylistDetailView } from './components/playlist/PlaylistDetailView.js';
import { SettingsAndDocsView } from './components/settings/SettingsAndDocsView.js';
import { DockedPlayerBar } from './components/player/DockedPlayerBar.js';
import { VideoPlayerModal } from './components/player/VideoPlayerModal.js';
import { NewPlaylistModal } from './components/playlist/NewPlaylistModal.js';
import { SpotifyModal } from './components/spotify/SpotifyModal.js';
import { AppFooter } from './components/layout/AppFooter.js';
import { handleSpotifyCallback } from './integrations/spotify/spotifyAuth.js';
import { playbackService, PlaybackState } from './services/PlaybackService.js';
import { playlistManager } from './services/PlaylistManager.js';

export function App() {
  const [currentTab, setCurrentTab] = useState<'discover' | 'library' | 'playlist' | 'visualizer' | 'settings'>('discover');
  const [isNewPlaylistOpen, setIsNewPlaylistOpen] = useState(false);
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState>(playbackService.getState());
  const [callbackMessage, setCallbackMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check if returning from Spotify OAuth with a code or error
    if (window.location.search.includes('code=') || window.location.search.includes('error=')) {
      handleSpotifyCallback(window.location.origin).then((res) => {
        if (res.success) {
          setCallbackMessage('Spotify successfully connected via PKCE!');
          setTimeout(() => setCallbackMessage(null), 5000);
        } else if (res.error) {
          setCallbackMessage(`⚠️ ${res.error}`);
          setTimeout(() => setCallbackMessage(null), 7000);
        }
      });
    }

    return playbackService.subscribe(setPlaybackState);
  }, []);

  return (
    <div className="min-h-screen bg-cream flex flex-col font-sans selection:bg-yellow selection:text-charcoal relative">
      
      {/* Toast Notification Banner for Spotify Auth */}
      {callbackMessage && (
        <div className="bg-yellow border-b-2 border-charcoal-border py-2.5 px-4 text-center font-extrabold text-sm text-charcoal shadow-editorial-sm animate-in fade-in duration-200">
          {callbackMessage}
        </div>
      )}

      {/* Header */}
      <AppHeader
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab as any)}
        onOpenNewPlaylistModal={() => setIsNewPlaylistOpen(true)}
        onOpenSpotifyModal={() => setIsSpotifyModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'discover' && (
          <div>
            <HeroSection
              onBuildPlaylist={() => setCurrentTab('playlist')}
              onExplorePlayer={() => setCurrentTab('visualizer')}
              onSelectTab={(tab) => setCurrentTab(tab as any)}
            />
            <CircularListVisualizer />
            <MediaLibraryView
              onOpenSpotifyModal={() => setIsSpotifyModalOpen(true)}
              onOpenNewPlaylistModal={() => setIsNewPlaylistOpen(true)}
            />
          </div>
        )}

        {currentTab === 'library' && (
          <MediaLibraryView
            onOpenSpotifyModal={() => setIsSpotifyModalOpen(true)}
            onOpenNewPlaylistModal={() => setIsNewPlaylistOpen(true)}
          />
        )}

        {currentTab === 'playlist' && (
          <PlaylistDetailView
            onOpenNewPlaylistModal={() => setIsNewPlaylistOpen(true)}
            onOpenAddMediaModal={() => setCurrentTab('library')}
          />
        )}

        {currentTab === 'visualizer' && (
          <div>
            <CircularListVisualizer />
            <SettingsAndDocsView />
          </div>
        )}

        {currentTab === 'settings' && (
          <SettingsAndDocsView />
        )}
      </main>

      {/* Persistent Docked Player Bar */}
      <DockedPlayerBar />

      {/* Synchronized Local HTML5 Video Player Modal */}
      <VideoPlayerModal
        isOpen={playbackState.isVideoModalOpen}
        onClose={() => playbackService.setVideoModalOpen(false)}
      />

      {/* New Playlist Modal */}
      <NewPlaylistModal
        isOpen={isNewPlaylistOpen}
        onClose={() => setIsNewPlaylistOpen(false)}
        onCreated={(id) => {
          playlistManager.setActivePlaylist(id);
          setCurrentTab('playlist');
        }}
      />

      {/* Spotify Modal */}
      <SpotifyModal
        isOpen={isSpotifyModalOpen}
        onClose={() => setIsSpotifyModalOpen(false)}
      />

      {/* Footer */}
      <AppFooter />
    </div>
  );
}

export default App;
