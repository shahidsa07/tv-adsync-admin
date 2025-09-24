"use client";

import type { Playlist, Ad } from "@/lib/definitions";
import { useState, useTransition, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import Image from "next/image";
import { FileImage, Video, GripVertical, Trash2, Search, Loader2 } from "lucide-react";
import { updatePlaylistAdsAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "./ui/badge";

interface PlaylistEditorClientProps {
    initialPlaylist: Playlist;
    allAds: Ad[];
}

export function PlaylistEditorClient({ initialPlaylist, allAds }: PlaylistEditorClientProps) {
    const [playlist, setPlaylist] = useState(initialPlaylist);
    const [selectedAdIds, setSelectedAdIds] = useState<string[]>(initialPlaylist.adIds);
    const [searchTerm, setSearchTerm] = useState("");
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const filteredAds = useMemo(() => {
        return allAds.filter(ad => ad.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [allAds, searchTerm]);

    const playlistAds = useMemo(() => {
        const adMap = new Map(allAds.map(ad => [ad.id, ad]));
        return selectedAdIds.map(id => adMap.get(id)).filter((ad): ad is Ad => !!ad);
    }, [selectedAdIds, allAds]);
    
    const handleAdToggle = (adId: string) => {
        setSelectedAdIds(prev =>
            prev.includes(adId) ? prev.filter(id => id !== adId) : [...prev, adId]
        );
    };

    const handleSave = () => {
        startTransition(async () => {
            const result = await updatePlaylistAdsAction(playlist.id, selectedAdIds);
            if (result.success) {
                toast({ title: "Success", description: "Playlist saved successfully." });
                setPlaylist(prev => ({ ...prev, adIds: selectedAdIds }));
            } else {
                toast({ variant: 'destructive', title: "Error", description: result.message });
            }
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">{playlist.name}</h1>
                    <p className="text-muted-foreground">Select ads from the library to build your playlist.</p>
                </div>
                <Button onClick={handleSave} disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Playlist
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Ad Library Column */}
                <Card>
                    <CardHeader>
                        <CardTitle>Ad Library</CardTitle>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search ads..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[60vh] pr-4">
                            <div className="space-y-4">
                                {filteredAds.map(ad => (
                                    <div key={ad.id} className="flex items-start gap-4 rounded-lg border p-3">
                                        <Checkbox
                                            id={`ad-${ad.id}`}
                                            checked={selectedAdIds.includes(ad.id)}
                                            onCheckedChange={() => handleAdToggle(ad.id)}
                                            className="mt-1"
                                        />
                                        <div className="grid gap-1.5 flex-1">
                                            <Label htmlFor={`ad-${ad.id}`} className="font-semibold cursor-pointer">{ad.name}</Label>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-xs">
                                                    {ad.type === 'image' ? <FileImage className="mr-1.5 h-3 w-3"/> : <Video className="mr-1.5 h-3 w-3"/>}
                                                    {ad.type}
                                                </Badge>
                                                {ad.type === 'image' && ad.duration && <Badge variant="secondary">{ad.duration}s}</Badge>}
                                            </div>
                                        </div>
                                        <div className="w-24 h-16 bg-muted rounded-md overflow-hidden relative">
                                            {ad.type === 'image' ? (
                                                <Image src={ad.url} alt={ad.name} layout="fill" objectFit="cover" />
                                            ) : (
                                                <div className="flex items-center justify-center h-full bg-muted">
                                                    <Video className="h-8 w-8 text-muted-foreground"/>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {filteredAds.length === 0 && <p className="text-sm text-center text-muted-foreground py-10">No ads found.</p>}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Playlist Column */}
                <Card>
                    <CardHeader>
                        <CardTitle>Current Playlist ({playlistAds.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[60vh] pr-4">
                            {playlistAds.length > 0 ? (
                                <div className="space-y-2">
                                    {playlistAds.map(ad => (
                                        <div key={ad.id} className="flex items-center gap-2 p-2 rounded-md bg-background border">
                                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                                            {ad.type === 'image' ? <FileImage className="h-5 w-5 text-primary" /> : <Video className="h-5 w-5 text-primary" />}
                                            <span className="flex-1 text-sm truncate font-medium">{ad.name}</span>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleAdToggle(ad.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-center border-2 border-dashed rounded-lg">
                                    <p className="text-muted-foreground">Select ads from the library to add them to this playlist.</p>
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
