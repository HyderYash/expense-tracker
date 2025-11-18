"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { FolderTree, Loader2, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { showToast } from "@/lib/toast";

interface Category {
  _id: string;
  name: string;
  slug: string;
  expectedPercent: number;
  currentValue: number;
  entries: Array<{ name: string; quantity: number; invested: number }>;
  displayName?: string;
  description?: string;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();

    // Listen for category updates
    const handleCategoryUpdate = () => {
      fetchCategories();
    };

    window.addEventListener("categoriesUpdated", handleCategoryUpdate);

    return () => {
      window.removeEventListener("categoriesUpdated", handleCategoryUpdate);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/categories");
      const result = await response.json();
      if (result.success) {
        setCategories(result.data);
      } else {
        showToast.error("Error", "Failed to load categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      showToast.error("Error", "Failed to load categories. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryTotal = (category: Category) => {
    return category.entries.reduce((sum, entry) => sum + entry.invested, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Navigation />
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <div className="space-y-6">
            <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">Categories</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Select a category to manage your investments</p>
            </div>
            <Link
              href="/admin"
              className="flex items-center justify-center space-x-2 rounded-xl px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm sm:text-base w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Add Category</span>
            </Link>
          </div>

          {categories.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl shadow-lg">
              <FolderTree className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">No categories yet</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                Create your first category to start tracking investments
              </p>
              <Link
                href="/admin"
                className="inline-flex items-center space-x-2 rounded-xl px-4 sm:px-6 py-2 sm:py-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm sm:text-base"
              >
                <Plus className="h-4 w-4" />
                <span>Create Category</span>
              </Link>
            </Card>
          ) : (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category, index) => {
                const total = getCategoryTotal(category);
                const displayName = category.displayName || category.name;
                return (
                  <motion.div
                    key={category._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Link href={`/categories/${category.slug}`}>
                      <Card className="h-full cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-700/60 backdrop-blur-xl group">
                        <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors truncate">
                                {displayName}
                              </CardTitle>
                              {category.description && (
                                <CardDescription className="mt-1 text-xs text-muted-foreground line-clamp-2 hidden sm:block">
                                  {category.description}
                                </CardDescription>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
                                {formatCurrency(total)}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-2 px-3 sm:px-4 pb-3 sm:pb-4">
                          <div className="space-y-1.5 sm:space-y-2 pt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">Expected %</span>
                              <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                                {category.expectedPercent}%
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">Current Value</span>
                              <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate ml-2">
                                {formatCurrency(category.currentValue)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-muted-foreground">Entries</span>
                              <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                                {category.entries.length}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

