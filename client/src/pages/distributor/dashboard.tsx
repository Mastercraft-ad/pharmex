import { useQuery } from "@tanstack/react-query";
import { StatisticsCard } from "@/components/statistics-card";
import { Button } from "@/components/ui/button";
import { Package, ArrowLeftRight, Truck, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DistributorDashboard() {
  const [, setLocation] = useLocation();

  const { data: stats, isLoading } = useQuery<{
    totalInventory: number;
    pendingIncoming: number;
    totalTransfers: number;
    acceptedTransfers: number;
  }>({
    queryKey: ["/api/distributor/statistics"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Distributor Dashboard</h1>
          <p className="text-muted-foreground">Manage shipments and inventory</p>
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
          <h1 className="text-3xl font-bold text-foreground">Distributor Dashboard</h1>
          <p className="text-muted-foreground">Manage shipments and inventory</p>
        </div>
        <Button
          onClick={() => setLocation("/distributor/incoming")}
          data-testid="button-incoming-shipments"
        >
          <Truck className="h-4 w-4 mr-2" />
          View Incoming Shipments
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatisticsCard
          title="Inventory"
          value={stats?.totalInventory || 0}
          icon={Package}
          description="Total items in stock"
          data-testid="stat-inventory"
        />
        <StatisticsCard
          title="Pending Incoming"
          value={stats?.pendingIncoming || 0}
          icon={Truck}
          description="Awaiting acceptance"
          variant="warning"
          data-testid="stat-pending-incoming"
        />
        <StatisticsCard
          title="Total Transfers"
          value={stats?.totalTransfers || 0}
          icon={ArrowLeftRight}
          description="All transfers"
          data-testid="stat-total-transfers"
        />
        <StatisticsCard
          title="Accepted"
          value={stats?.acceptedTransfers || 0}
          icon={CheckCircle}
          description="Completed transfers"
          variant="success"
          data-testid="stat-accepted-transfers"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover-elevate active-elevate-2 cursor-pointer" onClick={() => setLocation("/distributor/incoming")}>
          <CardContent className="p-6 text-center">
            <Truck className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-foreground">Incoming Shipments</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Accept or reject pending deliveries
            </p>
          </CardContent>
        </Card>
        <Card className="hover-elevate active-elevate-2 cursor-pointer" onClick={() => setLocation("/distributor/inventory")}>
          <CardContent className="p-6 text-center">
            <Package className="h-8 w-8 text-success mx-auto mb-2" />
            <h3 className="font-semibold text-foreground">View Inventory</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your current stock
            </p>
          </CardContent>
        </Card>
        <Card className="hover-elevate active-elevate-2 cursor-pointer" onClick={() => setLocation("/distributor/transfers")}>
          <CardContent className="p-6 text-center">
            <ArrowLeftRight className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-foreground">Transfer to Pharmacy</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Send inventory to pharmacies
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
