"use client";

import type { TV, Group } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Monitor, ArrowRight, Pencil, Loader2, Trash2, XCircle, Store } from 'lucide-react';
import { AssignGroupDialog } from './assign-group-dialog';
import { useState, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import { deleteTvAction, removeFromGroupAction } from '@/lib/actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { EditTvDialog } from './edit-tv-dialog';

interface TvCardProps {
  tv: TV;
  groups: Group[];
  showRemoveFromGroup?: boolean;
}

export function TvCard({ tv, groups, showRemoveFromGroup = false }: TvCardProps) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [isRemoving, startRemoveTransition] = useTransition();
  const { toast } = useToast();

  const isOnline = tv.isOnline;
  const group = groups.find(g => g.id === tv.groupId);

  const handleDelete = () => {
    startDeleteTransition(async () => {
        const result = await deleteTvAction(tv.tvId);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    });
  }
  
  const handleRemoveFromGroup = () => {
    startRemoveTransition(async () => {
        const result = await removeFromGroupAction(tv.tvId);
        if (result.success) {
            toast({ title: 'Success', description: result.message });
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.message });
        }
    });
  }


  return (
    <>
      <Card className="flex flex-col">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="font-headline tracking-tight">
              {tv.name}
            </CardTitle>
            <Badge variant={isOnline ? 'default' : 'secondary'} className={isOnline ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>
          <CardDescription>{tv.tvId}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-2">
          <div className="flex items-center text-muted-foreground">
            <Monitor className="mr-2 h-4 w-4" />
            <span>Group: {group?.name || 'Unassigned'}</span>
          </div>
           {tv.shopLocation && (
            <div className="flex items-center text-muted-foreground">
              <Store className="mr-2 h-4 w-4" />
              <span>{tv.shopLocation}</span>
            </div>
          )}
        </CardContent>
        <CardFooter className='flex-col items-stretch gap-2'>
            {showRemoveFromGroup ? (
                <Button variant="outline" className="w-full" onClick={handleRemoveFromGroup} disabled={isRemoving}>
                    {isRemoving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <XCircle className="mr-2 h-4 w-4" />}
                    Remove from Group
                </Button>
            ) : (
                <>
                    {!group && (
                        <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => setIsAssigning(true)} disabled={!isOnline}>
                            Assign Group
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                    <div className="flex gap-2 w-full">
                        <Button variant="outline" className="flex-1" onClick={() => setIsEditing(true)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="flex-1">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete the TV <strong>{tv.name}</strong>. This action cannot be undone.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} disabled={isDeletePending}>
                                    {isDeletePending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Delete TV
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </>
            )}
        </CardFooter>
      </Card>
      {isOnline && <AssignGroupDialog open={isAssigning} onOpenChange={setIsAssigning} tv={tv} groups={groups} />}
      <EditTvDialog open={isEditing} onOpenChange={setIsEditing} tv={tv} />
    </>
  );
}
