"use client"

import type { TV, Group } from '@/lib/definitions';
import { useState } from 'react';
import { TvCard } from './tv-card';
import { Button } from './ui/button';
import { PlusCircle } from 'lucide-react';
import { AddTvDialog } from './add-tv-dialog';

interface DashboardClientProps {
  initialTvs: TV[];
  initialGroups: Group[];
}

export function DashboardClient({ initialTvs, initialGroups }: DashboardClientProps) {
  const [tvs] = useState(initialTvs);
  const [groups] = useState(initialGroups);
  const [showAddTvDialog, setShowAddTvDialog] = useState(false);

  const unassignedTvs = tvs.filter(tv => !tv.groupId);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
            <div className='space-y-1'>
                <h1 className="text-3xl font-bold font-headline">Unassigned TVs</h1>
                <p className="text-muted-foreground">These TVs are online but not assigned to any group.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowAddTvDialog(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add TV
            </Button>
        </div>
        {unassignedTvs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {unassignedTvs.map(tv => (
              <TvCard key={tv.tvId} tv={tv} groups={groups} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">No unassigned TVs found.</p>
          </div>
        )}
      </div>

      <AddTvDialog open={showAddTvDialog} onOpenChange={setShowAddTvDialog} />
    </div>
  );
}
