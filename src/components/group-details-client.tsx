"use client";

import type { Group, TV } from "@/lib/definitions";
import { useState } from "react";
import { Button } from "./ui/button";
import { Users, Clapperboard, MonitorPlay } from 'lucide-react';
import { ManageGroupTvsDialog } from "./manage-group-tvs-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { AdPlaylistEditor } from "./ad-playlist-editor";
import { PriorityStreamManager } from "./priority-stream-manager";
import { TvCard } from "./tv-card";

interface GroupDetailsClientProps {
    initialGroup: Group;
    allTvs: TV[];
}

export function GroupDetailsClient({ initialGroup, allTvs }: GroupDetailsClientProps) {
    const [group, setGroup] = useState(initialGroup);
    const [showManageTvs, setShowManageTvs] = useState(false);

    const assignedTvs = allTvs.filter(tv => tv.groupId === group.id);

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
                            <PriorityStreamManager group={group} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-headline">
                                <Clapperboard className="h-6 w-6" /> Ad Playlist
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AdPlaylistEditor group={group} />
                        </CardContent>
                    </Card>
                </div>
                
                <div className="lg:col-span-2">
                    <h2 className="text-2xl font-headline font-semibold mb-4">Assigned TVs ({assignedTvs.length})</h2>
                    {assignedTvs.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {assignedTvs.map(tv => (
                                <TvCard key={tv.tvId} tv={tv} groups={[group]} />
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-10 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">No TVs assigned to this group.</p>
                        </div>
                    )}
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
