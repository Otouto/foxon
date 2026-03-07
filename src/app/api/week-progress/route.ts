import { NextResponse } from 'next/server'
import { DashboardService } from '@/services/DashboardService'

export async function GET() {
  try {
    const progress = await DashboardService.getWeekProgress()
    return NextResponse.json(progress)
  } catch (error) {
    console.error('Failed to fetch week progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch week progress' },
      { status: 500 }
    )
  }
}
