import type { Session } from './seedData';

/**
 * Client-side helper to fetch session data from API
 */
export async function getSessionFromAPI(sessionId: string): Promise<Session | null> {
  try {
    const response = await fetch(`/api/sessions/${sessionId}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // Session not found
      }
      throw new Error('Failed to fetch session');
    }

    const data = await response.json();
    
    if (data.success && data.session) {
      return data.session;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching session:', error);
    return null;
  }
}

/**
 * Client-side helper to update session data via API
 */
export async function updateSessionViaAPI(sessionId: string, updates: Partial<Session>): Promise<Session | null> {
  try {
    const response = await fetch(`/api/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update session');
    }

    const data = await response.json();
    
    if (data.success && data.session) {
      return data.session;
    }
    
    return null;
  } catch (error) {
    console.error('Error updating session:', error);
    return null;
  }
}
