import { getGroupById, getTvs, getPlaylists } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Header } from '@/components/header';
import { GroupDetailsClient } from '@/components/group-details-client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default async function GroupDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = await getGroupById(id);
  const allTvs = await getTvs();
  const allPlaylists = await getPlaylists();

  if (!group) {
    notFound();
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mb-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/groups">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to TV Groups
            </Link>
          </Button>
        </div>
        <GroupDetailsClient initialGroup={group} allTvs={allTvs} allPlaylists={allPlaylists} />
      </main>
    </div>
  );
}
