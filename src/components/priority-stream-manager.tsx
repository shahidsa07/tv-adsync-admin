"use client";

import type { Group, PriorityStream } from "@/lib/definitions";
import { useState, useTransition } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { PlayCircle, StopCircle, Youtube, Video, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { startPriorityStreamAction, stopPriorityStreamAction } from "@/lib/actions";
import { Badge } from "./ui/badge";

interface PriorityStreamManagerProps {
    group: Group;
    onStreamChange: (stream: PriorityStream | null) => void;
}

export function PriorityStreamManager({ group, onStreamChange }: PriorityStreamManagerProps) {
    const [stream, setStream] = useState<PriorityStream>({ type: 'youtube', url: '' });
    const [isStarting, startStartingTransition] = useTransition();
    const [isStopping, startStoppingTransition] = useTransition();
    const { toast } = useToast();

    const handleStart = () => {
        if (!stream.url.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Stream URL cannot be empty.' });
            return;
        }
        startStartingTransition(async () => {
            const result = await startPriorityStreamAction(group.id, stream);
            if (result.success) {
                toast({ title: 'Success', description: result.message });
                onStreamChange(stream);
                setStream({ type: 'youtube', url: '' }); // Clear input form
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };

    const handleStop = () => {
        startStoppingTransition(async () => {
            const result = await stopPriorityStreamAction(group.id);
            if (result.success) {
                toast({ title: 'Success', description: result.message });
                onStreamChange(null);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
        });
    };
    
    return (
        <div className="space-y-4">
            {group.priorityStream ? (
                <div className="space-y-3 p-4 border rounded-lg bg-primary/10">
                    <div className="flex items-center justify-between">
                        <p className="font-semibold">Stream Active</p>
                        <Badge variant="outline" className="border-primary text-primary">
                            {group.priorityStream.type === 'youtube' ? <Youtube className="mr-2 h-4 w-4" /> : <Video className="mr-2 h-4 w-4" />}
                            {group.priorityStream.type}
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{group.priorityStream.url}</p>
                    <Button variant="destructive" size="sm" className="w-full" onClick={handleStop} disabled={isStopping}>
                        {isStopping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <StopCircle className="mr-2 h-4 w-4" />}
                        Stop Stream
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground text-center">No active priority stream.</p>
                     <div className="space-y-2">
                        <Label>Type</Label>
                        <RadioGroup
                            value={stream.type}
                            onValueChange={(value: 'video' | 'youtube') => setStream({ ...stream, type: value })}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="youtube" id="youtube" />
                                <Label htmlFor="youtube">YouTube</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="video" id="video" />
                                <Label htmlFor="video">Video URL</Label>
                            </div>
                        </RadioGroup>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="stream-url">URL</Label>
                        <Input id="stream-url" value={stream.url} onChange={e => setStream({...stream, url: e.target.value})} placeholder="https://youtube.com/embed/..." />
                    </div>
                    <Button size="sm" className="w-full" onClick={handleStart} disabled={isStarting}>
                        {isStarting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                        Start Stream
                    </Button>
                </div>
            )}
        </div>
    );
}
