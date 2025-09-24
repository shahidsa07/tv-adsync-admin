"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ListVideo, Trash2, Loader2 } from 'lucide-react';
import type { Playlist } from '@/lib/definitions';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useTransition } from 'react';
import { deletePlaylistAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

interface PlaylistCardProps {
  playlist: Playlist;
}

export function PlaylistCard({ playlist }: PlaylistCardProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deletePlaylistAction(playlist.id);
            if (result.success) {
                toast({ title: "Success", description: result.message });
            } else {
                toast({ variant: "destructive", title: "Error", description: result.message });
            }
        });
    }

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200">
        <Link href={`/playlists/${playlist.id}`} className="flex flex-col flex-grow">
            <CardHeader>
                <CardTitle className="font-headline tracking-tight">{playlist.name}</CardTitle>
                <CardDescription>Click to edit playlist</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <div className="flex items-center text-muted-foreground">
                    <ListVideo className="mr-2 h-4 w-4" />
                    <span>{playlist.adIds.length} {playlist.adIds.length === 1 ? 'ad' : 'ads'}</span>
                </div>
            </CardContent>
        </Link>
      <CardFooter className="pt-4 border-t">
         <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                    <Trash2 className="mr-2" />
                    Delete Playlist
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the <strong>{playlist.name}</strong> playlist.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Continue
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
