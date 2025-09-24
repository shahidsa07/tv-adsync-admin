"use client"

import type { TV, Group } from '@/lib/definitions';
import { useState } from 'react';
import { GroupCard } from './group-card';
import { TvCard } from './tv-card';
import { CreateGroupDialog } from './create-group-dialog';
import { Button } from './ui/button';
import { PlusCircle } from 'lucide-react';

interface DashboardClientProps {
  initialTvs: TV[];
  initialGroups: Group[];
}

export function DashboardClient({ initialTvs, initialGroups }: DashboardClientProps) {
  const [tvs] = useState(initialTvs);
  const [groups] = useState(initialGroups);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);

  const assignedTvs = tvs.filter(tv => tv.groupId);
  const unassignedTvs = tvs.filter(tv => !tv.groupId);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-headline font-semibold">Groups</h2>
          <Button variant="outline" size="sm" onClick={() => setShowCreateGroupDialog(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Group
          </Button>
        </div>
        {groups.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {groups.map(group => (
              <GroupCard key={group.id} group={group} tvCount={tvs.filter(tv => tv.groupId === group.id).length} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">No groups found. Create one to get started.</p>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-headline font-semibold mb-4">Unassigned TVs</h2>
        {unassignedTvs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {unassignedTvs.map(tv => (
              <TvCard key={tv.tvId} tv={tv} groups={groups} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">No unassigned TVs online.</p>
          </div>
        )}
      </div>

      <CreateGroupDialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog} />
    </div>
  );
}
