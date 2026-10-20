import { MediaItem } from '../types/media.js';
import { MediaNode } from './MediaNode.js';

export interface IntegrityReport {
  isValid: boolean;
  errors: string[];
  nodeCount: number;
  expectedCount: number;
}

/**
 * CircularPlaylist implements an authoritative Circular Doubly Linked List (CDLL)
 * for managing music and video playlist ordering and continuous navigation.
 * 
 * Strict Invariants:
 * - Empty list: head === null, current === null, count === 0.
 * - Nonempty list:
 *     - head.prev === tail
 *     - tail.next === head
 *     - For every node: node.next.prev === node && node.prev.next === node
 *     - Traversing exactly count nodes from head returns to head
 *     - current is null only when count === 0
 * 
 * Complexity:
 * - Next: O(1)
 * - Previous: O(1)
 * - Append: O(1)
 * - Insert after node: O(1)
 * - Insert after ID: O(n)
 * - Remove by ID: O(n)
 * - Search by query: O(n)
 * - Display all items: O(n)
 * - Storage: O(n)
 */
export class CircularPlaylist {
  public head: MediaNode | null = null;
  public current: MediaNode | null = null;
  private _count: number = 0;

  public get count(): number {
    return this._count;
  }

  public get tail(): MediaNode | null {
    return this.head ? this.head.prev : null;
  }

  public get isEmpty(): boolean {
    return this._count === 0;
  }

  /**
   * Append a new media item to the end of the circular playlist (O(1)).
   */
  public add(media: MediaItem): MediaNode {
    const newNode = new MediaNode(media);

    if (this._count === 0 || !this.head) {
      this.head = newNode;
      this.current = newNode;
      newNode.next = newNode;
      newNode.prev = newNode;
    } else {
      const tail = this.head.prev!;
      tail.next = newNode;
      newNode.prev = tail;
      newNode.next = this.head;
      this.head.prev = newNode;
    }

    this._count++;
    return newNode;
  }

  /**
   * Insert after a known node reference in O(1) time.
   */
  public insertAfterNode(targetNode: MediaNode, media: MediaItem): MediaNode {
    const newNode = new MediaNode(media);
    const nextNode = targetNode.next!;

    targetNode.next = newNode;
    newNode.prev = targetNode;
    newNode.next = nextNode;
    nextNode.prev = newNode;

    this._count++;
    return newNode;
  }

  /**
   * Insert after a target item ID (O(n) search + O(1) splice).
   */
  public insertAfter(targetId: string, media: MediaItem): MediaNode | null {
    const target = this.findNode(targetId);
    if (!target) return null;
    return this.insertAfterNode(target, media);
  }

  /**
   * Remove an item by ID (O(n) search + O(1) unlinking).
   * Maintains head, current, and circular pointer integrity.
   */
  public remove(id: string): boolean {
    const target = this.findNode(id);
    if (!target) return false;

    if (this._count === 1) {
      this.head = null;
      this.current = null;
      target.next = null;
      target.prev = null;
      this._count = 0;
      return true;
    }

    const prevNode = target.prev!;
    const nextNode = target.next!;

    prevNode.next = nextNode;
    nextNode.prev = prevNode;

    if (this.head === target) {
      this.head = nextNode;
    }

    if (this.current === target) {
      this.current = nextNode;
    }

    // Clean up unlinked node
    target.next = null;
    target.prev = null;
    this._count--;

    return true;
  }

  /**
   * Move current pointer forward by one item in O(1) time with circular wraparound.
   */
  public next(): MediaNode | null {
    if (!this.current) return null;
    this.current = this.current.next!;
    return this.current;
  }

  /**
   * Move current pointer backward by one item in O(1) time with circular wraparound.
   */
  public previous(): MediaNode | null {
    if (!this.current) return null;
    this.current = this.current.prev!;
    return this.current;
  }

  /**
   * Select an item by ID in O(n) time and set as current.
   */
  public select(id: string): MediaNode | null {
    const target = this.findNode(id);
    if (target) {
      this.current = target;
      return target;
    }
    return null;
  }

  /**
   * Search for items matching title or artist without mutating current pointer (O(n)).
   */
  public search(query: string): MediaNode[] {
    if (this._count === 0 || !this.head) return [];
    const q = query.trim().toLowerCase();
    if (!q) return this.getAll();

    const results: MediaNode[] = [];
    let curr = this.head;
    for (let i = 0; i < this._count; i++) {
      const matchTitle = curr.title.toLowerCase().includes(q);
      const matchArtist = curr.artist ? curr.artist.toLowerCase().includes(q) : false;
      if (matchTitle || matchArtist) {
        results.push(curr);
      }
      curr = curr.next!;
    }
    return results;
  }

  /**
   * Return an ordered array snapshot starting from head for UI rendering (O(n)).
   * The array is a transient projection; authoritative ordering remains in this CDLL.
   */
  public getAll(): MediaNode[] {
    if (this._count === 0 || !this.head) return [];
    const items: MediaNode[] = [];
    let curr = this.head;
    for (let i = 0; i < this._count; i++) {
      items.push(curr);
      curr = curr.next!;
    }
    return items;
  }

  /**
   * Find a node by ID (O(n)).
   */
  public findNode(id: string): MediaNode | null {
    if (this._count === 0 || !this.head) return null;
    let curr = this.head;
    for (let i = 0; i < this._count; i++) {
      if (curr.id === id) return curr;
      curr = curr.next!;
    }
    return null;
  }

  /**
   * Check if an ID exists in the playlist (O(n)).
   */
  public has(id: string): boolean {
    return this.findNode(id) !== null;
  }

  /**
   * Clear all nodes and reset pointers (O(n) reference dereference).
   */
  public clear(): void {
    if (this.head && this._count > 0) {
      let curr = this.head;
      for (let i = 0; i < this._count; i++) {
        const next = curr.next;
        curr.next = null;
        curr.prev = null;
        if (next) curr = next;
      }
    }
    this.head = null;
    this.current = null;
    this._count = 0;
  }

  /**
   * Rigorously validate all circular doubly linked list invariants.
   * Useful for unit testing, continuous integration, and runtime diagnostic badges.
   */
  public validateIntegrity(): IntegrityReport {
    const errors: string[] = [];

    // Invariant 1: Empty list state
    if (this._count === 0) {
      if (this.head !== null) errors.push("Empty list must have head === null");
      if (this.current !== null) errors.push("Empty list must have current === null");
      return {
        isValid: errors.length === 0,
        errors,
        nodeCount: 0,
        expectedCount: 0,
      };
    }

    // Invariant 2: Non-empty list must have non-null head and current
    if (!this.head) errors.push("Non-empty list has null head");
    if (!this.current) errors.push("Non-empty list has null current");

    if (!this.head) {
      return { isValid: false, errors, nodeCount: 0, expectedCount: this._count };
    }

    const tail = this.head.prev;
    if (!tail) {
      errors.push("head.prev (tail) is null");
    } else if (tail.next !== this.head) {
      errors.push("tail.next does not point to head");
    }

    // Invariant 3: Traverse forward and verify bidirectional links & count
    let forwardCount = 0;
    let curr = this.head;
    let currentFoundInCycle = false;
    const visited = new Set<MediaNode>();

    while (forwardCount < this._count + 2) {
      forwardCount++;
      if (curr === this.current) {
        currentFoundInCycle = true;
      }

      if (visited.has(curr)) {
        if (curr !== this.head) {
          errors.push(`Premature cycle detected at node ID: ${curr.id}`);
        }
        break;
      }
      visited.add(curr);

      // Check bidirectional invariant: curr.next.prev === curr
      if (!curr.next) {
        errors.push(`Node ${curr.id} has null next reference`);
        break;
      }
      if (curr.next.prev !== curr) {
        errors.push(`Bidirectional link broken: node ${curr.id}.next.prev !== node`);
      }

      // Check reverse link invariant: curr.prev.next === curr
      if (!curr.prev) {
        errors.push(`Node ${curr.id} has null prev reference`);
        break;
      }
      if (curr.prev.next !== curr) {
        errors.push(`Reverse link broken: node ${curr.id}.prev.next !== node`);
      }

      curr = curr.next;
      if (curr === this.head) {
        break;
      }
    }

    if (visited.size !== this._count) {
      errors.push(`Visited count (${visited.size}) does not match recorded count (${this._count})`);
    }

    if (!currentFoundInCycle && this.current !== null) {
      errors.push(`Current node (${this.current.id}) is not reachable in the circular traversal`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      nodeCount: visited.size,
      expectedCount: this._count,
    };
  }
}
