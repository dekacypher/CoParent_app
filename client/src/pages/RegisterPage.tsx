import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterPage() {
  const { toast } = useToast();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "parentA" as "parentA" | "parentB"
  });

  // Password strength validation
  const getPasswordStrength = (password: string): { strength: number; message: string } => {
    if (password.length === 0) return { strength: 0, message: "" };
    if (password.length < 8) return { strength: 1, message: "Too short (min 8 characters)" };
    if (!/[A-Z]/.test(password)) return { strength: 2, message: "Add uppercase letter" };
    if (!/[a-z]/.test(password)) return { strength: 2, message: "Add lowercase letter" };
    if (!/[0-9]/.test(password)) return { strength: 3, message: "Add number" };
    if (!/[^A-Za-z0-9]/.test(password)) return { strength: 4, message: "Add special character" };
    return { strength: 5, message: "Strong password" };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
      });
      return;
    }

    if (passwordStrength.strength < 4) {
      toast({
        variant: "destructive",
        title: "Weak password",
        description: "Please choose a stronger password (8+ chars with uppercase, lowercase, number, and special character).",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(formData.email, formData.password, {
      username: formData.username,
      role: formData.role
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message,
      });
    } else {
      toast({
        title: "Account created!",
        description: "Welcome to CoParent. Please check your email to verify your account.",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-orange-50 to-amber-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
          <CardDescription className="text-center">
            Join CoParent to start coordinating childcare
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Choose a username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">I am</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "parentA" | "parentB") => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parentA">Parent A</SelectItem>
                  <SelectItem value="parentB">Parent B</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              {formData.password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded ${
                          level <= passwordStrength.strength
                            ? level <= 2
                              ? 'bg-red-500'
                              : level <= 3
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{passwordStrength.message}</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-teal-600 hover:underline">
              Sign in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
