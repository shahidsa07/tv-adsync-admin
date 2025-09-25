import { Header } from '@/components/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function Loading() {
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
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-5 w-80 mt-1" />
                </div>
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-80" />
                    <Button variant="outline" disabled>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add TV
                    </Button>
                </div>
            </div>
             <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <Skeleton className="h-60 rounded-lg" />
                <Skeleton className="h-60 rounded-lg" />
                <Skeleton className="h-60 rounded-lg" />
                <Skeleton className="h-60 rounded-lg" />
                <Skeleton className="h-60 rounded-lg" />
                <Skeleton className="h-60 rounded-lg" />
            </div>
        </div>
      </main>
    </div>
  );
}
