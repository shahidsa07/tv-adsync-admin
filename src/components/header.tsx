"use client";

import { Monitor, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export function Header() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = async () => {
    startTransition(async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
        router.refresh();
    });
  };

  return (
    <header className="sticky top-0 z-30 flex h-auto items-center justify-between gap-4 border-b bg-card/80 px-4 py-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Monitor className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold font-headline text-foreground">NextAds</h1>
      </div>
      <Button variant="outline" size="sm" onClick={handleLogout} disabled={isPending}>
        <LogOut className="mr-2 h-4 w-4"/>
        Logout
      </Button>
    </header>
  );
}
