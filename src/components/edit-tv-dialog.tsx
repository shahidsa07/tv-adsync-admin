"use client";

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { updateTvAction } from '@/lib/actions';
import { Loader2 } from 'lucide-react';
import type { TV } from '@/lib/definitions';

interface EditTvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tv: TV;
}

export function EditTvDialog({ open, onOpenChange, tv }: EditTvDialogProps) {
  const [name, setName] = useState(tv.name);
  const [shopLocation, setShopLocation] = useState(tv.shopLocation || '');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (open) {
        setName(tv.name);
        setShopLocation(tv.shopLocation || '');
    }
  }, [open, tv]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'TV Name cannot be empty.' });
      return;
    }
    
    startTransition(async () => {
      const result = await updateTvAction(tv.tvId, { name, shopLocation });

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
            <DialogTitle className="font-headline">Edit TV</DialogTitle>
            <DialogDescription>
              Update the details for "{tv.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-2">
                <Label htmlFor="name">TV Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="shopLocation">Shop Location (Optional)</Label>
                <Input id="shopLocation" value={shopLocation} onChange={e => setShopLocation(e.target.value)} placeholder="e.g., Main Street Store" />
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
