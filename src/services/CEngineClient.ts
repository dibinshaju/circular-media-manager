import { MediaItem } from '../types/media.js';

export interface CNodeSnapshot {
  id: string;
  title: string;
  artist: string;
  type: 'audio' | 'video';
  source: string;
  address: string;
  prevId: string;
  nextId: string;
  isCurrent: boolean;
  isHead: boolean;
  isTail: boolean;
}

export interface CEngineState {
  isOnline: boolean;
  count: number;
  current: CNodeSnapshot | null;
  items: CNodeSnapshot[];
  integrity: {
    valid: boolean;
    error: string;
  };
}

const BRIDGE_URL = 'http://localhost:3001/api/cdll';

class CEngineClient {
  private state: CEngineState = {
    isOnline: false,
    count: 0,
    current: null,
    items: [],
    integrity: { valid: true, error: '' },
  };

  private listeners: Set<(state: CEngineState) => void> = new Set();

  constructor() {
    this.pollState();
  }

  public subscribe(listener: (state: CEngineState) => void): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const copy = { ...this.state };
    this.listeners.forEach((l) => l(copy));
  }

  public async pollState(): Promise<boolean> {
    try {
      const res = await fetch(`${BRIDGE_URL}/state`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        this.state = {
          isOnline: true,
          count: data.count,
          current: data.current,
          items: data.items,
          integrity: data.integrity || { valid: true, error: '' },
        };
        this.notify();
        return true;
      }
    } catch {
      this.state.isOnline = false;
      this.notify();
    }
    return false;
  }

  public async next(): Promise<void> {
    try {
      const res = await fetch(`${BRIDGE_URL}/next`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        this.updateFromResponse(data);
      }
    } catch {
      // Fallback
    }
  }

  public async previous(): Promise<void> {
    try {
      const res = await fetch(`${BRIDGE_URL}/prev`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        this.updateFromResponse(data);
      }
    } catch {
      // Fallback
    }
  }

  public async select(id: string): Promise<void> {
    try {
      const res = await fetch(`${BRIDGE_URL}/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        const data = await res.json();
        this.updateFromResponse(data);
      }
    } catch {
      // Fallback
    }
  }

  public async remove(id: string): Promise<void> {
    try {
      const res = await fetch(`${BRIDGE_URL}/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        const data = await res.json();
        this.updateFromResponse(data);
      }
    } catch {
      // Fallback
    }
  }

  public async add(item: MediaItem): Promise<void> {
    try {
      const res = await fetch(`${BRIDGE_URL}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const data = await res.json();
        this.updateFromResponse(data);
      }
    } catch {
      // Fallback
    }
  }

  private updateFromResponse(data: any) {
    this.state = {
      isOnline: true,
      count: data.count,
      current: data.current,
      items: data.items,
      integrity: data.integrity || { valid: true, error: '' },
    };
    this.notify();
  }

  public getState(): CEngineState {
    return { ...this.state };
  }
}

export const cEngineClient = new CEngineClient();
