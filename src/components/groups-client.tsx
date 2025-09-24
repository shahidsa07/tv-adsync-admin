"use client"

import type { TV, Group } from '@/lib/definitions';
import { useState } from 'react';
import { GroupCard } from './group-card';
import { CreateGroupDialog } from './create-group-dialog';
import { Button } from './ui/button';
import { PlusCircle } from 'lucide-react';

interface GroupsClientProps {
  initialTvs: TV[];
  initialGroups: Group[];
}

export function GroupsClient({ initialTvs, initialGroups }: GroupsClientProps) {
  const [tvs] = useState(initialTvs);
  const [groups] = useState(initialGroups);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className='space-y-1'>
            <h1 className="text-3xl font-bold font-headline">TV Groups</h1>
            <p className="text-muted-foreground">Organize your displays into groups for targeted content.</p>
          </div>
          <Button variant="outline" onClick={() => setShowCreateGroupDialog(true)}>
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
      <CreateGroupDialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog} />
    </div>
  );
}
