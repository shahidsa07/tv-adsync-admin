import { NextResponse } from 'next/server';
import { setTvOnlineStatusAction } from '@/lib/actions';

// This is a simple secret to protect the endpoint from public access.
// In a real production app, you'd want a more robust solution.
const API_SECRET = process.env.INTERNAL_API_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');

  if (authHeader !== `Bearer ${API_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { tvId, isOnline, socketId } = await request.json();

    if (!tvId) {
      return NextResponse.json({ error: 'tvId is required' }, { status: 400 });
    }

    // We use the existing server action, which already contains the logic
    // to update the database and revalidate the necessary paths.
    const result = await setTvOnlineStatusAction(tvId, isOnline, socketId);

    if (result.success) {
      return NextResponse.json({ message: result.message }, { status: 200 });
    } else {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Error in /api/tv-status:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
