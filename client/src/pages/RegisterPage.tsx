import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const { toast } = useToast();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
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
    setShowVerificationMessage(false);

    const { error } = await signUp(formData.email, formData.password, {
      username: formData.username,
      role: formData.role
    });

    setIsLoading(false);

    if (error) {
      // Check if this is just an email confirmation requirement
      if (error.name === 'EmailNotConfirmed' || (error as any).userCreated) {
        setShowVerificationMessage(true);
        setRegisteredEmail(formData.email);
        toast({
          title: "🎉 Account Created Successfully!",
          description: "Please check your email to verify your account. The verification link should arrive within a few minutes.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: error.message || "An error occurred during registration. Please try again.",
        });
      }
    } else {
      // No email confirmation required - redirect to dashboard
      toast({
        title: "Account created successfully!",
        description: "Welcome to CoParent! Redirecting to dashboard...",
      });
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    }
  };

  const handleResendEmail = async () => {
    setResendLoading(true);

    try {
      // Resend confirmation email using Supabase
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: registeredEmail,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to resend",
          description: error.message || "Could not resend verification email. Please try again.",
        });
      } else {
        toast({
          title: "Verification email resent!",
          description: "Please check your inbox for the new verification link.",
        });
      }
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Failed to resend",
        description: e.message || "An error occurred. Please try again.",
      });
    } finally {
      setResendLoading(false);
    }
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

          {/* Verification Message */}
          {showVerificationMessage && (
            <div className="mt-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Mail className="w-6 h-6 text-teal-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-teal-900 mb-2">
                    Check your email to activate your account
                  </h4>
                  <p className="text-sm text-teal-700 mb-3">
                    We've sent a verification link to <strong>{registeredEmail}</strong>.
                    Please check your inbox (and spam folder) and click the link to activate your account.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResendEmail}
                      disabled={resendLoading}
                      className="text-teal-600 border-teal-600 hover:bg-teal-50"
                    >
                      {resendLoading ? "Sending..." : "Resend email"}
                    </Button>
                    <Link href="/login">
                      <Button size="sm" variant="ghost">
                        Go to login
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

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
