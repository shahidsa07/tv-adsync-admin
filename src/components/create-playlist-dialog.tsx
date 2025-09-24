"use client";

import { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { createPlaylistAction } from '@/lib/actions';
import { Loader2 } from 'lucide-react';

interface CreatePlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePlaylistDialog({ open, onOpenChange }: CreatePlaylistDialogProps) {
  const [name, setName] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Playlist name cannot be empty.' });
      return;
    }
    
    startTransition(async () => {
      const result = await createPlaylistAction(name);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        setName('');
        onOpenChange(false);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-headline">Create New Playlist</DialogTitle>
            <DialogDescription>
              Give your new playlist a name. You can add ads to it on the next screen.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Weekend Specials"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Playlist
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
