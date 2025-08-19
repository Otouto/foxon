// Mock authentication utility for testing without Clerk
import { MOCK_USER } from './seedData'

// This simulates getting the current user without real authentication
export function getCurrentUser() {
  return {
    id: MOCK_USER.id,
    clerkUserId: MOCK_USER.clerkUserId,
    displayName: MOCK_USER.displayName,
    weeklyGoal: MOCK_USER.weeklyGoal,
    progressionState: MOCK_USER.progressionState
  }
}

// Get the user ID for database queries
export function getCurrentUserId() {
  return MOCK_USER.id
}

// Get the Clerk user ID (for when you implement real auth later)
export function getCurrentClerkUserId() {
  return MOCK_USER.clerkUserId
}

// Check if user is "authenticated" (always true in mock mode)
export function isAuthenticated() {
  return true
}

// When you implement real Clerk auth, you can replace these functions
// with actual Clerk hooks like useUser(), useAuth(), etc.
