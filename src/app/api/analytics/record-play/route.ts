import { NextResponse } from 'next/server';
import { getAnalyticsSettings, createAdPlay } from '@/lib/data';

export async function POST(request: Request) {
  try {
    const settings = await getAnalyticsSettings();
    if (!settings.isTrackingEnabled) {
      return NextResponse.json(
        { success: true, message: 'Tracking is currently disabled.' },
        { status: 200 }
      );
    }

    const body = await request.json();
    const { adId, tvId, duration } = body;

    if (!adId || !tvId || typeof duration !== 'number') {
      return NextResponse.json(
        { success: false, message: 'Invalid request body. Missing required fields.' },
        { status: 400 }
      );
    }

    await createAdPlay(adId, tvId, duration);

    return NextResponse.json(
      { success: true, message: 'Playback recorded.' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error recording ad play:', error);
    const message = error instanceof Error ? error.message : 'An internal error occurred.';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
