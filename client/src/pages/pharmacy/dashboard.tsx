import { useQuery } from "@tanstack/react-query";
import { StatisticsCard } from "@/components/statistics-card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PharmacyDashboard() {
  const [, setLocation] = useLocation();

  const { data: stats, isLoading } = useQuery<{
    totalVerifications: number;
    authenticCount: number;
    suspiciousCount: number;
    inventoryCount: number;
  }>({
    queryKey: ["/api/pharmacy/statistics"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pharmacy Dashboard</h1>
          <p className="text-muted-foreground">Verify drug authenticity and manage inventory</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pharmacy Dashboard</h1>
          <p className="text-muted-foreground">Verify drug authenticity and manage inventory</p>
        </div>
        <Button
          onClick={() => setLocation("/pharmacy/verify")}
          data-testid="button-verify-drug"
        >
          <ShieldCheck className="h-4 w-4 mr-2" />
          Verify Drug
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatisticsCard
          title="Total Verifications"
          value={stats?.totalVerifications || 0}
          icon={ShieldCheck}
          description="Drugs verified"
          data-testid="stat-total-verifications"
        />
        <StatisticsCard
          title="Authentic"
          value={stats?.authenticCount || 0}
          icon={CheckCircle}
          description="Verified authentic"
          variant="success"
          data-testid="stat-authentic"
        />
        <StatisticsCard
          title="Suspicious"
          value={stats?.suspiciousCount || 0}
          icon={AlertTriangle}
          description="Flagged products"
          variant="warning"
          data-testid="stat-suspicious"
        />
        <StatisticsCard
          title="Inventory"
          value={stats?.inventoryCount || 0}
          icon={CheckCircle}
          description="Products in stock"
          data-testid="stat-inventory"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover-elevate active-elevate-2 cursor-pointer" onClick={() => setLocation("/pharmacy/verify")}>
          <CardContent className="p-6 text-center">
            <ShieldCheck className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-foreground">Verify Drug</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Scan QR code or enter serial ID to verify authenticity
            </p>
          </CardContent>
        </Card>
        <Card className="hover-elevate active-elevate-2 cursor-pointer" onClick={() => setLocation("/pharmacy/incoming")}>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
            <h3 className="font-semibold text-foreground">Incoming Shipments</h3>
            <p className="text-sm text-muted-foreground mt-1">
              View and accept pending deliveries
            </p>
          </CardContent>
        </Card>
        <Card className="hover-elevate active-elevate-2 cursor-pointer" onClick={() => setLocation("/pharmacy/inventory")}>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-foreground">View Inventory</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your drug inventory
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Educational Section */}
      <Card>
        <CardHeader>
          <CardTitle>About Drug Verification</CardTitle>
          <CardDescription>How to ensure your medicines are authentic</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Verification Process
            </h4>
            <p className="text-sm text-muted-foreground">
              Each drug batch is registered on the blockchain with a unique serial ID. Scan the
              QR code or enter the serial ID to verify authenticity instantly.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Report Suspicious Products
            </h4>
            <p className="text-sm text-muted-foreground">
              If you encounter a product that fails verification or seems suspicious, report it
              immediately to protect your customers and community.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
