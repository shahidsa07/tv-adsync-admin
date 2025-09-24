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
import { BarcodeScanner } from 'react-zxing';

interface AddTvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTvDialog({ open, onOpenChange }: AddTvDialogProps) {
  const [tvId, setTvId] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("manual");
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (activeTab === 'qr' && open) {
      const getCameraPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately, react-zxing will ask for it again.
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
    }
  }, [activeTab, open, toast]);


  const handleRegister = (id: string) => {
    if (!id || !id.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'TV ID cannot be empty.' });
      return;
    }
    startTransition(async () => {
      const result = await registerTvAction(id.trim());
      if (result.success) {
        toast({ title: 'Success', description: result.message });
        setTvId('');
        onOpenChange(false);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleRegister(tvId);
  };

  const handleQrResult = (result: any) => {
    if (result && !isPending) {
        const id = result.getText();
        handleRegister(id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
            setActiveTab("manual");
        }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Add a New TV</DialogTitle>
          <DialogDescription>
            Register a new TV by entering its unique ID or scanning a QR code.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual"><Text className="mr-2" />Manual</TabsTrigger>
                <TabsTrigger value="qr"><QrCode className="mr-2" />QR Code</TabsTrigger>
            </TabsList>
            <TabsContent value="manual" className="py-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="tvId" className="text-left">
                            TV Unique ID
                        </Label>
                        <Input
                            id="tvId"
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
              <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
                {activeTab === 'qr' && hasCameraPermission === true && (
                    <BarcodeScanner
                        onResult={handleQrResult}
                        onError={(error) => {
                            if (error) {
                                console.info(error);
                            }
                        }}
                    />
                )}
                 {hasCameraPermission === false && (
                    <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                        <VideoOff className="mb-4 h-12 w-12 text-muted-foreground" />
                        <h3 className="font-semibold">Camera Access Denied</h3>
                        <p className="text-sm text-muted-foreground">Please grant camera permissions in your browser settings to use the QR scanner.</p>
                    </div>
                 )}
                 {hasCameraPermission === undefined && (
                     <div className="flex h-full flex-col items-center justify-center">
                         <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                     </div>
                 )}
              </div>
               <Alert className="mt-4">
                  <QrCode className="h-4 w-4" />
                  <AlertTitle>Scan QR Code</AlertTitle>
                  <AlertDescription>
                    Point your camera at the QR code displayed on the TV screen.
                  </AlertDescription>
                </Alert>
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
