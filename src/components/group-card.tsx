import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tv, Trash2 } from 'lucide-react';
import type { Group } from '@/lib/definitions';
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
import { deleteGroupAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GroupCardProps {
  group: Group;
  tvCount: number;
}

export function GroupCard({ group, tvCount }: GroupCardProps) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteGroupAction(group.id);
            if (result.success) {
                toast({ title: "Success", description: result.message });
                router.refresh();
            } else {
                toast({ variant: "destructive", title: "Error", description: result.message });
            }
        });
    }

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200">
        <Link href={`/groups/${group.id}`} className="flex flex-col flex-grow">
            <CardHeader>
                <CardTitle className="font-headline tracking-tight">{group.name}</CardTitle>
                <CardDescription>Click to manage group</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <div className="flex items-center text-muted-foreground">
                    <Tv className="mr-2 h-4 w-4" />
                    <span>{tvCount} {tvCount === 1 ? 'TV' : 'TVs'} assigned</span>
                </div>
            </CardContent>
        </Link>
      <CardFooter className="pt-4 border-t">
         <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={tvCount > 0}>
                    <Trash2 className="mr-2" />
                    Delete Group
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the <strong>{group.name}</strong> group.
                    You can only delete a group if it has no TVs assigned to it.
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
