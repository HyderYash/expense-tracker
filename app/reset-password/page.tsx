"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Key, ArrowLeft, Check, AlertCircle, Eye, EyeOff } from "lucide-react";
import { showToast } from "@/lib/toast";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (formData.newPassword.length < 6) {
      const errorMsg = "Password must be at least 6 characters long";
      setError(errorMsg);
      showToast.error("Validation error", errorMsg);
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      const errorMsg = "Passwords do not match";
      setError(errorMsg);
      showToast.error("Validation error", errorMsg);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          code: formData.code,
          newPassword: formData.newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setError("");
        showToast.success("Password reset", "Your password has been reset successfully");
        // Redirect to signin after 2 seconds
        setTimeout(() => {
          router.push("/signin");
        }, 2000);
      } else {
        const errorMsg = result.error || "Error resetting password";
        setError(errorMsg);
        showToast.error("Reset failed", errorMsg);
      }
    } catch (error) {
      console.error("Reset password error:", error);
      const errorMsg = "Error resetting password. Please try again.";
      setError(errorMsg);
      showToast.error("Error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
          <CardHeader className="text-center px-4 sm:px-6 pt-6 sm:pt-8">
            <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
              <Key className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Reset Password</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Enter your email, verification code, and new password
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
            {success ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300 flex items-start gap-3">
                  <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Password reset successfully!</p>
                    <p className="text-sm mt-1">
                      Your password has been reset. Redirecting to sign in...
                    </p>
                  </div>
                </div>
                <Link href="/signin">
                  <Button className="w-full">
                    Go to Sign In
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="code" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Verification Code
                  </label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                    required
                    className="h-11 text-center text-xl sm:text-2xl tracking-widest font-mono"
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      required
                      className="h-11 pr-10"
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-11 w-10"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 6 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                      className="h-11 pr-10"
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-11 w-10"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-primary hover:bg-primary/90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Reset Password
                    </>
                  )}
                </Button>

                <Link href="/signin">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Sign In
                  </Button>
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

