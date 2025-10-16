"use client";

import type { Group, TV } from "@/lib/definitions";
import { useState, useEffect, useTransition, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { updateGroupTvsAction } from "@/lib/actions";
import { Loader2, Search, Store } from "lucide-react";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";

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
  const [searchTerm, setSearchTerm] = useState("");

  const currentlyAssignedIds = useMemo(() => 
    allTvs.filter(tv => tv.groupId === group.id).map(tv => tv.tvId),
    [allTvs, group.id]
  );

  useEffect(() => {
    if (open) {
      setSelectedTvIds(currentlyAssignedIds);
      setSearchTerm("");
    }
  }, [open, currentlyAssignedIds]);

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

  const filteredTvs = useMemo(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    // Only show TVs that are not assigned to any other group
    return allTvs
      .filter(tv => tv.groupId === null || tv.groupId === group.id)
      .filter(tv => 
          tv.name.toLowerCase().includes(lowercasedTerm) ||
          (tv.shopLocation && tv.shopLocation.toLowerCase().includes(lowercasedTerm))
      );
  }, [allTvs, searchTerm, group.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Manage TVs for {group.name}</DialogTitle>
          <DialogDescription>
            Select which TVs belong to this group.
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search by name or location..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
            />
        </div>
        
        <ScrollArea className="h-72">
          <div className="space-y-4 p-4">
            {filteredTvs.length > 0 ? filteredTvs.map(tv => (
                    <div key={tv.tvId} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-start gap-3">
                            <Checkbox
                                id={`tv-${tv.tvId}`}
                                checked={selectedTvIds.includes(tv.tvId)}
                                onCheckedChange={() => handleTvToggle(tv.tvId)}
                                className="mt-1"
                            />
                            <div className="grid gap-0.5">
                                <Label htmlFor={`tv-${tv.tvId}`} className="font-medium cursor-pointer leading-none">
                                    {tv.name}
                                </Label>
                                {tv.shopLocation && (
                                    <div className="flex items-center text-xs text-muted-foreground">
                                        <Store className="mr-1.5 h-3 w-3" />
                                        <span>{tv.shopLocation}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <Badge variant={tv.isOnline ? 'default' : 'secondary'} className={tv.isOnline ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}>
                          {tv.isOnline ? 'Online' : 'Offline'}
                        </Badge>
                    </div>
            )) : (
              <p className="text-center text-muted-foreground pt-4">No available TVs match your search.</p>
            )}
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
