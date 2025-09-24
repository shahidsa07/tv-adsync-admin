import { getTvs, getGroups } from '@/lib/data';
import { DashboardClient } from '@/components/dashboard-client';
import { Header } from '@/components/header';

export default async function Home() {
  const tvs = getTvs();
  const groups = getGroups();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <DashboardClient initialTvs={tvs} initialGroups={groups} />
      </main>
    </div>
  );
}
