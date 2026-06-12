import { NextResponse } from 'next/server';
import { DashboardService } from '@/services/DashboardService';

export async function GET() {
  try {
    const dashboardData = await DashboardService.getDashboardData();
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
