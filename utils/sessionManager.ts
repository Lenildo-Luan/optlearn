/**
 * Session Manager Utility
 * Provides centralized session management and event handling
 */

interface SessionWarningOptions {
  warningTime: number; // Minutes before expiration to show warning
  autoRefresh: boolean; // Whether to auto-refresh sessions
  onWarning?: (timeLeft: number) => void;
  onExpired?: () => void;
  onRefreshed?: () => void;
}

class SessionManager {
  private warningTimer: NodeJS.Timeout | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private options: SessionWarningOptions;

  constructor(options: Partial<SessionWarningOptions> = {}) {
    this.options = {
      warningTime: 5, // 5 minutes default
      autoRefresh: true,
      ...options
    };

    if (process.client) {
      this.initializeEventListeners();
    }
  }

  /**
   * Initialize event listeners for session management
   */
  private initializeEventListeners() {
    // Listen for session refresh events
    window.addEventListener('session-refreshed', (event: any) => {
      console.log('Session refreshed:', event.detail);
      this.scheduleWarning(event.detail.session);
      this.options.onRefreshed?.();
    });

    // Listen for session expired events
    window.addEventListener('session-expired', () => {
      console.log('Session expired');
      this.clearTimers();
      this.options.onExpired?.();
    });

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Page became visible, check session
        this.checkSessionOnFocus();
      }
    });

    // Listen for online/offline events
    window.addEventListener('online', () => {
      // Back online, check session
      this.checkSessionOnFocus();
    });
  }

  /**
   * Schedule warning timer based on session expiration
   */
  public scheduleWarning(session: any) {
    this.clearTimers();

    if (!session?.expires_at) return;

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at;
    const warningTime = this.options.warningTime * 60; // Convert to seconds
    const timeUntilWarning = (expiresAt - warningTime) - now;

    if (timeUntilWarning > 0) {
      this.warningTimer = setTimeout(() => {
        const timeLeft = expiresAt - Math.floor(Date.now() / 1000);
        if (timeLeft > 0) {
          this.options.onWarning?.(Math.ceil(timeLeft / 60)); // Convert to minutes
        }
      }, timeUntilWarning * 1000);
    }
  }

  /**
   * Check session when page regains focus
   */
  private async checkSessionOnFocus() {
    try {
      const { $supabase } = useNuxtApp();
      const { data: { session }, error } = await $supabase.auth.getSession();

      if (error || !session) {
        window.dispatchEvent(new CustomEvent('session-expired'));
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at || 0;

      if (expiresAt <= now) {
        // Session expired while away
        if (this.options.autoRefresh) {
          await this.refreshSession();
        } else {
          window.dispatchEvent(new CustomEvent('session-expired'));
        }
      } else {
        // Session still valid, reschedule warning
        this.scheduleWarning(session);
      }
    } catch (error) {
      console.error('Error checking session on focus:', error);
      window.dispatchEvent(new CustomEvent('session-expired'));
    }
  }

  /**
   * Manually refresh session
   */
  public async refreshSession(): Promise<boolean> {
    try {
      const { $supabase } = useNuxtApp();
      const { data: { session }, error } = await $supabase.auth.refreshSession();

      if (error || !session) {
        window.dispatchEvent(new CustomEvent('session-expired'));
        return false;
      }

      window.dispatchEvent(new CustomEvent('session-refreshed', {
        detail: { session }
      }));
      return true;
    } catch (error) {
      console.error('Error refreshing session:', error);
      window.dispatchEvent(new CustomEvent('session-expired'));
      return false;
    }
  }

  /**
   * Get time until session expiration (in minutes)
   */
  public async getTimeUntilExpiration(): Promise<number | null> {
    try {
      const { $supabase } = useNuxtApp();
      const { data: { session } } = await $supabase.auth.getSession();

      if (!session?.expires_at) return null;

      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at;
      const timeLeft = expiresAt - now;

      return timeLeft > 0 ? Math.ceil(timeLeft / 60) : 0;
    } catch (error) {
      console.error('Error getting session expiration time:', error);
      return null;
    }
  }

  /**
   * Clear all timers
   */
  private clearTimers() {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Destroy session manager
   */
  public destroy() {
    this.clearTimers();
    if (process.client) {
      window.removeEventListener('session-refreshed', () => {});
      window.removeEventListener('session-expired', () => {});
      document.removeEventListener('visibilitychange', () => {});
      window.removeEventListener('online', () => {});
    }
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();

// Export class for custom instances
export { SessionManager };

// Export composable for Vue components
export const useSessionManager = () => {
  return {
    sessionManager,
    refreshSession: () => sessionManager.refreshSession(),
    getTimeUntilExpiration: () => sessionManager.getTimeUntilExpiration()
  };
};