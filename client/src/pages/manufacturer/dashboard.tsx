import { useQuery } from "@tanstack/react-query";
import { StatisticsCard } from "@/components/statistics-card";
import { Button } from "@/components/ui/button";
import { Package, ArrowLeftRight, AlertTriangle, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DrugBatch } from "@shared/schema";

export default function ManufacturerDashboard() {
  const [, setLocation] = useLocation();

  const { data: stats, isLoading } = useQuery<{
    totalBatches: number;
    activeBatches: number;
    transferredBatches: number;
    recalledBatches: number;
  }>({
    queryKey: ["/api/batches/statistics"],
  });

  const { data: recentBatches, isLoading: isLoadingBatches } = useQuery<DrugBatch[]>({
    queryKey: ["/api/batches/recent"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Manage your pharmaceutical batches</p>
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
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Manage your pharmaceutical batches</p>
        </div>
        <Button
          onClick={() => setLocation("/manufacturer/register")}
          data-testid="button-register-batch"
        >
          <Package className="h-4 w-4 mr-2" />
          Register New Batch
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatisticsCard
          title="Total Batches"
          value={stats?.totalBatches || 0}
          icon={Package}
          description="All registered batches"
          data-testid="stat-total-batches"
        />
        <StatisticsCard
          title="Active Batches"
          value={stats?.activeBatches || 0}
          icon={CheckCircle}
          description="Currently in inventory"
          variant="success"
          data-testid="stat-active-batches"
        />
        <StatisticsCard
          title="Transferred"
          value={stats?.transferredBatches || 0}
          icon={ArrowLeftRight}
          description="Sent to distributors"
          data-testid="stat-transferred-batches"
        />
        <StatisticsCard
          title="Recalled"
          value={stats?.recalledBatches || 0}
          icon={AlertTriangle}
          description="Active recalls"
          variant="destructive"
          data-testid="stat-recalled-batches"
        />
      </div>

      {/* Recent Batches */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Batches</CardTitle>
          <CardDescription>Your most recently registered batches</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingBatches ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !recentBatches || recentBatches.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No batches registered yet</p>
              <Button onClick={() => setLocation("/manufacturer/register")}>
                Register Your First Batch
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover-elevate active-elevate-2 cursor-pointer"
                  onClick={() => setLocation(`/manufacturer/batches/${batch.serialId}`)}
                  data-testid={`batch-item-${batch.serialId}`}
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{batch.drugName}</p>
                    <p className="text-sm text-muted-foreground">
                      Serial: {batch.serialId} • Batch: {batch.batchNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {batch.quantity} units
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{batch.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover-elevate active-elevate-2 cursor-pointer" onClick={() => setLocation("/manufacturer/register")}>
          <CardContent className="p-6 text-center">
            <Package className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-foreground">Register Batch</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Register a new pharmaceutical batch
            </p>
          </CardContent>
        </Card>
        <Card className="hover-elevate active-elevate-2 cursor-pointer" onClick={() => setLocation("/manufacturer/batches")}>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
            <h3 className="font-semibold text-foreground">View All Batches</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your registered batches
            </p>
          </CardContent>
        </Card>
        <Card className="hover-elevate active-elevate-2 cursor-pointer" onClick={() => setLocation("/manufacturer/transfers")}>
          <CardContent className="p-6 text-center">
            <ArrowLeftRight className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-foreground">View Transfers</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Track your batch transfers
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
