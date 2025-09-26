"use client";

import type { TV, Group } from '@/lib/definitions';
import { useEffect, useState, useTransition, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from './ui/button';
import { getAiGroupSuggestion, assignTvToGroupAction } from '@/lib/actions';
import { Wand2, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';

interface AssignGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tv: TV;
  groups: Group[];
}

export function AssignGroupDialog({ open, onOpenChange, tv, groups }: AssignGroupDialogProps) {
  const [suggestion, setSuggestion] = useState<{ groupName: string; confidence: number } | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [isSuggestionLoading, startSuggestionTransition] = useTransition();
  const [isAssignPending, startAssignTransition] = useTransition();

  const { toast } = useToast();

  const fetchSuggestion = useCallback(() => {
    startSuggestionTransition(async () => {
      const groupNames = groups.map(g => g.name);
      const result = await getAiGroupSuggestion(tv.name, groupNames);
      if (result.success && result.data) {
        setSuggestion({ groupName: result.data.suggestedGroupName, confidence: result.data.confidence });
        const suggestedGroup = groups.find(g => g.name === result.data.suggestedGroupName);
        if (suggestedGroup) {
          setSelectedGroup(suggestedGroup.id);
        }
      } else {
        toast({ variant: 'destructive', title: 'AI Suggestion Error', description: result.message });
      }
    });
  }, [groups, tv.name, toast]);

  useEffect(() => {
    if (open) {
      // Set the currently assigned group if there is one
      setSelectedGroup(tv.groupId ?? '');
      // Fetch a new suggestion
      fetchSuggestion();
    } else {
      // Reset state when closing
      setSuggestion(null);
      setSelectedGroup('');
    }
  }, [open, tv.groupId, fetchSuggestion]);

  const handleSubmit = () => {
    if (!selectedGroup) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a group.' });
      return;
    }
    startAssignTransition(async () => {
      const result = await assignTvToGroupAction(tv.tvId, selectedGroup);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        onOpenChange(false);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">Assign Group for <span className="text-primary">{tv.name}</span></DialogTitle>
          <DialogDescription>
            Use our AI assistant to suggest a group or manually select one from the list.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="p-4 border rounded-lg bg-card space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <Wand2 className="h-5 w-5 text-accent"/>
                    <span>AI Suggestion</span>
                </div>
                {isSuggestionLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Generating suggestion...</span>
                    </div>
                ) : suggestion ? (
                    <div className="flex items-center justify-between">
                        <div className='flex items-center gap-2'>
                           <CheckCircle className="h-5 w-5 text-green-600"/>
                           <span className="font-medium text-foreground">{suggestion.groupName}</span>
                        </div>
                        <Badge variant="outline">
                            {Math.round(suggestion.confidence * 100)}% confidence
                        </Badge>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">Could not generate a suggestion.</p>
                )}
            </div>

            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a group..." />
                </SelectTrigger>
                <SelectContent>
                    {groups.map(group => (
                        <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isAssignPending || !selectedGroup}>
            {isAssignPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign to Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
