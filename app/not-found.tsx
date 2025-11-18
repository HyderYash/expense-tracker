import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/navigation";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="text-6xl sm:text-8xl font-bold text-primary mb-4">404</div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                Page Not Found
              </CardTitle>
              <CardDescription className="text-base sm:text-lg mt-2">
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/dashboard">
                    <Home className="h-4 w-4 mr-2" />
                    Go to Dashboard
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link href="/categories">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    View Categories
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

