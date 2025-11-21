import { Building2, Truck, Store, CheckCircle, Clock, XCircle } from "lucide-react";
import type { Transfer } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

interface TransferTimelineProps {
  transfers: Transfer[];
  users: Record<string, { companyName: string; role: string }>;
}

export function TransferTimeline({ transfers, users }: TransferTimelineProps) {
  const getRoleIcon = (role: string) => {
    if (role === "manufacturer") return Building2;
    if (role === "distributor") return Truck;
    return Store;
  };

  const getStatusColor = (status: string) => {
    if (status === "accepted") return "text-success";
    if (status === "pending") return "text-warning";
    return "text-destructive";
  };

  const getStatusIcon = (status: string) => {
    if (status === "accepted") return CheckCircle;
    if (status === "pending") return Clock;
    return XCircle;
  };

  if (!transfers || transfers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No transfer history</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transfers.map((transfer, index) => {
        const RoleIcon = getRoleIcon(transfer.senderRole);
        const StatusIcon = getStatusIcon(transfer.status);
        const sender = users[transfer.senderId];
        const recipient = users[transfer.recipientId];

        return (
          <div key={transfer.id} className="relative pl-8">
            {/* Vertical Line */}
            {index < transfers.length - 1 && (
              <div className="absolute left-4 top-10 w-0.5 h-full bg-border" />
            )}

            {/* Timeline Node */}
            <div className="absolute left-0 top-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                <RoleIcon className="h-4 w-4 text-primary" />
              </div>
            </div>

            {/* Transfer Details */}
            <div className="pb-8">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-foreground">
                      {sender?.companyName || "Unknown"} → {recipient?.companyName || "Unknown"}
                    </p>
                    <Badge
                      variant={
                        transfer.status === "accepted"
                          ? "default"
                          : transfer.status === "pending"
                          ? "outline"
                          : "destructive"
                      }
                      className="capitalize"
                    >
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {transfer.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {transfer.senderRole} → {transfer.recipientRole}
                  </p>
                </div>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span className="text-foreground font-medium">{transfer.quantity} units</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="text-foreground">{transfer.location}</span>
                </div>
                {transfer.notes && (
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground">Notes:</span>
                    <span className="text-foreground italic">{transfer.notes}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="text-foreground">
                    {new Date(transfer.transferDate).toLocaleString()}
                  </span>
                </div>
                {transfer.acceptedDate && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Accepted:</span>
                    <span className="text-foreground">
                      {new Date(transfer.acceptedDate).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground text-xs">Blockchain TX:</span>
                  <span className="text-xs font-mono text-muted-foreground break-all">
                    {transfer.blockchainTxHash}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
