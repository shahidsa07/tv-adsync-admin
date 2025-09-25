"use client";

import { useState, useTransition, useCallback, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { registerTvAction } from '@/lib/actions';
import { Loader2, QrCode, Text, Video, Camera } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { ScrollArea } from './ui/scroll-area';
import { Html5QrcodeScanner } from 'html5-qrcode';

const qrcodeRegionId = "html5qr-code-full-region";

const Html5QrcodePlugin = ({ onScanSuccess }: { onScanSuccess: (decodedText: string) => void }) => {
    useEffect(() => {
        const html5QrcodeScanner = new Html5QrcodeScanner(
            qrcodeRegionId,
            { fps: 10, qrbox: 250, aspectRatio: 1.0 },
            /* verbose= */ false
        );

        const handleSuccess = (decodedText: string, decodedResult: any) => {
            onScanSuccess(decodedText);
            html5QrcodeScanner.clear();
        };

        const handleError = (errorMessage: string) => {
            // handle scan error, usually ignore
        };

        html5QrcodeScanner.render(handleSuccess, handleError);

        return () => {
            html5QrcodeScanner.clear().catch(error => {
                console.error("Failed to clear html5QrcodeScanner. ", error);
            });
        };
    }, [onScanSuccess]);

    return <div id={qrcodeRegionId} />;
};


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


  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) {
        setActiveTab("manual");
    }
    onOpenChange(isOpen);
  }

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

  const onScanSuccess = (decodedText: string) => {
    setTvId(decodedText);
    toast({ title: 'QR Code Scanned', description: `TV ID set to ${decodedText}` });
  };
  
  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <ScrollArea className="max-h-[85vh]">
          <div className='p-6'>
            <DialogHeader>
              <DialogTitle className="font-headline">Add a New TV</DialogTitle>
              <DialogDescription>
                Register a new TV by entering its unique ID or scanning a QR code.
              </DialogDescription>
            </DialogHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
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
                  {activeTab === 'qr' && <Html5QrcodePlugin onScanSuccess={onScanSuccess} />}
                  <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
                            onChange={(e) => setTvId(e.target.value)}
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
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
