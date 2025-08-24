'use client';

import { useEffect } from 'react';
import { SessionStorageManager } from '@/lib/SessionStorageManager';

/**
 * Client-side component to perform storage health checks on app startup
 * Cleans up abandoned sessions and maintains storage hygiene
 */
export function StorageHealthChecker() {
  useEffect(() => {
    // Run storage health check on app startup
    const performHealthCheck = () => {
      try {
        // Clean up abandoned sessions (older than 24 hours)
        SessionStorageManager.cleanupAbandonedSessions(24);
        
        // Log active sessions for monitoring
        const activeSessions = SessionStorageManager.getActiveSessionIds();
        if (activeSessions.length > 0) {
          console.log(`📊 Found ${activeSessions.length} active sessions:`, activeSessions);
        }
        
        console.log('✅ Storage health check completed');
      } catch (error) {
        console.warn('⚠️ Storage health check failed:', error);
      }
    };

    // Run immediately on mount
    performHealthCheck();

    // Also run periodically (every 30 minutes) if the app stays open
    const interval = setInterval(performHealthCheck, 30 * 60 * 1000); // 30 minutes

    // Cleanup interval on unmount
    return () => {
      clearInterval(interval);
    };
  }, []);

  // This component doesn't render anything
  return null;
}