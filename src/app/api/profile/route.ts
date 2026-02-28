import { NextRequest, NextResponse } from 'next/server';
import { ProfileService } from '@/services/ProfileService';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { weeklyGoal, email } = body;

    const updates: { weeklyGoal?: number; email?: string | null } = {};

    // Validate weekly goal if provided
    if (weeklyGoal !== undefined) {
      if (typeof weeklyGoal !== 'number' || weeklyGoal < 1 || weeklyGoal > 7) {
        return NextResponse.json(
          { error: 'Weekly goal must be a number between 1 and 7' },
          { status: 400 }
        );
      }
      updates.weeklyGoal = weeklyGoal;
    }

    // Validate email if provided
    if (email !== undefined) {
      if (email !== null && email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email address' },
          { status: 400 }
        );
      }
      updates.email = email || null;
    }

    // Update the user profile
    const updatedProfile = await ProfileService.updateUserProfile(updates);

    if (!updatedProfile) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      weeklyGoal: updatedProfile.weeklyGoal,
      email: updatedProfile.email,
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
