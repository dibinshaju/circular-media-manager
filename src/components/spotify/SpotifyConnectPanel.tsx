import React, { useState, useEffect } from 'react';
import { 
  Music2, CheckCircle2, LogOut, Search, Plus, ExternalLink, 
  HelpCircle, Sparkles, AlertCircle, ShieldAlert, Copy, Check, Zap, Info
} from 'lucide-react';
import { 
  subscribeSpotifyAuth, 
  SpotifyAuthStatus, 
  getSpotifyAuthStatus, 
  initiateSpotifyLogin, 
  disconnectSpotify, 
  setStoredClientId,
  getStoredClientId,
  enableDemoSpotifyMode,
  validateClientIdFormat
} from '../../integrations/spotify/spotifyAuth.js';
import { searchSpotifyTracks, DEMO_SPOTIFY_TRACKS } from '../../integrations/spotify/spotifyApi.js';
import { playlistManager } from '../../services/PlaylistManager.js';
import { MediaItem } from '../../types/media.js';

interface SpotifyConnectPanelProps {
  onClose?: () => void;
}

export const SpotifyConnectPanel: React.FC<SpotifyConnectPanelProps> = ({ onClose: _onClose }) => {
  const [authStatus, setAuthStatus] = useState<SpotifyAuthStatus>(getSpotifyAuthStatus());
  const [clientIdInput, setClientIdInput] = useState(getStoredClientId());
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [copiedUri, setCopiedUri] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>(DEMO_SPOTIFY_TRACKS);
  const [isSearching, setIsSearching] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    return subscribeSpotifyAuth((status) => {
      setAuthStatus(status);
      setClientIdInput(status.clientId);
    });
  }, []);

  const redirectUri = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

  const handleCopyUri = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopiedUri(true);
    setTimeout(() => setCopiedUri(false), 2000);
  };

  const handleConnectReal = async () => {
    setAuthError(null);
    const validation = validateClientIdFormat(clientIdInput);
    if (!validation.valid) {
      setAuthError(validation.error || 'Invalid Client ID.');
      return;
    }

    setStoredClientId(clientIdInput.trim());
    setIsAuthorizing(true);
    try {
      await initiateSpotifyLogin(redirectUri);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to initiate Spotify login.');
      setIsAuthorizing(false);
    }
  };

  const handleEnableDemo = () => {
    setAuthError(null);
    enableDemoSpotifyMode();
  };

  const handleDisconnect = () => {
    disconnectSpotify();
    setSearchResults(DEMO_SPOTIFY_TRACKS);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(DEMO_SPOTIFY_TRACKS);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchSpotifyTracks(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.warn('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddTrack = (track: MediaItem) => {
    playlistManager.addItem(track);
    setAddedIds((prev) => new Set(prev).add(track.id));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(track.id);
        return next;
      });
    }, 2000);
  };

  return (
    <div className="space-y-8">
      
      {/* Spotify Connection Header Card */}
      <div className="card-editorial p-6 sm:p-8 bg-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-mint border-2 border-charcoal-border flex items-center justify-center shadow-editorial">
              <Music2 className="w-8 h-8 text-charcoal" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="pill-mint text-[10px]">
                  SPOTIFY WEB API INTEGRATION
                </span>
                {authStatus.isConnected && (
                  <span className="pill-yellow text-[10px]">
                    {authStatus.isDemo ? 'DEMO MODE' : 'AUTHENTICATED'}
                  </span>
                )}
              </div>
              <h3 className="font-orbitron text-2xl font-black text-charcoal">
                Bring your Spotify tracks along.
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-charcoal-muted max-w-lg">
                Retrieve permitted track metadata and link Spotify content into your circular playlist.
              </p>
            </div>
          </div>

          {/* Connect / Disconnect Action */}
          <div>
            {authStatus.isConnected ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-black text-charcoal flex items-center gap-1 justify-end">
                    <span className="w-2 h-2 rounded-full bg-mint"></span>
                    {authStatus.user?.displayName || 'Spotify User'}
                  </div>
                  <div className="text-[10px] font-semibold text-charcoal-muted">
                    {authStatus.user?.email || 'Connected'}
                  </div>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="btn-editorial-white text-xs px-4 py-2 text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1" />
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleEnableDemo}
                  className="btn-editorial-yellow text-xs px-4 py-2.5 shadow-editorial"
                  title="Test Spotify features instantly without creating a developer app"
                >
                  <Zap className="w-3.5 h-3.5 mr-1 text-charcoal" />
                  Try Demo Mode
                </button>
              </div>
            )}
          </div>
        </div>

        {/* If Disconnected: Guide on Demo Mode vs Real Spotify Developer App */}
        {!authStatus.isConnected && (
          <div className="mt-6 pt-6 border-t-2 border-charcoal-light space-y-4">
            
            {/* Why does Spotify say "Client ID is invalid"? Alert Box */}
            <div className="p-4 rounded-2xl bg-yellow-light border-2 border-charcoal-border shadow-editorial-sm">
              <h4 className="text-xs font-extrabold uppercase text-charcoal mb-1 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-purple" />
                Why does Spotify show &quot;Invalid Client ID&quot;?
              </h4>
              <p className="text-xs font-medium text-charcoal leading-relaxed">
                Spotify&apos;s authorization server requires a <strong>32-character hexadecimal Client ID</strong> registered in the official <strong>Spotify Developer Dashboard</strong> with this exact Redirect URI. If you don&apos;t have one yet, simply click <strong>&quot;Try Demo Mode&quot;</strong> above to explore immediately!
              </p>
            </div>

            {/* Option 2: Real Developer App Setup */}
            <div className="bg-cream p-4 sm:p-5 rounded-2xl border-2 border-charcoal-border space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-charcoal flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-purple" />
                Using Your Own Spotify Developer App (Authorization Code with PKCE)
              </h4>
              
              <ol className="text-xs font-semibold text-charcoal-muted list-decimal list-inside space-y-1">
                <li>Log in to <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-purple underline font-bold">developer.spotify.com/dashboard</a> and click <strong>Create App</strong>.</li>
                <li>In App Settings, set <strong>Redirect URI</strong> to:</li>
              </ol>

              {/* Redirect URI copy box */}
              <div className="flex items-center gap-2 max-w-md">
                <code className="flex-1 bg-white px-3 py-2 rounded-xl border-2 border-charcoal-border font-mono font-bold text-xs text-charcoal truncate">
                  {redirectUri}
                </code>
                <button
                  onClick={handleCopyUri}
                  className="btn-editorial-white text-xs px-3 py-2 shrink-0"
                >
                  {copiedUri ? <Check className="w-3.5 h-3.5 text-mint-dark" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedUri ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-charcoal uppercase mb-1">
                  Enter 32-Character Client ID:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    placeholder="e.g. 4a7b9c1234567890abcdef1234567890"
                    className="flex-1 px-3.5 py-2 rounded-xl border-2 border-charcoal-border bg-white text-xs font-mono font-bold text-charcoal focus:outline-none"
                  />
                  <button
                    onClick={handleConnectReal}
                    disabled={isAuthorizing}
                    className="btn-editorial-purple text-xs px-5 py-2 shrink-0"
                  >
                    <Music2 className="w-3.5 h-3.5 mr-1" />
                    {isAuthorizing ? 'Authorizing...' : 'Connect to Spotify'}
                  </button>
                </div>

                {authError && (
                  <div className="mt-2 text-xs font-bold text-red-700 bg-red-100 p-2.5 rounded-xl border border-red-400">
                    ⚠️ {authError}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Compliance & Playback Disclaimers */}
        <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-charcoal-muted">
          <ShieldAlert className="w-3.5 h-3.5 text-purple shrink-0" />
          <span>
            Spotify tracks in Loopify are stored as reference metadata. Protected audio is opened directly in Spotify or played via Spotify Web previews.
          </span>
        </div>
      </div>

      {/* Track Discovery & Search Panel */}
      <div className="card-editorial p-6 sm:p-8 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-extrabold text-charcoal">
                Spotify Track Discovery & References
              </h3>
              {authStatus.isDemo && (
                <span className="pill-yellow text-[10px]">
                  DEMO CATALOG READY
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-charcoal-muted">
              {authStatus.isConnected && !authStatus.isDemo
                ? 'Searching live official Spotify Web API tracks.' 
                : 'Browse and add Spotify track references directly to your Circular Doubly Linked List.'}
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tracks or artists..."
              className="flex-1 px-3.5 py-2 rounded-xl border-2 border-charcoal-border bg-cream text-xs font-bold text-charcoal focus:outline-none"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="btn-editorial-yellow text-xs px-3.5 py-2"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Discovery Tracks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {searchResults.map((track) => {
            const isAdded = addedIds.has(track.id);

            return (
              <div
                key={track.id}
                className="p-4 rounded-2xl border-2 border-charcoal-border bg-cream hover:bg-white transition-all shadow-editorial-sm flex flex-col justify-between"
              >
                <div className="flex gap-3 items-center mb-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-charcoal-border shrink-0 bg-yellow-light">
                    {track.artwork && (
                      <img
                        src={track.artwork}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-sm text-charcoal truncate" title={track.title}>
                      {track.title}
                    </h4>
                    <p className="text-xs font-semibold text-charcoal-muted truncate">
                      {track.artist}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-charcoal-border/30">
                  <a
                    href={track.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-charcoal hover:text-purple"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open in Spotify
                  </a>

                  <button
                    onClick={() => handleAddTrack(track)}
                    className={`inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-full border border-charcoal-border transition-all ${
                      isAdded
                        ? 'bg-mint text-charcoal'
                        : 'bg-yellow text-charcoal shadow-editorial-sm hover:-translate-y-0.5'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Added!
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        Add to List
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
