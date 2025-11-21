import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMetaMask } from "@/hooks/use-metamask";
import { setToken, setStoredUser } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { ShieldCheck, ArrowRight, Wallet } from "lucide-react";
import type { User, UserRole } from "@shared/schema";

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const { connectWallet, signMessage } = useMetaMask();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "" as UserRole | "",
    companyName: "",
    licenseNumber: "",
  });
  const [walletFormData, setWalletFormData] = useState({
    role: "" as UserRole | "",
    companyName: "",
    licenseNumber: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (!formData.role) {
      toast({
        title: "Role required",
        description: "Please select your role",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest<{ token: string; user: User }>(
        "POST",
        "/api/auth/register",
        {
          email: formData.email,
          password: formData.password,
          role: formData.role,
          companyName: formData.companyName,
          licenseNumber: formData.licenseNumber,
        }
      );

      setToken(response.token);
      setStoredUser(response.user);

      toast({
        title: "Registration successful",
        description: `Welcome to PharmaBlock, ${response.user.companyName}!`,
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
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletRegister = async () => {
    if (!walletFormData.role || !walletFormData.companyName || !walletFormData.licenseNumber) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

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

      if (!nonceResponse.isNewUser) {
        toast({
          title: "Wallet Already Registered",
          description: "Please login with your wallet",
          variant: "destructive",
        });
        setIsWalletLoading(false);
        setLocation("/login");
        return;
      }

      // Step 3: Sign the message
      const signature = await signMessage(nonceResponse.message);
      if (!signature) {
        setIsWalletLoading(false);
        return;
      }

      // Step 4: Register with server
      const response = await apiRequest<{ token: string; user: User }>(
        "POST",
        "/api/auth/wallet/register",
        {
          walletAddress,
          signature,
          message: nonceResponse.message,
          role: walletFormData.role,
          companyName: walletFormData.companyName,
          licenseNumber: walletFormData.licenseNumber,
        }
      );

      setToken(response.token);
      setStoredUser(response.user);

      toast({
        title: "Registration successful",
        description: `Welcome to PharmaBlock, ${response.user.companyName}!`,
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
        title: "Wallet Registration Failed",
        description: error.message || "Failed to register with wallet",
        variant: "destructive",
      });
    } finally {
      setIsWalletLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Logo and Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-lg bg-primary flex items-center justify-center">
              <ShieldCheck className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Create an Account</h1>
          <p className="text-muted-foreground">
            Join the pharmaceutical supply chain authentication network
          </p>
        </div>

        {/* Register Card */}
        <Card>
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>
              Fill in the details below to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    data-testid="input-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">
                    Role <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value as UserRole })
                    }
                  >
                    <SelectTrigger id="role" data-testid="select-role">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manufacturer">Manufacturer</SelectItem>
                      <SelectItem value="distributor">Distributor</SelectItem>
                      <SelectItem value="pharmacy">Pharmacy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    data-testid="input-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirm Password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    required
                    data-testid="input-confirm-password"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="Your company name"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    required
                    data-testid="input-company-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">
                    License Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="licenseNumber"
                    placeholder="Official license number"
                    value={formData.licenseNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, licenseNumber: e.target.value })
                    }
                    required
                    data-testid="input-license-number"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || isWalletLoading}
                data-testid="button-register"
              >
                {isLoading ? "Creating account..." : "Create Account"}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or register with
                  </span>
                </div>
              </div>

              {/* Wallet Registration Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wallet-role">
                      Role <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={walletFormData.role}
                      onValueChange={(value) =>
                        setWalletFormData({ ...walletFormData, role: value as UserRole })
                      }
                    >
                      <SelectTrigger id="wallet-role">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manufacturer">Manufacturer</SelectItem>
                        <SelectItem value="distributor">Distributor</SelectItem>
                        <SelectItem value="pharmacy">Pharmacy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wallet-company">
                      Company Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="wallet-company"
                      placeholder="Your company name"
                      value={walletFormData.companyName}
                      onChange={(e) =>
                        setWalletFormData({ ...walletFormData, companyName: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wallet-license">
                    License Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="wallet-license"
                    placeholder="Official license number"
                    value={walletFormData.licenseNumber}
                    onChange={(e) =>
                      setWalletFormData({ ...walletFormData, licenseNumber: e.target.value })
                    }
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleWalletRegister}
                  disabled={isLoading || isWalletLoading}
                  data-testid="button-wallet-register"
                >
                  {isWalletLoading ? (
                    "Connecting..."
                  ) : (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      Register with MetaMask
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Login Link */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() => setLocation("/login")}
              data-testid="link-login"
            >
              Sign in
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
