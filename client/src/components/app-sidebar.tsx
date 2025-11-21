import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Package,
  ArrowLeftRight,
  ShieldCheck,
  LayoutDashboard,
  Building2,
  Truck,
  Store,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@shared/schema";

interface AppSidebarProps {
  role: UserRole;
  companyName: string;
  onLogout: () => void;
}

export function AppSidebar({ role, companyName, onLogout }: AppSidebarProps) {
  const [location] = useLocation();

  const manufacturerItems = [
    { title: "Dashboard", url: "/manufacturer", icon: LayoutDashboard },
    { title: "Register Batch", url: "/manufacturer/register", icon: Package },
    { title: "My Batches", url: "/manufacturer/batches", icon: Package },
    { title: "Transfers", url: "/manufacturer/transfers", icon: ArrowLeftRight },
  ];

  const distributorItems = [
    { title: "Dashboard", url: "/distributor", icon: LayoutDashboard },
    { title: "Incoming Shipments", url: "/distributor/incoming", icon: Truck },
    { title: "Inventory", url: "/distributor/inventory", icon: Package },
    { title: "Transfers", url: "/distributor/transfers", icon: ArrowLeftRight },
  ];

  const pharmacyItems = [
    { title: "Dashboard", url: "/pharmacy", icon: LayoutDashboard },
    { title: "Verify Drug", url: "/pharmacy/verify", icon: ShieldCheck },
    { title: "Incoming Shipments", url: "/pharmacy/incoming", icon: Truck },
    { title: "Inventory", url: "/pharmacy/inventory", icon: Package },
  ];

  const items =
    role === "manufacturer"
      ? manufacturerItems
      : role === "distributor"
      ? distributorItems
      : pharmacyItems;

  const roleIcon =
    role === "manufacturer" ? Building2 : role === "distributor" ? Truck : Store;
  const RoleIcon = roleIcon;

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center">
            <RoleIcon className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-sidebar-foreground truncate">
              PharmaBlock
            </h2>
            <p className="text-xs text-muted-foreground truncate">{companyName}</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground uppercase tracking-wide px-2">
            {role === "manufacturer"
              ? "Manufacturer"
              : role === "distributor"
              ? "Distributor"
              : "Pharmacy"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                    className={
                      location === item.url
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : ""
                    }
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={onLogout}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
