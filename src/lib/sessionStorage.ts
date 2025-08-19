import fs from 'fs';
import path from 'path';
import type { Session } from './seedData';

// Simple file-based session storage for development
// In production, this should be replaced with a proper database

const SESSION_DIR = path.join(process.cwd(), '.sessions');

// Ensure sessions directory exists
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

export function saveSession(sessionId: string, session: Session): void {
  try {
    const filePath = path.join(SESSION_DIR, `${sessionId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
  } catch (error) {
    console.error('Failed to save session:', error);
  }
}

export function loadSession(sessionId: string): Session | null {
  try {
    const filePath = path.join(SESSION_DIR, `${sessionId}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as Session;
  } catch (error) {
    console.error('Failed to load session:', error);
    return null;
  }
}

export function updateSessionFile(sessionId: string, updates: Partial<Session>): Session | null {
  try {
    const existingSession = loadSession(sessionId);
    if (!existingSession) {
      return null;
    }

    const updatedSession = { ...existingSession, ...updates };
    saveSession(sessionId, updatedSession);
    return updatedSession;
  } catch (error) {
    console.error('Failed to update session:', error);
    return null;
  }
}

export function deleteSession(sessionId: string): void {
  try {
    const filePath = path.join(SESSION_DIR, `${sessionId}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Failed to delete session:', error);
  }
}
