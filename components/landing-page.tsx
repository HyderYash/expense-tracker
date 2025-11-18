"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TrendingUp, BarChart3, Shield, Zap, ArrowRight, LogIn, UserPlus } from "lucide-react";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-6">
            <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-gray-100">
            Investment Tracker
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto">
            Track, analyze, and optimize your investment portfolio with real-time insights and comprehensive analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signin">
              <Button size="lg" className="w-full sm:w-auto text-base px-8 py-6">
                <LogIn className="h-5 w-5 mr-2" />
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 py-6">
                <UserPlus className="h-5 w-5 mr-2" />
                Get Started
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto"
        >
          <Card className="border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 w-fit mb-4">
                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">Real-time Analytics</CardTitle>
              <CardDescription>
                Get instant insights into your portfolio performance with interactive charts and detailed metrics.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 w-fit mb-4">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">Multi-Category Tracking</CardTitle>
              <CardDescription>
                Organize your investments across multiple categories like stocks, mutual funds, and more.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 w-fit mb-4">
                <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">Secure & Private</CardTitle>
              <CardDescription>
                Your financial data is encrypted and secure. We prioritize your privacy and data protection.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30 w-fit mb-4">
                <Zap className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">Fast & Responsive</CardTitle>
              <CardDescription>
                Lightning-fast performance with a modern, mobile-responsive design that works everywhere.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="p-3 rounded-lg bg-pink-100 dark:bg-pink-900/30 w-fit mb-4">
                <BarChart3 className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">Export & Share</CardTitle>
              <CardDescription>
                Export your portfolio data to CSV for analysis or sharing with your financial advisor.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 w-fit mb-4">
                <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <CardTitle className="text-xl text-gray-900 dark:text-gray-100">2FA Security</CardTitle>
              <CardDescription>
                Enhanced security with two-factor authentication to protect your investment data.
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12 sm:mt-16"
        >
          <Card className="border-0 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 backdrop-blur-xl shadow-lg max-w-2xl mx-auto">
            <CardContent className="p-8 sm:p-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                Ready to start tracking your investments?
              </h2>
              <p className="text-muted-foreground mb-6 sm:mb-8">
                Join thousands of investors who trust our platform to manage their portfolios.
              </p>
              <Link href="/signup">
                <Button size="lg" className="text-base px-8 py-6">
                  Get Started Free
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

