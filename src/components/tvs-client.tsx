"use client";

import type { TV, Group } from "@/lib/definitions";
import { useState, useMemo } from "react";
import { TvCard } from "./tv-card";
import { Button } from "./ui/button";

interface TvsClientProps {
  initialTvs: TV[];
  initialGroups: Group[];
}

type FilterType = "all" | "assigned" | "unassigned";

export function TvsClient({ initialTvs, initialGroups }: TvsClientProps) {
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredTvs = useMemo(() => {
    if (filter === "assigned") {
      return initialTvs.filter((tv) => !!tv.groupId);
    }
    if (filter === "unassigned") {
      return initialTvs.filter((tv) => !tv.groupId);
    }
    return initialTvs;
  }, [initialTvs, filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">All TVs ({initialTvs.length})</h1>
          <p className="text-muted-foreground">
            A complete list of all registered TVs in your system.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-muted p-1">
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
            No TVs match the current filter.
          </p>
        </div>
      )}
    </div>
  );
}
