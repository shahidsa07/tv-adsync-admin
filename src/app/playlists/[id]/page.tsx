import { getPlaylistById, getAds } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Header } from '@/components/header';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { PlaylistEditorClient } from '@/components/playlist-editor-client';

export default async function PlaylistDetailsPage({ params }: { params: { id: string } }) {
  const playlist = await getPlaylistById(params.id);
  const allAds = await getAds();

  if (!playlist) {
    notFound();
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mb-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/playlists">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Playlists
            </Link>
          </Button>
        </div>
        <PlaylistEditorClient initialPlaylist={playlist} allAds={allAds} />
      </main>
    </div>
  );
}
