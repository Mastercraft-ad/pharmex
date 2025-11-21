import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getStoredUser, isAuthenticated, removeToken } from "@/lib/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type { User } from "@shared/schema";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      setLocation("/login");
      return;
    }

    const currentUser = getStoredUser();
    if (!currentUser) {
      setLocation("/login");
      return;
    }

    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
      setLocation("/login");
      return;
    }

    setUser(currentUser);
  }, [setLocation, allowedRoles]);

  const handleLogout = () => {
    removeToken();
    setLocation("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const sidebarWidth = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarWidth as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar
          role={user.role as any}
          companyName={user.companyName}
          onLogout={handleLogout}
        />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b border-border bg-card">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{user.companyName}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
