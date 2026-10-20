import { generateRandomString, generateCodeChallenge } from './pkce.js';

const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SCOPES = [
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
].join(' ');

const STORAGE_KEYS = {
  CLIENT_ID: 'loopify_spotify_client_id',
  VERIFIER: 'loopify_spotify_code_verifier',
  STATE: 'loopify_spotify_auth_state',
  ACCESS_TOKEN: 'loopify_spotify_access_token',
  REFRESH_TOKEN: 'loopify_spotify_refresh_token',
  EXPIRES_AT: 'loopify_spotify_token_expires_at',
  USER_PROFILE: 'loopify_spotify_user_profile',
  IS_DEMO: 'loopify_spotify_is_demo',
};

export interface SpotifyAuthStatus {
  isConnected: boolean;
  isDemo: boolean;
  clientId: string;
  user: {
    displayName?: string;
    email?: string;
    id?: string;
    avatarUrl?: string;
    isDemo?: boolean;
  } | null;
  error?: string;
}

type AuthListener = (status: SpotifyAuthStatus) => void;
const listeners = new Set<AuthListener>();

export function subscribeSpotifyAuth(listener: AuthListener): () => void {
  listeners.add(listener);
  listener(getSpotifyAuthStatus());
  return () => listeners.delete(listener);
}

function notifyListeners() {
  const status = getSpotifyAuthStatus();
  listeners.forEach((l) => l(status));
}

export function getStoredClientId(): string {
  return localStorage.getItem(STORAGE_KEYS.CLIENT_ID) || '';
}

export function setStoredClientId(clientId: string): void {
  localStorage.setItem(STORAGE_KEYS.CLIENT_ID, clientId.trim());
  notifyListeners();
}

export function validateClientIdFormat(clientId: string): { valid: boolean; error?: string } {
  const trimmed = clientId.trim();
  if (!trimmed) {
    return { valid: false, error: 'Client ID is empty. Please enter your 32-character Spotify Client ID or use Demo Mode.' };
  }
  // Spotify client IDs are 32 hex/alphanumeric characters
  if (trimmed.length < 28 || trimmed.length > 36) {
    return { 
      valid: false, 
      error: `Invalid Client ID length (${trimmed.length} characters). Spotify Client IDs are 32-character hexadecimal strings from developer.spotify.com.` 
    };
  }
  return { valid: true };
}

export function getAccessToken(): string | null {
  const isDemo = sessionStorage.getItem(STORAGE_KEYS.IS_DEMO) === 'true';
  if (isDemo) {
    return 'demo-spotify-access-token';
  }

  const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const expiresAt = Number(sessionStorage.getItem(STORAGE_KEYS.EXPIRES_AT) || '0');
  if (token && Date.now() < expiresAt) {
    return token;
  }
  return null;
}

export function isSpotifyAuthenticated(): boolean {
  return getAccessToken() !== null;
}

export function getSpotifyAuthStatus(): SpotifyAuthStatus {
  const token = getAccessToken();
  const clientId = getStoredClientId();
  const isDemo = sessionStorage.getItem(STORAGE_KEYS.IS_DEMO) === 'true';
  const profileRaw = sessionStorage.getItem(STORAGE_KEYS.USER_PROFILE);
  const user = profileRaw ? JSON.parse(profileRaw) : null;

  return {
    isConnected: !!token,
    isDemo,
    clientId,
    user,
  };
}

/**
 * Enable instant one-click Demo / Simulator Mode
 * Allows exploring Spotify track discovery, adding references, and testing
 * without requiring the user to create a Spotify Developer app.
 */
export function enableDemoSpotifyMode(): void {
  sessionStorage.setItem(STORAGE_KEYS.IS_DEMO, 'true');
  const demoProfile = {
    displayName: 'Spotify Student (Demo Mode)',
    email: 'demo-student@spotify.com',
    id: 'demo-spotify-user',
    isDemo: true,
  };
  sessionStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(demoProfile));
  notifyListeners();
}

export async function initiateSpotifyLogin(redirectUri: string): Promise<void> {
  const clientId = getStoredClientId();
  const validation = validateClientIdFormat(clientId);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Clear demo mode if initiating real OAuth
  sessionStorage.removeItem(STORAGE_KEYS.IS_DEMO);

  const verifier = generateRandomString(64);
  const challenge = await generateCodeChallenge(verifier);
  const state = generateRandomString(16);

  sessionStorage.setItem(STORAGE_KEYS.VERIFIER, verifier);
  sessionStorage.setItem(STORAGE_KEYS.STATE, state);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    state,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  });

  window.location.href = `${SPOTIFY_AUTH_ENDPOINT}?${params.toString()}`;
}

export async function handleSpotifyCallback(redirectUri: string): Promise<{ success: boolean; error?: string }> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const error = params.get('error');
  const state = params.get('state');

  if (error) {
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
    notifyListeners();
    return { success: false, error: `Spotify Authorization was denied: ${error}` };
  }

  if (!code) {
    return { success: false };
  }

  const savedState = sessionStorage.getItem(STORAGE_KEYS.STATE);
  const verifier = sessionStorage.getItem(STORAGE_KEYS.VERIFIER);
  const clientId = getStoredClientId();

  if (!verifier || state !== savedState || !clientId) {
    window.history.replaceState({}, document.title, window.location.pathname);
    return { success: false, error: 'Authentication state mismatch or missing verifier. Please try again.' };
  }

  try {
    const body = new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    });

    const response = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error_description || `Token exchange failed with status ${response.status}`);
    }

    const data = await response.json();
    const expiresAt = Date.now() + (data.expires_in - 60) * 1000;

    sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
    sessionStorage.setItem(STORAGE_KEYS.EXPIRES_AT, String(expiresAt));
    if (data.refresh_token) {
      sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
    }

    // Clean up temporary verifier/state
    sessionStorage.removeItem(STORAGE_KEYS.VERIFIER);
    sessionStorage.removeItem(STORAGE_KEYS.STATE);

    // Fetch user profile
    await fetchUserProfile(data.access_token);

    // Clean URL query params
    window.history.replaceState({}, document.title, window.location.pathname);
    notifyListeners();
    return { success: true };
  } catch (err: any) {
    window.history.replaceState({}, document.title, window.location.pathname);
    notifyListeners();
    return { success: false, error: err.message || 'Failed to exchange authorization code for token.' };
  }
}

async function fetchUserProfile(token: string): Promise<void> {
  try {
    const res = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      const profile = {
        displayName: data.display_name,
        email: data.email,
        id: data.id,
        avatarUrl: data.images?.[0]?.url,
      };
      sessionStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    }
  } catch {
    // Non-fatal if user profile fails
  }
}

export function disconnectSpotify(): void {
  sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
  sessionStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  sessionStorage.removeItem(STORAGE_KEYS.VERIFIER);
  sessionStorage.removeItem(STORAGE_KEYS.STATE);
  sessionStorage.removeItem(STORAGE_KEYS.IS_DEMO);
  notifyListeners();
}
