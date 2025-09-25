"use client";

import type { AdPerformanceData, AdPerformanceDataPeriod, AnalyticsSettings } from "@/lib/definitions";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { setAnalyticsTrackingAction } from "@/lib/actions";
import { Loader2, BarChart3, Clock, Tv, Play } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";

interface AdAnalyticsClientProps {
    initialPerformanceData: AdPerformanceData[];
    initialSettings: AnalyticsSettings;
    currentFilter: AdPerformanceDataPeriod;
}

export function AdAnalyticsClient({ initialPerformanceData, initialSettings, currentFilter }: AdAnalyticsClientProps) {
    const [settings, setSettings] = useState(initialSettings);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

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

    const handleFilterChange = (filter: AdPerformanceDataPeriod) => {
        router.push(`/analytics?filter=${filter}`);
    };

    const formatPlaytime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.round(seconds % 60);
        
        let result = '';
        if (hours > 0) result += `${hours}h `;
        if (minutes > 0) result += `${minutes}m `;
        if (remainingSeconds > 0 || result === '') result += `${remainingSeconds}s`;

        return result.trim() || '0s';
    }

    const filters: { label: string; value: AdPerformanceDataPeriod }[] = [
        { label: "Today", value: "today" },
        { label: "This Week", value: "week" },
        { label: "This Month", value: "month" },
        { label: "This Year", value: "year" },
        { label: "All Time", value: "all" },
    ];

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
            
            <Card>
                <CardHeader>
                    <CardTitle>Ad Performance</CardTitle>
                    <CardDescription>
                        Summary of ad performance based on recorded playback data.
                        {!settings.isTrackingEnabled && " Note: Tracking is currently disabled, so no new data will be recorded."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-center gap-2 mb-4 rounded-lg bg-muted p-1 w-full sm:w-auto">
                        {filters.map(filter => (
                             <Button
                                key={filter.value}
                                variant={currentFilter === filter.value ? "default" : "ghost"}
                                size="sm"
                                onClick={() => handleFilterChange(filter.value)}
                                className="flex-1 justify-center"
                            >
                                {filter.label}
                            </Button>
                        ))}
                    </div>
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
                            <p className="text-muted-foreground">No ad performance data recorded for this period.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
