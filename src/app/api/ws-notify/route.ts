import { NextResponse } from 'next/server';
import { setTvOnlineStatusAction } from '@/lib/actions';

export async function POST(request: Request) {
  try {
    const { tvId, isOnline } = await request.json();

    if (typeof tvId !== 'string' || typeof isOnline !== 'boolean') {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    // Use the server action to update Firestore and notify admins
    await setTvOnlineStatusAction(tvId, isOnline);
    
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('[ws-notify] Error:', message);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
