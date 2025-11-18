"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, LogIn } from "lucide-react";
import { showToast } from "@/lib/toast";

export default function SignInPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "", code: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFAMessage, setTwoFAMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.requires2FA) {
        setRequires2FA(true);
        const message = result.message || "Two-factor authentication code sent to your email";
        setTwoFAMessage(message);
        setError("");
        showToast.info("2FA Required", message);
      } else if (response.ok) {
        showToast.success("Welcome back!", "Signed in successfully");
        router.push("/dashboard");
        router.refresh();
      } else {
        const errorMsg = result.error || "Error signing in";
        setError(errorMsg);
        showToast.error("Sign in failed", errorMsg);
      }
    } catch (error) {
      console.error("Signin error:", error);
      const errorMsg = "Error signing in. Please try again.";
      setError(errorMsg);
      showToast.error("Sign in failed", errorMsg);
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
              <LogIn className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Sign In</CardTitle>
            <CardDescription className="text-sm sm:text-base">Enter your credentials to access your portfolio</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                  {error}
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
                <label htmlFor="password" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="h-11"
                  disabled={requires2FA}
                />
              </div>

              {requires2FA && (
                <div className="space-y-2">
                  {twoFAMessage && (
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300">
                      {twoFAMessage}
                    </div>
                  )}
                  <label htmlFor="code" className="text-sm font-medium">
                    Verification Code
                  </label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                    required
                    className="h-11 text-center text-2xl tracking-widest font-mono"
                    maxLength={6}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the 6-digit code sent to your email
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-primary hover:bg-primary/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>

              <div className="space-y-2">
                <p className="text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link href="/signup" className="text-primary hover:underline font-medium">
                    Sign up
                  </Link>
                </p>
                <p className="text-center">
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline font-medium">
                    Forgot your password?
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

