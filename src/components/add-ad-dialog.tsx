"use client";

import { useState, useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { createAdAction } from '@/lib/actions';
import { Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

interface AddAdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAdDialog({ open, onOpenChange }: AddAdDialogProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'image' | 'video'>('image');
  const [duration, setDuration] = useState(15);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Name and URL cannot be empty.' });
      return;
    }
    
    startTransition(async () => {
      const result = await createAdAction(name, type, url, type === 'image' ? duration : undefined);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        setName('');
        setUrl('');
        setType('image');
        setDuration(15);
        onOpenChange(false);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-headline">Add New Ad to Library</DialogTitle>
            <DialogDescription>
              This will add a new ad to your global library, making it available for all playlists.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-2">
                <Label htmlFor="name">Ad Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Summer Sale Graphic" required />
            </div>
             <div className="space-y-2">
                <Label>Type</Label>
                <RadioGroup value={type} onValueChange={(value: 'image' | 'video') => setType(value)} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="image" id="image" />
                        <Label htmlFor="image">Image</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="video" id="video" />
                        <Label htmlFor="video">Video</Label>
                    </div>
                </RadioGroup>
            </div>
             <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input id="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/ad.jpg" required />
            </div>
            {type === 'image' && (
                <div className="space-y-2">
                    <Label htmlFor="duration">Duration (seconds)</Label>
                    <Input id="duration" type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value) || 0)} placeholder="15" required />
                </div>
            )}
          </div>
          <DialogFooter>
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Ad
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
