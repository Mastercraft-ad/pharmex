import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Package, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function RegisterBatchPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [registeredBatch, setRegisteredBatch] = useState<any>(null);
  const [formData, setFormData] = useState({
    drugName: "",
    batchNumber: "",
    quantity: "",
    productionDate: "",
    expiryDate: "",
    manufacturingLocation: "",
  });

  const registerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/batches/register", {
        ...data,
        quantity: parseInt(data.quantity),
      });
    },
    onSuccess: (data) => {
      setRegisteredBatch(data);
      setIsSuccessModalOpen(true);
      queryClient.invalidateQueries({ queryKey: ["/api/batches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/batches/statistics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/batches/recent"] });
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Failed to register batch",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(formData);
  };

  const handleDownloadQR = () => {
    if (registeredBatch?.qrCodePath) {
      window.open(registeredBatch.qrCodePath, "_blank");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Register New Batch</h1>
        <p className="text-muted-foreground">
          Register a new pharmaceutical batch on the blockchain
        </p>
      </div>

      {/* Registration Form */}
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Batch Details</CardTitle>
          <CardDescription>
            Fill in all required information about the drug batch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="drugName">
                  Drug Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="drugName"
                  placeholder="e.g., Paracetamol"
                  value={formData.drugName}
                  onChange={(e) => setFormData({ ...formData, drugName: e.target.value })}
                  required
                  data-testid="input-drug-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batchNumber">
                  Batch Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="batchNumber"
                  placeholder="e.g., BATCH-2024-001"
                  value={formData.batchNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, batchNumber: e.target.value })
                  }
                  required
                  data-testid="input-batch-number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  Quantity (units) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="e.g., 1000"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                  data-testid="input-quantity"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manufacturingLocation">
                  Manufacturing Location <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="manufacturingLocation"
                  placeholder="e.g., Lagos, Nigeria"
                  value={formData.manufacturingLocation}
                  onChange={(e) =>
                    setFormData({ ...formData, manufacturingLocation: e.target.value })
                  }
                  required
                  data-testid="input-location"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productionDate">
                  Production Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="productionDate"
                  type="date"
                  value={formData.productionDate}
                  onChange={(e) =>
                    setFormData({ ...formData, productionDate: e.target.value })
                  }
                  required
                  data-testid="input-production-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">
                  Expiry Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expiryDate: e.target.value })
                  }
                  required
                  data-testid="input-expiry-date"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button
                type="submit"
                disabled={registerMutation.isPending}
                data-testid="button-register"
              >
                {registerMutation.isPending ? (
                  "Registering..."
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-2" />
                    Register Batch
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/manufacturer")}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Success Modal */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent data-testid="dialog-success">
          <DialogHeader>
            <DialogTitle>Batch Registered Successfully!</DialogTitle>
            <DialogDescription>
              Your batch has been registered on the blockchain
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-success/10 rounded-lg border border-success/20">
              <p className="text-sm font-medium text-foreground mb-2">Serial ID</p>
              <p className="text-lg font-mono text-success" data-testid="text-serial-id">
                {registeredBatch?.serialId}
              </p>
            </div>
            {registeredBatch?.qrCodePath && (
              <div className="text-center p-4 bg-card rounded-lg border border-border">
                <img
                  src={registeredBatch.qrCodePath}
                  alt="QR Code"
                  className="mx-auto h-48 w-48"
                  data-testid="img-qr-code"
                />
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleDownloadQR}
                  data-testid="button-download-qr"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download QR Code
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  setLocation(`/manufacturer/batches/${registeredBatch?.serialId}`);
                }}
                data-testid="button-view-batch"
              >
                View Batch Details
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  setFormData({
                    drugName: "",
                    batchNumber: "",
                    quantity: "",
                    productionDate: "",
                    expiryDate: "",
                    manufacturingLocation: "",
                  });
                }}
                data-testid="button-register-another"
              >
                Register Another
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
