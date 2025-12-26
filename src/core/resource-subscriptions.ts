import logger from '../logger.js';

export interface ResourceSubscription {
  uri: string;
  subscribedAt: number;
  lastAccessed: number;
  accessCount: number;
}

class ResourceSubscriptionManager {
  private subscriptions: Map<string, ResourceSubscription> = new Map();
  private resourceUpdateCallbacks: Map<string, Array<() => void>> = new Map();

  /**
   * Subscribe to a resource
   */
  subscribe(uri: string): void {
    const existing = this.subscriptions.get(uri);

    if (existing) {
      existing.lastAccessed = Date.now();
      existing.accessCount++;
    } else {
      this.subscriptions.set(uri, {
        uri,
        subscribedAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 1,
      });
    }

    logger.info(`Resource subscribed: ${uri}`);
  }

  /**
   * Unsubscribe from a resource
   */
  unsubscribe(uri: string): void {
    this.subscriptions.delete(uri);
    this.resourceUpdateCallbacks.delete(uri);
    logger.info(`Resource unsubscribed: ${uri}`);
  }

  /**
   * Check if subscribed to a resource
   */
  isSubscribed(uri: string): boolean {
    return this.subscriptions.has(uri);
  }

  /**
   * Get all active subscriptions
   */
  getSubscriptions(): ResourceSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Get most accessed resources
   */
  getMostAccessedResources(limit: number = 10): ResourceSubscription[] {
    return Array.from(this.subscriptions.values())
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
  }

  /**
   * Register callback for resource updates
   */
  onResourceUpdate(uri: string, callback: () => void): void {
    if (!this.resourceUpdateCallbacks.has(uri)) {
      this.resourceUpdateCallbacks.set(uri, []);
    }
    this.resourceUpdateCallbacks.get(uri)!.push(callback);
  }

  /**
   * Notify subscribers of resource update
   */
  notifyResourceUpdate(uri: string): void {
    const callbacks = this.resourceUpdateCallbacks.get(uri);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          logger.error(`Error in resource update callback for ${uri}:`, error);
        }
      });
    }
  }

  /**
   * Get subscription stats
   */
  getStats(): {
    totalSubscriptions: number;
    totalAccesses: number;
    mostAccessed: ResourceSubscription | null;
    averageAccessCount: number;
  } {
    const subscriptions = Array.from(this.subscriptions.values());
    const totalAccesses = subscriptions.reduce((sum, s) => sum + s.accessCount, 0);
    const mostAccessed = subscriptions.sort((a, b) => b.accessCount - a.accessCount)[0] || null;
    const averageAccessCount = subscriptions.length > 0 ? totalAccesses / subscriptions.length : 0;

    return {
      totalSubscriptions: subscriptions.length,
      totalAccesses,
      mostAccessed,
      averageAccessCount,
    };
  }

  /**
   * Clear all subscriptions
   */
  clear(): void {
    this.subscriptions.clear();
    this.resourceUpdateCallbacks.clear();
    logger.info('All resource subscriptions cleared');
  }

  /**
   * Clean up stale subscriptions (not accessed in 24 hours)
   */
  cleanupStale(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [uri, subscription] of this.subscriptions.entries()) {
      if (now - subscription.lastAccessed > maxAgeMs) {
        this.unsubscribe(uri);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} stale resource subscriptions`);
    }

    return cleaned;
  }
}

export const resourceSubscriptions = new ResourceSubscriptionManager();
