"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/navigation";
import { Home, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                Something went wrong!
              </CardTitle>
              <CardDescription className="text-base sm:text-lg mt-2">
                {error.message || "An unexpected error occurred. Please try again."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={reset} className="w-full sm:w-auto">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/dashboard">
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Link>
                </Button>
              </div>
              {error.digest && (
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Error ID: {error.digest}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

