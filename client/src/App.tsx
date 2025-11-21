import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/protected-route";
import { isAuthenticated, getStoredUser } from "@/lib/auth";

// Auth pages
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import PublicVerifyPage from "@/pages/public-verify";

// Manufacturer pages
import ManufacturerDashboard from "@/pages/manufacturer/dashboard";
import RegisterBatchPage from "@/pages/manufacturer/register-batch";

// Distributor pages
import DistributorDashboard from "@/pages/distributor/dashboard";

// Pharmacy pages
import PharmacyDashboard from "@/pages/pharmacy/dashboard";

import NotFound from "@/pages/not-found";

function Router() {
  const authenticated = isAuthenticated();
  const user = getStoredUser();

  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/verify" component={PublicVerifyPage} />
      <Route path="/login">
        {authenticated && user ? (
          <Redirect
            to={
              user.role === "manufacturer"
                ? "/manufacturer"
                : user.role === "distributor"
                ? "/distributor"
                : "/pharmacy"
            }
          />
        ) : (
          <LoginPage />
        )}
      </Route>
      <Route path="/register">
        {authenticated && user ? (
          <Redirect
            to={
              user.role === "manufacturer"
                ? "/manufacturer"
                : user.role === "distributor"
                ? "/distributor"
                : "/pharmacy"
            }
          />
        ) : (
          <RegisterPage />
        )}
      </Route>

      {/* Manufacturer Routes */}
      <Route path="/manufacturer">
        <ProtectedRoute allowedRoles={["manufacturer"]}>
          <ManufacturerDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/manufacturer/register">
        <ProtectedRoute allowedRoles={["manufacturer"]}>
          <RegisterBatchPage />
        </ProtectedRoute>
      </Route>
      <Route path="/manufacturer/batches">
        <ProtectedRoute allowedRoles={["manufacturer"]}>
          <div className="p-6">
            <h1 className="text-3xl font-bold">My Batches</h1>
            <p className="text-muted-foreground">Coming soon</p>
          </div>
        </ProtectedRoute>
      </Route>
      <Route path="/manufacturer/transfers">
        <ProtectedRoute allowedRoles={["manufacturer"]}>
          <div className="p-6">
            <h1 className="text-3xl font-bold">Transfers</h1>
            <p className="text-muted-foreground">Coming soon</p>
          </div>
        </ProtectedRoute>
      </Route>

      {/* Distributor Routes */}
      <Route path="/distributor">
        <ProtectedRoute allowedRoles={["distributor"]}>
          <DistributorDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/distributor/incoming">
        <ProtectedRoute allowedRoles={["distributor"]}>
          <div className="p-6">
            <h1 className="text-3xl font-bold">Incoming Shipments</h1>
            <p className="text-muted-foreground">Coming soon</p>
          </div>
        </ProtectedRoute>
      </Route>
      <Route path="/distributor/inventory">
        <ProtectedRoute allowedRoles={["distributor"]}>
          <div className="p-6">
            <h1 className="text-3xl font-bold">Inventory</h1>
            <p className="text-muted-foreground">Coming soon</p>
          </div>
        </ProtectedRoute>
      </Route>
      <Route path="/distributor/transfers">
        <ProtectedRoute allowedRoles={["distributor"]}>
          <div className="p-6">
            <h1 className="text-3xl font-bold">Transfers</h1>
            <p className="text-muted-foreground">Coming soon</p>
          </div>
        </ProtectedRoute>
      </Route>

      {/* Pharmacy Routes */}
      <Route path="/pharmacy">
        <ProtectedRoute allowedRoles={["pharmacy"]}>
          <PharmacyDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/pharmacy/verify">
        <ProtectedRoute allowedRoles={["pharmacy"]}>
          <div className="p-6">
            <h1 className="text-3xl font-bold">Verify Drug</h1>
            <p className="text-muted-foreground">Coming soon</p>
          </div>
        </ProtectedRoute>
      </Route>
      <Route path="/pharmacy/incoming">
        <ProtectedRoute allowedRoles={["pharmacy"]}>
          <div className="p-6">
            <h1 className="text-3xl font-bold">Incoming Shipments</h1>
            <p className="text-muted-foreground">Coming soon</p>
          </div>
        </ProtectedRoute>
      </Route>
      <Route path="/pharmacy/inventory">
        <ProtectedRoute allowedRoles={["pharmacy"]}>
          <div className="p-6">
            <h1 className="text-3xl font-bold">Inventory</h1>
            <p className="text-muted-foreground">Coming soon</p>
          </div>
        </ProtectedRoute>
      </Route>

      {/* Root Route */}
      <Route path="/">
        {authenticated && user ? (
          <Redirect
            to={
              user.role === "manufacturer"
                ? "/manufacturer"
                : user.role === "distributor"
                ? "/distributor"
                : "/pharmacy"
            }
          />
        ) : (
          <Redirect to="/verify" />
        )}
      </Route>

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
