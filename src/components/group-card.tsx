import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tv } from 'lucide-react';

import type { Group } from '@/lib/definitions';

interface GroupCardProps {
  group: Group;
  tvCount: number;
}

export function GroupCard({ group, tvCount }: GroupCardProps) {
  return (
    <Link href={`/groups/${group.id}`} className="block hover:shadow-lg transition-shadow duration-200 rounded-lg">
      <Card className="h-full hover:border-primary/80 transition-colors">
        <CardHeader>
          <CardTitle className="font-headline tracking-tight">{group.name}</CardTitle>
          <CardDescription>Click to manage group</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-muted-foreground">
            <Tv className="mr-2 h-4 w-4" />
            <span>{tvCount} {tvCount === 1 ? 'TV' : 'TVs'} assigned</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
