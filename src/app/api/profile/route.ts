import { NextRequest, NextResponse } from 'next/server';
import { ProfileService } from '@/services/ProfileService';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { weeklyGoal } = body;

    // Validate the weekly goal
    if (typeof weeklyGoal !== 'number' || weeklyGoal < 1 || weeklyGoal > 7) {
      return NextResponse.json(
        { error: 'Weekly goal must be a number between 1 and 7' },
        { status: 400 }
      );
    }

    // Update the user profile
    const updatedProfile = await ProfileService.updateUserProfile({ weeklyGoal });

    if (!updatedProfile) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      weeklyGoal: updatedProfile.weeklyGoal 
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
