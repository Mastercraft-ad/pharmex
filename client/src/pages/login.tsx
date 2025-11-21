import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMetaMask } from "@/hooks/use-metamask";
import { setToken, setStoredUser } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { ShieldCheck, ArrowRight, Wallet } from "lucide-react";
import type { User } from "@shared/schema";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { connectWallet, signMessage } = useMetaMask();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest<{ token: string; user: User }>(
        "POST",
        "/api/auth/login",
        { email, password }
      );

      setToken(response.token);
      setStoredUser(response.user);

      toast({
        title: "Login successful",
        description: `Welcome back, ${response.user.companyName}!`,
      });

      // Redirect based on role
      if (response.user.role === "manufacturer") {
        setLocation("/manufacturer");
      } else if (response.user.role === "distributor") {
        setLocation("/distributor");
      } else {
        setLocation("/pharmacy");
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletLogin = async () => {
    setIsWalletLoading(true);

    try {
      // Step 1: Connect wallet
      const walletAddress = await connectWallet();
      if (!walletAddress) {
        setIsWalletLoading(false);
        return;
      }

      // Step 2: Get nonce from server
      const nonceResponse = await apiRequest<{ 
        nonce: string; 
        message: string; 
        isNewUser: boolean 
      }>(
        "POST",
        "/api/auth/wallet/nonce",
        { walletAddress }
      );

      if (nonceResponse.isNewUser) {
        toast({
          title: "Wallet Not Registered",
          description: "Please register your wallet first",
          variant: "destructive",
        });
        setIsWalletLoading(false);
        setLocation("/register");
        return;
      }

      // Step 3: Sign the message
      const signature = await signMessage(nonceResponse.message);
      if (!signature) {
        setIsWalletLoading(false);
        return;
      }

      // Step 4: Authenticate with server
      const response = await apiRequest<{ token: string; user: User }>(
        "POST",
        "/api/auth/wallet/login",
        {
          walletAddress,
          signature,
          message: nonceResponse.message,
        }
      );

      setToken(response.token);
      setStoredUser(response.user);

      toast({
        title: "Login successful",
        description: `Welcome back, ${response.user.companyName}!`,
      });

      // Redirect based on role
      if (response.user.role === "manufacturer") {
        setLocation("/manufacturer");
      } else if (response.user.role === "distributor") {
        setLocation("/distributor");
      } else {
        setLocation("/pharmacy");
      }
    } catch (error: any) {
      toast({
        title: "Wallet Login Failed",
        description: error.message || "Failed to authenticate with wallet",
        variant: "destructive",
      });
    } finally {
      setIsWalletLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-lg bg-primary flex items-center justify-center">
              <ShieldCheck className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">PharmaBlock Systems</h1>
          <p className="text-muted-foreground">
            Pharmaceutical Supply Chain Authentication
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="input-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || isWalletLoading}
                data-testid="button-login"
              >
                {isLoading ? "Signing in..." : "Sign In"}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleWalletLogin}
                disabled={isLoading || isWalletLoading}
                data-testid="button-wallet-login"
              >
                {isWalletLoading ? (
                  "Connecting..."
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect with MetaMask
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Register Link */}
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() => setLocation("/register")}
              data-testid="link-register"
            >
              Create an account
            </Button>
          </p>
          <p className="text-sm text-muted-foreground">
            or{" "}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() => setLocation("/verify")}
              data-testid="link-public-verify"
            >
              Verify a medicine without logging in
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
