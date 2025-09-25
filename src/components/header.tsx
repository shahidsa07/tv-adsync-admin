import { Monitor } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-auto items-center gap-4 border-b bg-card/80 px-4 py-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Monitor className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold font-headline text-foreground">NextAds</h1>
      </div>
    </header>
  );
}
