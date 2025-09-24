import { getTvs, getGroups } from '@/lib/data';
import { Header } from '@/components/header';
import { TvCard } from '@/components/tv-card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function TvsPage() {
  const tvs = await getTvs();
  const groups = await getGroups();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
           <div>
             <Button asChild variant="outline" size="sm" className="mb-2">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            <h1 className="text-3xl font-bold font-headline">All TVs ({tvs.length})</h1>
            <p className="text-muted-foreground">A complete list of all registered TVs in your system.</p>
           </div>
        </div>
        
        {tvs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tvs.map(tv => (
              <TvCard key={tv.tvId} tv={tv} groups={groups} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">No TVs have been registered yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}
