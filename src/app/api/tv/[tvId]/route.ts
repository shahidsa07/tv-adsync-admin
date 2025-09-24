
import { NextResponse } from 'next/server';
import { getTvById, getGroupById, getPlaylistById, getAds } from '@/lib/data';
import type { Ad } from '@/lib/definitions';

export const dynamic = 'force-dynamic'; // Ensure fresh data on every request

export async function GET(
  request: Request,
  { params }: { params: { tvId: string } }
) {
  const { tvId } = params;

  if (!tvId) {
    return NextResponse.json({ error: 'TV ID is required' }, { status: 400 });
  }

  try {
    const tv = await getTvById(tvId);

    if (!tv) {
      return NextResponse.json({ error: 'TV not found' }, { status: 404 });
    }

    let group = null;
    let playlistWithAds = null;

    if (tv.groupId) {
      const groupData = await getGroupById(tv.groupId);
      if (groupData) {
        group = {
            id: groupData.id,
            name: groupData.name,
            priorityStream: groupData.priorityStream,
        };

        if (groupData.playlistId) {
            const playlistData = await getPlaylistById(groupData.playlistId);
            if (playlistData) {
                const allAds = await getAds();
                const adMap = new Map<string, Ad>(allAds.map(ad => [ad.id, ad]));
                const adsForPlaylist = playlistData.adIds
                    .map(adId => adMap.get(adId))
                    .filter((ad): ad is Ad => !!ad);

                playlistWithAds = {
                    id: playlistData.id,
                    name: playlistData.name,
                    ads: adsForPlaylist,
                };
            }
        }
      }
    }

    return NextResponse.json({
      tvId: tv.tvId,
      name: tv.name,
      group,
      playlist: playlistWithAds,
    });

  } catch (error) {
    console.error(`Error fetching data for TV ${tvId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
