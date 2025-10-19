'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

export function LogoutButton() {
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (res.ok) {
        toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
        router.push('/login');
        router.refresh();
      } else {
        throw new Error('Logout failed');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to log out.',
      });
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleLogout}>
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </Button>
  );
}
