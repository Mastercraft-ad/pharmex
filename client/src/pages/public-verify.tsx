import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ShieldCheck, QrCode, Search, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PublicVerifyPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [serialId, setSerialId] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const verifyMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", "/api/verify/public", { serialId: id });
    },
    onSuccess: (data) => {
      setVerificationResult(data);
    },
    onError: (error: any) => {
      toast({
        title: "Verification failed",
        description: error.message || "Failed to verify product",
        variant: "destructive",
      });
    },
  });

  const handleManualVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialId.trim()) {
      toast({
        title: "Serial ID required",
        description: "Please enter a serial ID",
        variant: "destructive",
      });
      return;
    }
    verifyMutation.mutate(serialId.trim());
  };

  const handleScanSuccess = (decodedText: string) => {
    setSerialId(decodedText);
    setIsScannerOpen(false);
    verifyMutation.mutate(decodedText);
  };

  useEffect(() => {
    if (isScannerOpen && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: 250 },
        false
      );
      scanner.render(handleScanSuccess, () => {});
      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    };
  }, [isScannerOpen]);

  const getResultIcon = () => {
    if (!verificationResult) return null;
    if (verificationResult.result === "authentic") {
      return <CheckCircle className="h-24 w-24 text-success" />;
    } else if (verificationResult.result === "warning") {
      return <AlertTriangle className="h-24 w-24 text-warning" />;
    } else {
      return <XCircle className="h-24 w-24 text-destructive" />;
    }
  };

  const getResultColor = () => {
    if (!verificationResult) return "";
    if (verificationResult.result === "authentic") return "bg-success/10 border-success/20";
    if (verificationResult.result === "warning") return "bg-warning/10 border-warning/20";
    return "bg-destructive/10 border-destructive/20";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">PharmaBlock Systems</h1>
              <p className="text-xs text-muted-foreground">Verify Medicine Authenticity</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setLocation("/login")}
            data-testid="button-login"
          >
            Sign In
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold text-foreground">Verify Your Medicine</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Protect yourself from counterfeit drugs. Scan the QR code or enter the serial ID
            to verify the authenticity of your medication.
          </p>
        </div>

        {/* Verification Methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* QR Scanner */}
          <Card className="hover-elevate cursor-pointer" onClick={() => setIsScannerOpen(true)}>
            <CardContent className="p-8 text-center">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <QrCode className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Scan QR Code</h3>
              <p className="text-sm text-muted-foreground">
                Use your camera to scan the QR code on the medicine package
              </p>
              <Button className="mt-4" data-testid="button-scan-qr">
                <QrCode className="h-4 w-4 mr-2" />
                Open Scanner
              </Button>
            </CardContent>
          </Card>

          {/* Manual Entry */}
          <Card>
            <CardHeader>
              <CardTitle>Manual Entry</CardTitle>
              <CardDescription>Enter the serial ID manually</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="serialId">Serial ID</Label>
                  <Input
                    id="serialId"
                    placeholder="e.g., DRUG-2024-ABC123"
                    value={serialId}
                    onChange={(e) => setSerialId(e.target.value)}
                    data-testid="input-serial-id"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={verifyMutation.isPending}
                  data-testid="button-verify"
                >
                  {verifyMutation.isPending ? (
                    "Verifying..."
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Verify Now
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Verification Result */}
        {verificationResult && (
          <Card className={`border-2 ${getResultColor()}`}>
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="flex justify-center">{getResultIcon()}</div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {verificationResult.result === "authentic" && "Verified Authentic"}
                    {verificationResult.result === "warning" && "Warning"}
                    {verificationResult.result === "counterfeit" && "Counterfeit Detected"}
                    {verificationResult.result === "unknown" && "Not Found"}
                  </h3>
                  <p className="text-muted-foreground">{verificationResult.message}</p>
                </div>

                {verificationResult.batch && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-left">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Drug Name</p>
                      <p className="text-base text-foreground">
                        {verificationResult.batch.drugName}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Batch Number</p>
                      <p className="text-base text-foreground">
                        {verificationResult.batch.batchNumber}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Production Date
                      </p>
                      <p className="text-base text-foreground">
                        {new Date(
                          verificationResult.batch.productionDate
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Expiry Date</p>
                      <p className="text-base text-foreground">
                        {new Date(verificationResult.batch.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Educational Content */}
        <Card>
          <CardHeader>
            <CardTitle>Why Verify Your Medicine?</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-success" />
              </div>
              <h4 className="font-semibold text-foreground">Safety First</h4>
              <p className="text-sm text-muted-foreground">
                Counterfeit drugs can be dangerous and ineffective. Verification ensures your
                safety.
              </p>
            </div>
            <div className="space-y-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground">Blockchain Verified</h4>
              <p className="text-sm text-muted-foreground">
                Every batch is recorded on an immutable blockchain for complete transparency.
              </p>
            </div>
            <div className="space-y-2">
              <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              <h4 className="font-semibold text-foreground">Report Suspicious</h4>
              <p className="text-sm text-muted-foreground">
                Help protect others by reporting any suspicious or counterfeit products.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Scanner Modal */}
      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Scan QR Code</DialogTitle>
            <DialogDescription>
              Position the QR code within the camera frame
            </DialogDescription>
          </DialogHeader>
          <div id="qr-reader" className="w-full" data-testid="qr-scanner"></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
