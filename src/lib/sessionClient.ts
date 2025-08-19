import type { SessionWithDetails, BatchSetOperation, SessionSealData } from '@/services/SessionService';

/**
 * Client-side helper to fetch session data from API
 */
export async function getSessionFromAPI(sessionId: string): Promise<SessionWithDetails | null> {
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
 * Client-side helper to update session sets via batch API
 */
export async function batchUpdateSets(
  sessionId: string, 
  operations: BatchSetOperation[]
): Promise<SessionWithDetails | null> {
  try {
    const response = await fetch(`/api/sessions/${sessionId}/sets/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ operations }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update sets');
    }

    const data = await response.json();
    
    if (data.success && data.session) {
      return data.session;
    }
    
    return null;
  } catch (error) {
    console.error('Error updating sets:', error);
    return null;
  }
}

/**
 * Client-side helper to finish a session
 */
export async function finishSession(sessionId: string): Promise<SessionWithDetails | null> {
  try {
    const response = await fetch(`/api/sessions/${sessionId}/finish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to finish session');
    }

    const data = await response.json();
    
    if (data.success && data.session) {
      return data.session;
    }
    
    return null;
  } catch (error) {
    console.error('Error finishing session:', error);
    return null;
  }
}

/**
 * Client-side helper to create session seal
 */
export async function createSessionSeal(
  sessionId: string, 
  sealData: SessionSealData
): Promise<boolean> {
  try {
    const response = await fetch(`/api/sessions/${sessionId}/seal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sealData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create session seal');
    }

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Error creating session seal:', error);
    return false;
  }
}

/**
 * Legacy function for backward compatibility - will be removed
 * @deprecated Use batchUpdateSets instead
 */
export async function updateSessionViaAPI(sessionId: string, updates: any): Promise<any | null> {
  console.warn('updateSessionViaAPI is deprecated. Use batchUpdateSets instead.');
  return null;
}