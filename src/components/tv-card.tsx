"use client";

import type { TV, Group } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Monitor, ArrowRight, Pencil, Check, X, Wifi, WifiOff, Loader2, Trash2 } from 'lucide-react';
import { AssignGroupDialog } from './assign-group-dialog';
import { useState, useTransition } from 'react';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';
import { updateTvNameAction, deleteTvAction } from '@/lib/actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

interface TvCardProps {
  tv: TV;
  groups: Group[];
}

export function TvCard({ tv, groups }: TvCardProps) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(tv.name);
  const [isNamePending, startNameTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const { toast } = useToast();

  const isOnline = !!tv.socketId;
  const group = groups.find(g => g.id === tv.groupId);

  const handleNameUpdate = async () => {
    if (newName.trim() === '' || newName === tv.name) {
      setIsEditingName(false);
      return;
    }
    startNameTransition(async () => {
      const result = await updateTvNameAction(tv.tvId, newName);
      if (result.success) {
        toast({ title: 'Success', description: result.message });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
        setNewName(tv.name);
      }
      setIsEditingName(false);
    });
  }

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

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader>
          <div className="flex items-start justify-between">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="h-9" disabled={isNamePending} />
                <Button size="icon" variant="ghost" className="h-9 w-9" onClick={handleNameUpdate} disabled={isNamePending}>
                  {isNamePending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setIsEditingName(false)} disabled={isNamePending}><X className="h-4 w-4" /></Button>
              </div>
            ) : (
              <CardTitle className="font-headline flex items-center gap-2 tracking-tight">
                {tv.name}
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsEditingName(true)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </CardTitle>
            )}
            <Badge variant={isOnline ? 'default' : 'secondary'} className={isOnline ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>
          <CardDescription>{tv.tvId}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="flex items-center text-muted-foreground">
            <Monitor className="mr-2 h-4 w-4" />
            <span>Group: {group?.name || 'Unassigned'}</span>
          </div>
        </CardContent>
        <CardFooter className='gap-2'>
          <div className="w-full flex gap-2">
            {!group && (
                <Button className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => setIsAssigning(true)}>
                Assign Group
                <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className='flex-1'>
                  <Trash2 className="h-4 w-4" />
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
        </CardFooter>
      </Card>
      {isOnline && <AssignGroupDialog open={isAssigning} onOpenChange={setIsAssigning} tv={tv} groups={groups} />}
    </>
  );
}