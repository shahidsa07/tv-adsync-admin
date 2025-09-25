
import { getTvs, getGroups } from '@/lib/data';
import { Header } from '@/components/header';
import { TvsClient } from '@/components/tvs-client';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TvsPage() {
  const tvs = await getTvs();
  const groups = await getGroups();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mb-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
        <TvsClient initialTvs={tvs} initialGroups={groups} />
      </main>
    </div>
  );
}
