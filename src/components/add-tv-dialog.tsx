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
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';

const qrcodeRegionId = "html5qr-code-full-region";

const Html5QrcodePlugin = ({ onScanSuccess, onScanFailure }: { onScanSuccess: (decodedText: string) => void, onScanFailure: (error: string) => void }) => {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // cleanup function when component will unmount
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => {
                    console.error("Failed to clear html5QrcodeScanner. ", error);
                });
            }
        };
    }, []);

    useEffect(() => {
        if (!scannerRef.current) {
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                rememberLastUsedCamera: true,
            };
            const html5QrcodeScanner = new Html5QrcodeScanner(qrcodeRegionId, config, false);
            
            const handleSuccess = (decodedText: string, decodedResult: any) => {
                onScanSuccess(decodedText);
            };

            const handleError = (errorMessage: string) => {
                onScanFailure(errorMessage);
            };
            
            html5QrcodeScanner.render(handleSuccess, handleError);
            scannerRef.current = html5QrcodeScanner;
        }
    }, [onScanSuccess, onScanFailure]);

    return <div id={qrcodeRegionId} className="w-full" />;
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
  const html5QrcodeScannerRef = useRef<Html5Qrcode | null>(null);

  const stopCamera = useCallback(() => {
    if (html5QrcodeScannerRef.current && html5QrcodeScannerRef.current.isScanning) {
      html5QrcodeScannerRef.current.stop().then(() => {
        console.log("QR Code scanning stopped.");
      }).catch(err => {
        console.error("Failed to stop QR Code scanner.", err);
      });
    }
  }, []);

  const handleDialogClose = (isOpen: boolean) => {
    if (!isOpen) {
        if(activeTab === 'qr'){
            stopCamera();
        }
        setActiveTab("manual");
    }
    onOpenChange(isOpen);
  }

  const handleTabChange = (value: string) => {
      if (value !== 'qr') {
          stopCamera();
      }
      setActiveTab(value);
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

  const onScanSuccess = useCallback((decodedText: string) => {
    setTvId(decodedText);
    toast({ title: 'QR Code Scanned', description: `TV ID set to ${decodedText}` });
    stopCamera();
    setActiveTab('manual');
  }, [toast, stopCamera]);
  
  const onScanFailure = useCallback((error: string) => {
     // console.warn(`QR scan error: ${error}`);
  }, []);

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
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mt-4">
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
                  {activeTab === 'qr' && <Html5QrcodePlugin onScanSuccess={onScanSuccess} onScanFailure={onScanFailure} />}
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
