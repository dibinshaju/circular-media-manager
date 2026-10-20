/**
 * Object URL Registry
 * 
 * Sustainability & Memory Efficiency:
 * Browsers do not automatically garbage-collect Object URLs created via
 * URL.createObjectURL() until document unload unless explicitly revoked.
 * This registry tracks all active URLs and ensures prompt revocation
 * when nodes are removed or the application resets.
 */

class MediaRegistry {
  private activeUrls = new Set<string>();

  /**
   * Create and register a managed Object URL.
   */
  public createUrl(blob: Blob | File): string {
    const url = URL.createObjectURL(blob);
    this.activeUrls.add(url);
    return url;
  }

  /**
   * Revoke an individual Object URL and free memory.
   */
  public revokeUrl(url: string): void {
    if (this.activeUrls.has(url)) {
      URL.revokeObjectURL(url);
      this.activeUrls.delete(url);
    }
  }

  /**
   * Revoke all managed Object URLs.
   */
  public revokeAll(): void {
    this.activeUrls.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Ignore if already revoked
      }
    });
    this.activeUrls.clear();
  }

  /**
   * Returns current active Object URL count for memory diagnostics.
   */
  public getActiveCount(): number {
    return this.activeUrls.size;
  }
}

export const mediaRegistry = new MediaRegistry();
