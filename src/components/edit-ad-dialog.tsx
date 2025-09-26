"use client";

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { updateAdAction } from '@/lib/actions';
import { Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import type { Ad } from '@/lib/definitions';

interface EditAdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ad: Ad;
}

export function EditAdDialog({ open, onOpenChange, ad }: EditAdDialogProps) {
  const [name, setName] = useState(ad.name);
  const [url, setUrl] = useState(ad.url);
  const [type, setType] = useState<'image' | 'video'>(ad.type);
  const [duration, setDuration] = useState(ad.duration || 15);
  const [tags, setTags] = useState(ad.tags?.join(', ') || '');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setName(ad.name);
    setUrl(ad.url);
    setType(ad.type);
    setDuration(ad.duration || 15);
    setTags(ad.tags?.join(', ') || '');
  }, [ad]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Name and URL cannot be empty.' });
      return;
    }
    
    startTransition(async () => {
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);
      const adData: Partial<Ad> = { name, url, type, tags: tagArray };
      if (type === 'image') {
          adData.duration = duration;
      }
      const result = await updateAdAction(ad.id, adData);

      if (result.success) {
        toast({ title: 'Success', description: result.message });
        onOpenChange(false);
        router.refresh();
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
            <DialogTitle className="font-headline">Edit Ad</DialogTitle>
            <DialogDescription>
              Update the details for the ad "{ad.name}".
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
                        <RadioGroupItem value="image" id="image-edit" />
                        <Label htmlFor="image-edit">Image</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="video" id="video-edit" />
                        <Label htmlFor="video-edit">Video</Label>
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
             <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g., sale, summer, fashion" />
            </div>
          </div>
          <DialogFooter>
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
