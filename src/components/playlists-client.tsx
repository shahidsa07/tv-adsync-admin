"use client"

import type { Playlist } from '@/lib/definitions';
import { useState } from 'react';
import { Button } from './ui/button';
import { PlusCircle } from 'lucide-react';
import { CreatePlaylistDialog } from './create-playlist-dialog';
import { PlaylistCard } from './playlist-card';

interface PlaylistsClientProps {
  initialPlaylists: Playlist[];
}

export function PlaylistsClient({ initialPlaylists }: PlaylistsClientProps) {
  const [playlists] = useState(initialPlaylists);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className='space-y-1'>
            <h1 className="text-3xl font-bold font-headline">Ad Playlists</h1>
            <p className="text-muted-foreground">Manage your reusable ad playlists.</p>
          </div>
          <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Playlist
          </Button>
        </div>
        {playlists.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {playlists.map(playlist => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">No playlists found. Create one to get started.</p>
          </div>
        )}
      </div>
      <CreatePlaylistDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  );
}
