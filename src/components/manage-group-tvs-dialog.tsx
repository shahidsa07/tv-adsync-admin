"use client";

import type { Group, TV } from "@/lib/definitions";
import { useState, useEffect, useTransition } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { updateGroupTvsAction } from "@/lib/actions";
import { Loader2 } from "lucide-react";
import { Badge } from "./ui/badge";

interface ManageGroupTvsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group;
  allTvs: TV[];
}

export function ManageGroupTvsDialog({ open, onOpenChange, group, allTvs }: ManageGroupTvsDialogProps) {
  const [selectedTvIds, setSelectedTvIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const currentTvIds = allTvs.filter(tv => tv.groupId === group.id).map(tv => tv.tvId);
      setSelectedTvIds(currentTvIds);
    }
  }, [open, group.id, allTvs]);

  const handleTvToggle = (tvId: string) => {
    setSelectedTvIds(prev =>
      prev.includes(tvId) ? prev.filter(id => id !== tvId) : [...prev, tvId]
    );
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await updateGroupTvsAction(group.id, selectedTvIds);
      if (result.success) {
        toast({ title: "Success", description: result.message });
        onOpenChange(false);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Manage TVs for {group.name}</DialogTitle>
          <DialogDescription>
            Select which TVs should be part of this group. Only TVs not in another group are shown.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72">
          <div className="space-y-4 p-4">
            {allTvs
                .filter(tv => tv.groupId === null || tv.groupId === group.id)
                .map(tv => (
                    <div key={tv.tvId} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                            <Checkbox
                                id={`tv-${tv.tvId}`}
                                checked={selectedTvIds.includes(tv.tvId)}
                                onCheckedChange={() => handleTvToggle(tv.tvId)}
                            />
                            <Label htmlFor={`tv-${tv.tvId}`} className="font-medium cursor-pointer">
                                {tv.name}
                            </Label>
                        </div>
                        <Badge variant={tv.socketId ? 'default' : 'secondary'} className={tv.socketId ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}>
                          {tv.socketId ? 'Online' : 'Offline'}
                        </Badge>
                    </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
