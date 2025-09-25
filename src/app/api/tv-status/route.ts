import { NextResponse } from 'next/server';
import { setTvOnlineStatusAction } from '@/lib/actions';
import { getTvById } from '@/lib/data';

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

    // Ensure the TV exists before trying to update it, especially for "online" events.
    if (isOnline) {
        const tv = await getTvById(tvId);
        if (!tv) {
            console.log(`API: TV with ID ${tvId} not found. Registration might be pending.`);
            // We don't treat this as an error. The TV is connected but not yet in the system.
            return NextResponse.json({ message: 'TV not registered, status not updated.' }, { status: 200 });
        }
    }

    // We use the existing server action, which already contains the logic
    // to update the database and revalidate the necessary paths.
    const result = await setTvOnlineStatusAction(tvId, isOnline, socketId);

    if (result.success) {
      return NextResponse.json({ message: result.message }, { status: 200 });
    } else {
      // Don't return a 500 if the document wasn't found on an "offline" update,
      // as it might have been deleted.
      if (result.message.includes("not found")) {
         return NextResponse.json({ message: "TV not found, could not update status." }, { status: 200 });
      }
      return NextResponse.json({ error: result.message }, { status: 500 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Error in /api/tv-status:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
