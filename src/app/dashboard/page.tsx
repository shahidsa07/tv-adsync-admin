
import { getTvs, getGroups } from '@/lib/data';
import { DashboardClient } from '@/components/dashboard-client';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { seedInitialData } from '@/lib/seed';

export default async function DashboardPage() {
  await seedInitialData();
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
        <DashboardClient initialTvs={tvs} initialGroups={groups} />
      </main>
    </div>
  );
}
