"use client";

import { useState, useTransition, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { registerTvAction } from '@/lib/actions';
import { Loader2, QrCode, Text, VideoOff } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useZxing } from 'react-zxing';

interface AddTvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTvDialog({ open, onOpenChange }: AddTvDialogProps) {
  const [tvId, setTvId] = useState('');
  const [tvName, setTvName] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("manual");
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | undefined>(undefined);
  const [isPaused, setIsPaused] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { ref } = useZxing({
    paused: isPaused || activeTab !== 'qr' || !open,
    onResult(result) {
      if (!isPending) {
        const id = result.getText();
        setTvId(id);
        toast({ title: 'QR Code Scanned', description: `TV ID: ${id}` });
        // The user now needs to enter a name and submit.
      }
    },
    onDecodeError(error) {
      if (error) {
        console.info(error);
      }
    },
  });

  useEffect(() => {
    // Manually assign the ref to both refs.
    if (ref) {
      ref.current = videoRef.current;
    }
  }, [ref]);


  useEffect(() => {
    if (activeTab === 'qr' && open) {
      setIsPaused(false);
      const getCameraPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
            setHasCameraPermission(true);
        } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            if (error instanceof DOMException && error.name === 'NotAllowedError') {
              toast({
                  variant: 'destructive',
                  title: 'Camera Access Denied',
                  description: 'Please enable camera permissions in your browser settings to use this feature.',
              });
            }
        }
      };
      getCameraPermission();
    } else {
      setIsPaused(true);
    }
  }, [activeTab, open, toast]);


  const handleRegister = (id: string, name: string) => {
    if (!id || !id.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'TV ID cannot be empty.' });
      return;
    }
     if (!name || !name.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'TV Name cannot be empty.' });
      return;
    }
    startTransition(async () => {
      const result = await registerTvAction(id.trim(), name.trim());
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        setTvId('');
        setTvName('');
        onOpenChange(false);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleRegister(tvId, tvName);
  };
  
  const handleTabChange = (value: string) => {
    setTvId('');
    setTvName('');
    setActiveTab(value);
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
            handleTabChange("manual");
        }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Add a New TV</DialogTitle>
          <DialogDescription>
            Register a new TV by entering its unique ID or scanning a QR code.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual"><Text className="mr-2" />Manual</TabsTrigger>
                <TabsTrigger value="qr"><QrCode className="mr-2" />QR Code</TabsTrigger>
            </TabsList>
            <TabsContent value="manual" className="py-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="tvNameManual" className="text-left">
                            TV Name
                        </Label>
                        <Input
                            id="tvNameManual"
                            value={tvName}
                            onChange={(e) => setTvName(e.target.value)}
                            placeholder="e.g., Lobby Entrance TV"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tvIdManual" className="text-left">
                            TV Unique ID
                        </Label>
                        <Input
                            id="tvIdManual"
                            value={tvId}
                            onChange={(e) => setTvId(e.target.value)}
                            placeholder="e.g., tv-lobby-main-001"
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending} className='w-full'>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Register TV
                        </Button>
                    </DialogFooter>
                </form>
            </TabsContent>
            <TabsContent value="qr" className="pt-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted mb-4">
                <video ref={videoRef} className="w-full h-full object-cover" />
                {hasCameraPermission === false && (
                    <div className="absolute inset-0 flex h-full flex-col items-center justify-center p-4 text-center bg-background/80">
                        <VideoOff className="mb-4 h-12 w-12 text-muted-foreground" />
                        <h3 className="font-semibold">Camera Access Denied</h3>
                        <p className="text-sm text-muted-foreground">Please grant camera permissions in your browser settings to use the QR scanner.</p>
                    </div>
                )}
                {hasCameraPermission === undefined && (
                     <div className="absolute inset-0 flex h-full flex-col items-center justify-center bg-background/80">
                         <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                     </div>
                )}
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Alert>
                    <QrCode className="h-4 w-4" />
                    <AlertTitle>Scan QR Code</AlertTitle>
                    <AlertDescription>
                        Point your camera at the QR code displayed on the TV screen. The ID will appear below.
                    </AlertDescription>
                </Alert>

                 <div className="space-y-2">
                    <Label htmlFor="tvNameQr">TV Name</Label>
                    <Input
                        id="tvNameQr"
                        value={tvName}
                        onChange={(e) => setTvName(e.target.value)}
                        placeholder="Enter TV name after scanning"
                        required
                    />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="tvIdQr">TV Unique ID (scanned)</Label>
                    <Input
                        id="tvIdQr"
                        value={tvId}
                        readOnly
                        placeholder="Scan QR code to populate"
                        className="bg-muted"
                    />
                </div>
                <DialogFooter>
                    <Button type="submit" disabled={isPending || !tvId} className='w-full'>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Register TV
                    </Button>
                </DialogFooter>
              </form>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
