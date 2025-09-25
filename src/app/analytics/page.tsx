import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getAdPerformance, getAnalyticsSettings } from '@/lib/data';
import { AdAnalyticsClient } from '@/components/ad-analytics-client';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const performanceData = await getAdPerformance();
  const settings = await getAnalyticsSettings();

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
        <AdAnalyticsClient initialPerformanceData={performanceData} initialSettings={settings} />
      </main>
    </div>
  );
}
