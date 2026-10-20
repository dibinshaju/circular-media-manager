import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import App from '../src/App.js';
import { playlistManager, SEED_MEDIA_ITEMS } from '../src/services/PlaylistManager.js';

describe('Loopify UI & Integration Tests', () => {
  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    await playlistManager.init();
  });

  it('renders Loopify brand, editorial headline, and Curio-inspired elements', () => {
    render(<App />);

    // Brand and headline
    expect(screen.getAllByText(/Loopify/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Your music./i)).toBeInTheDocument();
    expect(screen.getByText(/Your videos./i)).toBeInTheDocument();
    expect(screen.getByText(/One endless loop./i)).toBeInTheDocument();

    // Curio pills
    expect(screen.getByText(/YOUR MEDIA, CONNECTED/i)).toBeInTheDocument();
    expect(screen.getByText(/LIVE PLAYER/i)).toBeInTheDocument();

    // Data structure subtitle note
    expect(
      screen.getByText(/Powered by a circular linked list. Designed for continuous discovery./i)
    ).toBeInTheDocument();
  });

  it('navigates through circular playlist using Next button in player card', () => {
    render(<App />);

    const active = playlistManager.getActivePlaylist();
    expect(active).not.toBeNull();
    const initialTitle = active?.list.current?.title;

    // Click Next button
    const nextButtons = screen.getAllByTitle(/Next track/i);
    expect(nextButtons.length).toBeGreaterThan(0);
    fireEvent.click(nextButtons[0]);

    // Current title should have updated to successor node
    const newActive = playlistManager.getActivePlaylist();
    expect(newActive?.list.current?.title).not.toBe(initialTitle);
  });

  it('switches between tabs cleanly (Library, Playlists, How It Works, Docs)', () => {
    render(<App />);

    // Switch to Playlists tab
    const playlistsTab = screen.getByRole('button', { name: /^Playlists$/i });
    fireEvent.click(playlistsTab);
    expect(screen.getByText(/Nodes in Linked Order/i)).toBeInTheDocument();

    // Switch to Docs tab
    const docsTab = screen.getByRole('button', { name: /Docs & Settings/i });
    fireEvent.click(docsTab);
    expect(screen.getByText(/Algorithmic Time & Space Complexity/i)).toBeInTheDocument();
  });

  it('includes Malayalam tracks in the starter playlist', () => {
    const titles = SEED_MEDIA_ITEMS.map((item) => item.title);

    expect(titles).toEqual(
      expect.arrayContaining(['Aaromale', 'Mizhiyoram', 'Nila'])
    );
  });

  it('renders the interactive CDLL Visualizer with circular invariants intact', () => {
    render(<App />);

    expect(screen.getByText(/Never hit the end of the playlist./i)).toBeInTheDocument();
    expect(screen.getByText(/Invariants Intact/i)).toBeInTheDocument();
    expect(screen.getByText(/TAIL.next ➔ HEAD/i)).toBeInTheDocument();
  });
});
