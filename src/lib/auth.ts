import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * In-process cache of clerkUserId -> internal User.id. The mapping is immutable
 * once a user exists, so this safely removes a DB round-trip from every
 * authenticated request after the first. Each serverless instance warms its own.
 */
const userIdByClerkId = new Map<string, string>();

/**
 * Get the internal User.id for the current Clerk user.
 * Auto-creates a User record on first sign-in.
 */
export async function getCurrentUserId(): Promise<string> {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    throw new Error('Not authenticated');
  }

  const cached = userIdByClerkId.get(clerkUserId);
  if (cached) {
    return cached;
  }

  // Look up existing user by Clerk ID
  const existingUser = await prisma.user.findFirst({
    where: { clerkUserId },
    select: { id: true },
  });

  if (existingUser) {
    userIdByClerkId.set(clerkUserId, existingUser.id);
    return existingUser.id;
  }

  // Auto-create user on first sign-in
  const newUser = await prisma.user.create({
    data: {
      clerkUserId,
      displayName: null,
      weeklyGoal: 3,
    },
    select: { id: true },
  });

  userIdByClerkId.set(clerkUserId, newUser.id);
  return newUser.id;
}

/**
 * Check if the current request is authenticated.
 */
export async function isAuthenticated(): Promise<boolean> {
  const { userId } = await auth();
  return !!userId;
}
