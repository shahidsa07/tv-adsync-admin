import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clapperboard, Monitor, Tv, Users, ListVideo, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const features = [
    {
      title: 'TV Groups',
      description: 'View, create, and manage your TV groups.',
      href: '/groups',
      icon: <Users className="h-8 w-8" />,
    },
    {
      title: 'TVs',
      description: 'See a list of all registered TVs and their status.',
      href: '/tvs',
      icon: <Tv className="h-8 w-8" />,
    },
     {
      title: 'Ad Library',
      description: 'Manage your global advertising content and assets.',
      href: '/ads',
      icon: <Clapperboard className="h-8 w-8" />,
    },
     {
      title: 'Ad Playlists',
      description: 'Create and manage reusable playlists of ads.',
      href: '/playlists', 
      icon: <ListVideo className="h-8 w-8" />,
    },
    {
      title: 'Ad Analytics',
      description: 'Track ad performance and generate reports.',
      href: '/analytics',
      icon: <BarChart3 className="h-8 w-8" />,
    }
  ];

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mb-8">
            <h1 className="text-3xl font-bold font-headline">Welcome to NextAds</h1>
            <p className="text-muted-foreground">Select a feature below to get started.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Link key={feature.title} href={feature.href} className="block hover:shadow-lg transition-shadow duration-200 rounded-lg">
                <Card className="h-full hover:border-primary/80 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xl font-headline tracking-tight">{feature.title}</CardTitle>
                        {feature.icon}
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
