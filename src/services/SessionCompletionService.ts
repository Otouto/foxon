import type { CompletedSessionData } from '@/hooks/useSessionCompletion';

export interface SessionSealData {
  effort: string;
  vibeLine: string;
  note?: string;
}

export interface SessionCompletionResponse {
  sessionId: string;
}

/**
 * Service for handling session completion operations
 * Centralizes all API calls related to session completion and sealing
 */
export class SessionCompletionService {
  /**
   * Save a completed session to the backend
   * @param sessionData - The completed session data
   * @returns Promise resolving to the session ID
   * @throws Error if the API call fails
   */
  static async saveSession(sessionData: CompletedSessionData): Promise<string> {
    try {
      const response = await fetch('/api/sessions/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionData }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save session: ${response.status} ${errorText}`);
      }

      const result: SessionCompletionResponse = await response.json();
      return result.sessionId;
    } catch (error) {
      // Re-throw with more context if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to save session. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Seal a session with reflection data (effort, vibe, notes)
   * @param sessionId - The ID of the session to seal
   * @param sealData - The reflection data to attach to the session
   * @returns Promise that resolves when the session is sealed
   * @throws Error if the API call fails
   */
  static async sealSession(sessionId: string, sealData: SessionSealData): Promise<void> {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/seal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sealData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save session reflection: ${response.status} ${errorText}`);
      }
    } catch (error) {
      // Re-throw with more context if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to save reflection. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Complete a session by saving it and then sealing it with reflection data
   * This is a convenience method that combines both operations
   * @param sessionData - The completed session data
   * @param sealData - The reflection data
   * @returns Promise resolving to the session ID
   */
  static async completeAndSealSession(
    sessionData: CompletedSessionData, 
    sealData: SessionSealData
  ): Promise<string> {
    const sessionId = await this.saveSession(sessionData);
    await this.sealSession(sessionId, sealData);
    return sessionId;
  }
}
