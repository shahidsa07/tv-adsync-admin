"use client";

import type { Group, Ad } from "@/lib/definitions";
import { useState, useTransition } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Plus, Trash2, GripVertical, FileImage, Video, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateGroupAdsAction } from "@/lib/actions";

interface AdPlaylistEditorProps {
    group: Group;
}

export function AdPlaylistEditor({ group }: AdPlaylistEditorProps) {
    const [ads, setAds] = useState<Ad[]>(group.ads);
    const [newAd, setNewAd] = useState<{ type: 'image' | 'video', url: string, duration?: number }>({ type: 'image', url: '', duration: 15 });
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const addAd = () => {
        if (!newAd.url.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Ad URL cannot be empty.' });
            return;
        }
        setAds([...ads, { ...newAd, id: `new-${Date.now()}`, order: ads.length + 1 }]);
        setNewAd({ type: 'image', url: '', duration: 15 });
    };

    const removeAd = (id: string) => {
        setAds(ads.filter(ad => ad.id !== id));
    };

    const handleSave = () => {
        startTransition(async () => {
            const result = await updateGroupAdsAction(group.id, ads);
            if(result.success) {
                toast({ title: "Success", description: result.message });
            } else {
                toast({ variant: "destructive", title: "Error", description: result.message });
            }
        });
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <h4 className="font-semibold">Current Playlist</h4>
                <div className="space-y-2 rounded-lg border p-2 min-h-[100px]">
                    {ads.sort((a,b) => a.order - b.order).map(ad => (
                        <div key={ad.id} className="flex items-center gap-2 p-2 rounded-md bg-background hover:bg-muted/80">
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                            {ad.type === 'image' ? <FileImage className="h-5 w-5 text-primary" /> : <Video className="h-5 w-5 text-primary" />}
                            <span className="flex-1 text-sm truncate">{ad.url}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeAd(ad.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    {ads.length === 0 && <p className="text-sm text-center text-muted-foreground p-4">No ads in this playlist.</p>}
                </div>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
                <h4 className="font-semibold">Add New Ad</h4>
                <div className="space-y-2">
                    <Label>Type</Label>
                    <RadioGroup
                        value={newAd.type}
                        onValueChange={(value: 'image' | 'video') => setNewAd({ ...newAd, type: value })}
                        className="flex gap-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="image" id="image" />
                            <Label htmlFor="image">Image</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="video" id="video" />
                            <Label htmlFor="video">Video</Label>
                        </div>
                    </RadioGroup>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="url">URL</Label>
                    <Input id="url" value={newAd.url} onChange={e => setNewAd({...newAd, url: e.target.value})} placeholder="https://example.com/ad.jpg" />
                </div>
                {newAd.type === 'image' && (
                    <div className="space-y-2">
                        <Label htmlFor="duration">Duration (seconds)</Label>
                        <Input id="duration" type="number" value={newAd.duration} onChange={e => setNewAd({...newAd, duration: parseInt(e.target.value)})} placeholder="15" />
                    </div>
                )}
                 <Button size="sm" variant="outline" onClick={addAd} className="w-full">
                    <Plus className="mr-2 h-4 w-4"/>
                    Add to Playlist
                </Button>
            </div>
            
            <Button onClick={handleSave} disabled={isPending} className="w-full">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Playlist
            </Button>
        </div>
    );
}
