"use client";

import type { TV, Group } from "@/lib/definitions";
import { useState, useMemo } from "react";
import { TvCard } from "./tv-card";
import { Button } from "./ui/button";
import { PlusCircle, Search } from "lucide-react";
import { AddTvDialog } from "./add-tv-dialog";
import { useWebSocket } from "@/hooks/use-websocket";
import { Input } from "./ui/input";

interface TvsClientProps {
  initialTvs: TV[];
  initialGroups: Group[];
}

type FilterType = "all" | "assigned" | "unassigned" | "online" | "offline";

export function TvsClient({ initialTvs, initialGroups }: TvsClientProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddTvDialog, setShowAddTvDialog] = useState(false);

  useWebSocket();

  const filteredTvs = useMemo(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    
    return initialTvs
      .filter((tv) => {
        switch (filter) {
          case "assigned":
            return !!tv.groupId;
          case "unassigned":
            return !tv.groupId;
          case "online":
            return !!tv.socketId;
          case "offline":
            return !tv.socketId;
          case "all":
          default:
            return true;
        }
      })
      .filter((tv) => {
        if (!lowercasedSearchTerm) return true;
        const nameMatch = tv.name.toLowerCase().includes(lowercasedSearchTerm);
        const locationMatch = tv.shopLocation?.toLowerCase().includes(lowercasedSearchTerm);
        return nameMatch || locationMatch;
      });
  }, [initialTvs, filter, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">All TVs ({initialTvs.length})</h1>
          <p className="text-muted-foreground">
            A complete list of all registered TVs in your system.
          </p>
        </div>
        <div className="flex flex-col items-end gap-4 w-full md:w-auto">
             <div className="relative w-full md:w-auto md:min-w-[300px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search name or location..."
                    className="pl-8 w-full bg-background"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted p-1 w-full sm:w-auto">
                    <Button
                        variant={filter === "all" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setFilter("all")}
                        className="flex-1 justify-center"
                    >
                        All
                    </Button>
                    <Button
                        variant={filter === "assigned" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setFilter("assigned")}
                        className="flex-1 justify-center"
                    >
                        Assigned
                    </Button>
                    <Button
                        variant={filter === "unassigned" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setFilter("unassigned")}
                        className="flex-1 justify-center"
                    >
                        Unassigned
                    </Button>
                    <Button
                        variant={filter === "online" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setFilter("online")}
                        className="flex-1 justify-center"
                    >
                        Online
                    </Button>
                    <Button
                        variant={filter === "offline" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setFilter("offline")}
                        className="flex-1 justify-center"
                    >
                        Offline
                    </Button>
                </div>
                <Button variant="outline" onClick={() => setShowAddTvDialog(true)} className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add TV
                </Button>
            </div>
        </div>
      </div>

      {filteredTvs.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTvs.map((tv) => (
            <TvCard key={tv.tvId} tv={tv} groups={initialGroups} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">
            No TVs match the current filters.
          </p>
        </div>
      )}
      <AddTvDialog open={showAddTvDialog} onOpenChange={setShowAddTvDialog} />
    </div>
  );
}
