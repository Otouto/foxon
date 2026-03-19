import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * Get the internal User.id for the current Clerk user.
 * Auto-creates a User record on first sign-in.
 */
export async function getCurrentUserId(): Promise<string> {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    throw new Error('Not authenticated');
  }

  // Look up existing user by Clerk ID
  const existingUser = await prisma.user.findFirst({
    where: { clerkUserId },
    select: { id: true },
  });

  if (existingUser) {
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

  return newUser.id;
}

/**
 * Check if the current request is authenticated.
 */
export async function isAuthenticated(): Promise<boolean> {
  const { userId } = await auth();
  return !!userId;
}
