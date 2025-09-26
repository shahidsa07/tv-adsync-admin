"use client";

import type { Ad } from "@/lib/definitions";
import { useState, useMemo } from "react";
import { Button } from "./ui/button";
import { PlusCircle, Trash2, Loader2, FileImage, Video, Pencil, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import Image from "next/image";
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
} from "@/components/ui/alert-dialog";
import { useTransition } from 'react';
import { deleteAdAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { AddAdDialog } from "./add-ad-dialog";
import { EditAdDialog } from "./edit-ad-dialog";
import { Input } from "./ui/input";

interface AdLibraryClientProps {
    initialAds: Ad[];
}

export function AdLibraryClient({ initialAds }: AdLibraryClientProps) {
    const [showAddAdDialog, setShowAddAdDialog] = useState(false);
    const [editingAd, setEditingAd] = useState<Ad | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredAds = useMemo(() => {
        const lowercasedTerm = searchTerm.toLowerCase();
        return initialAds.filter(ad => {
            const nameMatch = ad.name.toLowerCase().includes(lowercasedTerm);
            const tagMatch = ad.tags?.some(tag => tag.toLowerCase().includes(lowercasedTerm));
            return nameMatch || tagMatch;
        });
    }, [initialAds, searchTerm]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Ad Library</h1>
                    <p className="text-muted-foreground">Manage all available ad assets in your system.</p>
                </div>
                <div className="flex flex-col items-end gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-auto md:min-w-[300px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search name or tags..."
                            className="pl-8 w-full bg-background"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" onClick={() => setShowAddAdDialog(true)} className="w-full sm:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Ad
                    </Button>
                </div>
            </div>
            
            {filteredAds.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredAds.map(ad => (
                        <AdCard key={ad.id} ad={ad} onEdit={() => setEditingAd(ad)} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">
                        {searchTerm ? "No ads match your search." : "Your ad library is empty. Add an ad to get started."}
                    </p>
                </div>
            )}

            <AddAdDialog open={showAddAdDialog} onOpenChange={setShowAddAdDialog} />
            {editingAd && (
                <EditAdDialog
                    open={!!editingAd}
                    onOpenChange={(isOpen) => !isOpen && setEditingAd(null)}
                    ad={editingAd}
                />
            )}
        </div>
    );
}

function AdCard({ ad, onEdit }: { ad: Ad, onEdit: () => void }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteAdAction(ad.id);
            if (result.success) {
                toast({ title: "Success", description: result.message });
            } else {
                toast({ variant: "destructive", title: "Error", description: result.message });
            }
        });
    }

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="w-full aspect-video bg-muted rounded-md overflow-hidden relative mb-2">
                     {ad.type === 'image' ? (
                        <Image src={ad.url} alt={ad.name} layout="fill" objectFit="cover" />
                    ) : (
                        <div className="flex items-center justify-center h-full bg-muted">
                            <Video className="h-10 w-10 text-muted-foreground"/>
                        </div>
                    )}
                </div>
                <CardTitle className="font-headline tracking-tight leading-tight">{ad.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
                 <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                        {ad.type === 'image' ? <FileImage className="mr-1.5 h-3 w-3"/> : <Video className="mr-1.5 h-3 w-3"/>}
                        {ad.type}
                    </Badge>
                    {ad.type === 'image' && ad.duration && <Badge variant="secondary">{ad.duration}s</Badge>}
                </div>
                <CardDescription className="text-xs truncate ">{ad.url}</CardDescription>
                {ad.tags && ad.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {ad.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                    </div>
                )}
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-2">
                 <Button variant="outline" onClick={onEdit}>
                    <Pencil className="mr-2" />
                    Edit
                </Button>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">
                            <Trash2 className="mr-2" />
                            Delete
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the ad <strong>{ad.name}</strong>. This action cannot be undone and it might affect playlists using this ad.
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
