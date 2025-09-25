"use client";

import type { AdPerformanceData, AnalyticsSettings } from "@/lib/definitions";
import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { setAnalyticsTrackingAction } from "@/lib/actions";
import { Loader2, BarChart3, Clock, Tv, Play } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";

interface AdAnalyticsClientProps {
    initialPerformanceData: AdPerformanceData[];
    initialSettings: AnalyticsSettings;
}

export function AdAnalyticsClient({ initialPerformanceData, initialSettings }: AdAnalyticsClientProps) {
    const [settings, setSettings] = useState(initialSettings);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleTrackingToggle = (isEnabled: boolean) => {
        startTransition(async () => {
            const result = await setAnalyticsTrackingAction(isEnabled);
            if (result.success) {
                setSettings({ isTrackingEnabled: isEnabled });
                toast({ title: "Success", description: result.message });
            } else {
                toast({ variant: "destructive", title: "Error", description: result.message });
            }
        });
    };

    const formatPlaytime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        
        let result = '';
        if (hours > 0) result += `${hours}h `;
        if (minutes > 0) result += `${minutes}m `;
        if (remainingSeconds > 0 || result === '') result += `${remainingSeconds}s`;

        return result.trim();
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Ad Analytics</h1>
                    <p className="text-muted-foreground">Track ad performance across your network of TVs.</p>
                </div>
                <Card className="p-4 flex items-center justify-between gap-4">
                    <Label htmlFor="tracking-switch" className="font-semibold">
                        Ad Tracking Enabled
                    </Label>
                    <div className="flex items-center gap-2">
                        <Switch
                            id="tracking-switch"
                            checked={settings.isTrackingEnabled}
                            onCheckedChange={handleTrackingToggle}
                            disabled={isPending}
                        />
                        {isPending && <Loader2 className="h-5 w-5 animate-spin" />}
                    </div>
                </Card>
            </div>
            
            {settings.isTrackingEnabled ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Ad Performance</CardTitle>
                        <CardDescription>
                            Summary of ad performance based on recorded playback data. Data is updated on page load.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {initialPerformanceData.length > 0 ? (
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ad Name</TableHead>
                                        <TableHead className="text-right">Total Playtime</TableHead>
                                        <TableHead className="text-right">Unique TVs Reached</TableHead>
                                        <TableHead className="text-right">Total Plays</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {initialPerformanceData.map(ad => (
                                        <TableRow key={ad.adId}>
                                            <TableCell className="font-medium">{ad.adName}</TableCell>
                                            <TableCell className="text-right">{formatPlaytime(ad.totalPlaytime)}</TableCell>
                                            <TableCell className="text-right">{ad.uniqueTvs}</TableCell>
                                            <TableCell className="text-right">{ad.playCount}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-10 border-2 border-dashed rounded-lg">
                                <p className="text-muted-foreground">No ad performance data has been recorded yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
                 <Card className="text-center py-16 px-6">
                    <CardContent className="space-y-4">
                         <div className="flex justify-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                <BarChart3 className="h-6 w-6 text-muted-foreground" />
                            </div>
                        </div>
                        <h3 className="text-xl font-semibold font-headline">Tracking is Disabled</h3>
                        <p className="text-muted-foreground">
                            Ad performance tracking is currently turned off. To start collecting data, please enable the "Ad Tracking Enabled" switch above.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
