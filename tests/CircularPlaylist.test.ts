import { describe, it, expect, beforeEach } from 'vitest';
import { CircularPlaylist } from '../src/data-structures/CircularPlaylist.js';
import { MediaItem } from '../src/types/media.js';

const mockAudio = (id: string, title: string, artist = 'Artist'): MediaItem => ({
  id,
  title,
  artist,
  type: 'audio',
  source: `blob:mock-audio-${id}`,
  provider: 'local',
  duration: 180,
});

describe('CircularPlaylist (Circular Doubly Linked List)', () => {
  let playlist: CircularPlaylist;

  beforeEach(() => {
    playlist = new CircularPlaylist();
  });

  // PRD Test 1: Empty playlist returns no current item
  it('1. Empty playlist returns no current item and count is 0', () => {
    expect(playlist.head).toBeNull();
    expect(playlist.current).toBeNull();
    expect(playlist.count).toBe(0);
    expect(playlist.tail).toBeNull();
    expect(playlist.isEmpty).toBe(true);
    expect(playlist.next()).toBeNull();
    expect(playlist.previous()).toBeNull();
    expect(playlist.getAll()).toEqual([]);

    const integrity = playlist.validateIntegrity();
    expect(integrity.isValid).toBe(true);
    expect(integrity.errors).toHaveLength(0);
  });

  // PRD Test 2: Adding one node makes its next and previous references point to itself
  it('2. Adding one node makes its next and previous references point to itself', () => {
    const item = mockAudio('t1', 'Track 1');
    const node = playlist.add(item);

    expect(playlist.count).toBe(1);
    expect(playlist.head).toBe(node);
    expect(playlist.current).toBe(node);
    expect(playlist.tail).toBe(node);

    // Self-pointing circular invariant for 1 node
    expect(node.next).toBe(node);
    expect(node.prev).toBe(node);
    expect(playlist.head?.prev).toBe(playlist.head);
    expect(playlist.head?.next).toBe(playlist.head);

    const integrity = playlist.validateIntegrity();
    expect(integrity.isValid).toBe(true);
  });

  // PRD Test 3: Adding multiple nodes preserves circularity
  it('3. Adding multiple nodes preserves circularity and bidirectional links', () => {
    const n1 = playlist.add(mockAudio('t1', 'Track 1'));
    const n2 = playlist.add(mockAudio('t2', 'Track 2'));
    const n3 = playlist.add(mockAudio('t3', 'Track 3'));

    expect(playlist.count).toBe(3);
    expect(playlist.head).toBe(n1);
    expect(playlist.tail).toBe(n3);

    // Forward chain
    expect(n1.next).toBe(n2);
    expect(n2.next).toBe(n3);
    expect(n3.next).toBe(n1); // Circular link back to head

    // Reverse chain
    expect(n1.prev).toBe(n3); // Tail points back to head
    expect(n2.prev).toBe(n1);
    expect(n3.prev).toBe(n2);

    // Bidirectional invariant for each node: node.next.prev === node && node.prev.next === node
    [n1, n2, n3].forEach((node) => {
      expect(node.next?.prev).toBe(node);
      expect(node.prev?.next).toBe(node);
    });

    const integrity = playlist.validateIntegrity();
    expect(integrity.isValid).toBe(true);
    expect(integrity.errors).toEqual([]);
  });

  // PRD Test 4: Next from the tail returns the head
  it('4. Next from the tail returns the head', () => {
    playlist.add(mockAudio('t1', 'Track 1'));
    playlist.add(mockAudio('t2', 'Track 2'));
    playlist.add(mockAudio('t3', 'Track 3'));

    // Move to tail
    playlist.select('t3');
    expect(playlist.current?.id).toBe('t3');

    // Calling next() on tail must wrap around to head
    const nextItem = playlist.next();
    expect(nextItem?.id).toBe('t1');
    expect(playlist.current?.id).toBe('t1');
  });

  // PRD Test 5: Previous from the head returns the tail
  it('5. Previous from the head returns the tail', () => {
    playlist.add(mockAudio('t1', 'Track 1'));
    playlist.add(mockAudio('t2', 'Track 2'));
    playlist.add(mockAudio('t3', 'Track 3'));

    // current is currently head ('t1')
    expect(playlist.current?.id).toBe('t1');

    // Calling previous() on head must wrap around to tail
    const prevItem = playlist.previous();
    expect(prevItem?.id).toBe('t3');
    expect(playlist.current?.id).toBe('t3');
  });

  // PRD Test 6: Removing the only node empties the playlist
  it('6. Removing the only node empties the playlist', () => {
    playlist.add(mockAudio('t1', 'Track 1'));
    expect(playlist.count).toBe(1);

    const removed = playlist.remove('t1');
    expect(removed).toBe(true);
    expect(playlist.count).toBe(0);
    expect(playlist.head).toBeNull();
    expect(playlist.current).toBeNull();
    expect(playlist.tail).toBeNull();

    const integrity = playlist.validateIntegrity();
    expect(integrity.isValid).toBe(true);
  });

  // PRD Test 7: Removing the head correctly updates the head reference
  it('7. Removing the head correctly updates the head reference', () => {
    playlist.add(mockAudio('t1', 'Track 1'));
    playlist.add(mockAudio('t2', 'Track 2'));
    playlist.add(mockAudio('t3', 'Track 3'));

    const removed = playlist.remove('t1');
    expect(removed).toBe(true);
    expect(playlist.count).toBe(2);
    expect(playlist.head?.id).toBe('t2');
    expect(playlist.tail?.id).toBe('t3');

    // Circularity preserved
    expect(playlist.head?.prev?.id).toBe('t3');
    expect(playlist.tail?.next?.id).toBe('t2');

    const integrity = playlist.validateIntegrity();
    expect(integrity.isValid).toBe(true);
  });

  // PRD Test 8: Removing the tail preserves the circular links
  it('8. Removing the tail preserves the circular links', () => {
    playlist.add(mockAudio('t1', 'Track 1'));
    playlist.add(mockAudio('t2', 'Track 2'));
    playlist.add(mockAudio('t3', 'Track 3'));

    const removed = playlist.remove('t3');
    expect(removed).toBe(true);
    expect(playlist.count).toBe(2);
    expect(playlist.head?.id).toBe('t1');
    expect(playlist.tail?.id).toBe('t2');

    // Circularity preserved
    expect(playlist.tail?.next?.id).toBe('t1');
    expect(playlist.head?.prev?.id).toBe('t2');

    const integrity = playlist.validateIntegrity();
    expect(integrity.isValid).toBe(true);
  });

  // PRD Test 9: Removing the current item selects a valid remaining item
  it('9. Removing the current item selects a valid remaining item', () => {
    playlist.add(mockAudio('t1', 'Track 1'));
    playlist.add(mockAudio('t2', 'Track 2'));
    playlist.add(mockAudio('t3', 'Track 3'));

    playlist.select('t2');
    expect(playlist.current?.id).toBe('t2');

    playlist.remove('t2');
    expect(playlist.count).toBe(2);
    // current moves to successor ('t3')
    expect(playlist.current?.id).toBe('t3');

    const integrity = playlist.validateIntegrity();
    expect(integrity.isValid).toBe(true);
  });

  // PRD Test 10: Removing a nonexistent ID leaves the playlist unchanged
  it('10. Removing a nonexistent ID leaves the playlist unchanged', () => {
    playlist.add(mockAudio('t1', 'Track 1'));
    playlist.add(mockAudio('t2', 'Track 2'));

    const removed = playlist.remove('nonexistent');
    expect(removed).toBe(false);
    expect(playlist.count).toBe(2);
    expect(playlist.head?.id).toBe('t1');
    expect(playlist.current?.id).toBe('t1');

    const integrity = playlist.validateIntegrity();
    expect(integrity.isValid).toBe(true);
  });

  // PRD Test 11: Search does not mutate playlist order or current selection
  it('11. Search does not mutate playlist order or current selection', () => {
    playlist.add(mockAudio('t1', 'Bohemian Rhapsody', 'Queen'));
    playlist.add(mockAudio('t2', 'Hotel California', 'Eagles'));
    playlist.add(mockAudio('t3', 'Under Pressure', 'Queen & David Bowie'));

    playlist.select('t2');
    expect(playlist.current?.id).toBe('t2');

    const searchResults = playlist.search('Queen');
    expect(searchResults).toHaveLength(2);
    expect(searchResults[0].id).toBe('t1');
    expect(searchResults[1].id).toBe('t3');

    // Current selection remains untouched
    expect(playlist.current?.id).toBe('t2');

    // Order snapshot remains untouched
    const all = playlist.getAll();
    expect(all.map((n) => n.id)).toEqual(['t1', 't2', 't3']);
  });

  // PRD Test 12: validateIntegrity detects deliberately broken links in test fixtures
  it('12. validateIntegrity detects deliberately broken links in test fixtures', () => {
    const n1 = playlist.add(mockAudio('t1', 'Track 1'));
    const n2 = playlist.add(mockAudio('t2', 'Track 2'));
    playlist.add(mockAudio('t3', 'Track 3'));

    expect(playlist.validateIntegrity().isValid).toBe(true);

    // Deliberately corrupt n1.next pointer to null
    n1.next = null;
    const brokenReport1 = playlist.validateIntegrity();
    expect(brokenReport1.isValid).toBe(false);
    expect(brokenReport1.errors.some((e) => e.includes('null next reference'))).toBe(true);

    // Restore and deliberately corrupt backward link
    n1.next = n2;
    n2.prev = null;
    const brokenReport2 = playlist.validateIntegrity();
    expect(brokenReport2.isValid).toBe(false);
    expect(brokenReport2.errors.some((e) => e.includes('Reverse link broken') || e.includes('null prev'))).toBe(true);
  });

  // Additional Test 13: insertAfter & insertAfterNode
  it('13. insertAfter inserts correctly between nodes in O(1)', () => {
    playlist.add(mockAudio('t1', 'Track 1'));
    playlist.add(mockAudio('t3', 'Track 3'));

    const inserted = playlist.insertAfter('t1', mockAudio('t2', 'Track 2'));
    expect(inserted).not.toBeNull();
    expect(playlist.count).toBe(3);

    const orderedIds = playlist.getAll().map((n) => n.id);
    expect(orderedIds).toEqual(['t1', 't2', 't3']);

    const integrity = playlist.validateIntegrity();
    expect(integrity.isValid).toBe(true);
  });

  // Additional Test 14: Continuous wrap-around traversal
  it('14. Continuous wrap-around traversal forwards and backwards', () => {
    playlist.add(mockAudio('t1', 'Track 1'));
    playlist.add(mockAudio('t2', 'Track 2'));
    playlist.add(mockAudio('t3', 'Track 3'));

    const forwardVisited: string[] = [];
    for (let i = 0; i < 9; i++) {
      forwardVisited.push(playlist.current!.id);
      playlist.next();
    }
    expect(forwardVisited).toEqual(['t1', 't2', 't3', 't1', 't2', 't3', 't1', 't2', 't3']);

    const backwardVisited: string[] = [];
    for (let i = 0; i < 6; i++) {
      backwardVisited.push(playlist.current!.id);
      playlist.previous();
    }
    expect(backwardVisited).toEqual(['t1', 't3', 't2', 't1', 't3', 't2']);
  });

  // Additional Test 15: clear() resets all structures
  it('15. clear() removes every item and restores empty state', () => {
    playlist.add(mockAudio('t1', 'Track 1'));
    playlist.add(mockAudio('t2', 'Track 2'));
    playlist.clear();

    expect(playlist.count).toBe(0);
    expect(playlist.head).toBeNull();
    expect(playlist.current).toBeNull();
    expect(playlist.tail).toBeNull();
    expect(playlist.getAll()).toEqual([]);
    expect(playlist.validateIntegrity().isValid).toBe(true);
  });
});
