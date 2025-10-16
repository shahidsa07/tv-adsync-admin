
"use client";

import type { Group, TV, Playlist, PriorityStream } from "@/lib/definitions";
import { useState, useTransition } from "react";
import { Button } from "./ui/button";
import { Users, Clapperboard, MonitorPlay, Loader2 } from 'lucide-react';
import { ManageGroupTvsDialog } from "./manage-group-tvs-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { PriorityStreamManager } from "./priority-stream-manager";
import { TvCard } from "./tv-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { updateGroupPlaylistAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { ScrollArea } from "./ui/scroll-area";

interface GroupDetailsClientProps {
    initialGroup: Group;
    allTvs: TV[];
    allPlaylists: Playlist[];
}

export function GroupDetailsClient({ initialGroup, allTvs, allPlaylists }: GroupDetailsClientProps) {
    const [group, setGroup] = useState(initialGroup);
    const [showManageTvs, setShowManageTvs] = useState(false);
    const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(group.playlistId ?? null);
    const [isPlaylistPending, startPlaylistTransition] = useTransition();
    const { toast } = useToast();
    

    const assignedTvs = allTvs.filter(tv => tv.groupId === group.id);
    const currentPlaylist = allPlaylists.find(p => p.id === group.playlistId);

    const handleApplyPlaylistChange = () => {
        startPlaylistTransition(async () => {
            const result = await updateGroupPlaylistAction(group.id, selectedPlaylistId);
            if (result.success) {
                toast({ title: "Success", description: "Playlist updated for this group."});
                setGroup(prev => ({...prev, playlistId: selectedPlaylistId }));
            } else {
                toast({ variant: 'destructive', title: "Error", description: result.message });
                // Revert selection on failure
                setSelectedPlaylistId(group.playlistId);
            }
        });
    }

    const handleStreamChange = (stream: PriorityStream | null) => {
        setGroup(prev => ({ ...prev, priorityStream: stream }));
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <h1 className="text-3xl font-bold font-headline">{group.name}</h1>
                <Button onClick={() => setShowManageTvs(true)}>
                    <Users className="mr-2 h-4 w-4"/>
                    Manage TVs
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-headline">
                                <MonitorPlay className="h-6 w-6" /> Priority Stream
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PriorityStreamManager group={group} onStreamChange={handleStreamChange} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-headline">
                                <Clapperboard className="h-6 w-6" /> Ad Playlist
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="playlist-select">Active Playlist</Label>
                                <div className="flex gap-2">
                                    <Select value={selectedPlaylistId ?? 'none'} onValueChange={(value) => setSelectedPlaylistId(value === 'none' ? null : value)} disabled={isPlaylistPending}>
                                        <SelectTrigger id="playlist-select">
                                            <SelectValue placeholder="Select a playlist..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No Playlist</SelectItem>
                                            {allPlaylists.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={handleApplyPlaylistChange} disabled={isPlaylistPending || selectedPlaylistId === group.playlistId}>
                                        {isPlaylistPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Apply
                                    </Button>
                                </div>
                            </div>
                            
                            {currentPlaylist && (
                                <div className="p-3 border rounded-lg bg-muted/50 space-y-2">
                                    <h4 className="font-semibold">{currentPlaylist.name}</h4>
                                    <p className="text-sm text-muted-foreground">{currentPlaylist.adIds.length} ad(s) in this playlist.</p>
                                    <Button asChild size="sm" variant="outline" className="w-full">
                                        <Link href={`/playlists/${currentPlaylist.id}`}>
                                            Edit Playlist
                                        </Link>
                                    </Button>
                                </div>
                            )}
                            {!currentPlaylist && !isPlaylistPending && (
                                <p className="text-sm text-center text-muted-foreground pt-4">No playlist assigned to this group.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
                
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-2xl font-headline font-semibold">Assigned TVs ({assignedTvs.length})</h2>
                    <ScrollArea className="h-[calc(100vh-18rem)] pr-4">
                        {assignedTvs.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                                {assignedTvs.map(tv => (
                                    <TvCard key={tv.tvId} tv={tv} groups={[group]} showRemoveFromGroup={true} />
                                ))}
                            </div>
                        ) : (
                             <div className="text-center py-10 border-2 border-dashed rounded-lg h-full flex items-center justify-center">
                                <p className="text-muted-foreground">No TVs assigned to this group.</p>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </div>

            <ManageGroupTvsDialog
                open={showManageTvs}
                onOpenChange={setShowManageTvs}
                group={group}
                allTvs={allTvs}
            />
        </div>
    );
}
