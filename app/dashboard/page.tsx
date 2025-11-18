"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { showToast } from "@/lib/toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/navigation";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from "recharts";
import { motion } from "framer-motion";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, X, Loader2, Pencil, Check, ExternalLink, TrendingUp, Target, Download } from "lucide-react";
import { exportToCSV, CategoryExport } from "@/lib/export";

// Enhanced color palette with gradients
const PIE_COLORS = [
  "url(#gradient1)",
  "url(#gradient2)",
  "url(#gradient3)",
  "url(#gradient4)",
  "url(#gradient5)",
  "url(#gradient6)",
  "#667eea",
  "#764ba2",
  "#f093fb",
  "#4facfe",
];

const SOLID_COLORS = [
  "#667eea",
  "#764ba2",
  "#f093fb",
  "#4facfe",
  "#43e97b",
  "#fa709a",
  "#fee140",
  "#30cfd0",
];

// Alias for backward compatibility (in case of cached code)
const COLORS = SOLID_COLORS;

// Helper functions for comma formatting
function formatNumberWithCommas(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;
  if (isNaN(num)) return "0";
  return num.toLocaleString("en-IN");
}

function parseFormattedNumber(value: string): number {
  const numStr = value.replace(/,/g, "");
  return parseFloat(numStr) || 0;
}

type SortField = "name" | "valueFromC20" | "expectedPercent" | "expectedAmt" | "profitLoss" | "currentValue";
type SortDirection = "asc" | "desc" | null;

interface Category {
  _id: string;
  name: string;
  slug: string;
  expectedPercent: number;
  currentValue: number;
  entries: Array<{ name: string; quantity: number; invested: number }>;
  displayName?: string;
}

export default function DashboardPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, { expectedPercent: string; currentValue: string }>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/categories");
      const result = await response.json();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryValue = useCallback((categoryName: string) => {
    const category = categories.find((cat) => cat.name === categoryName);
    if (!category) return 0;
    return category.entries.reduce((sum, entry) => sum + entry.invested, 0);
  }, [categories]);

  const getTotalInvestment = () => {
    return categories.reduce(
      (sum, cat) => sum + cat.entries.reduce((s, e) => s + e.invested, 0),
      0
    );
  };

  const getAvgExpectedPercent = () => {
    if (categories.length === 0) return 0;
    const sum = categories.reduce((s, cat) => s + cat.expectedPercent, 0);
    return sum / categories.length;
  };

  const getTotalExpected = () => {
    return categories.reduce((sum, cat) => {
      const valueFromC20 = cat.entries.reduce((s, e) => s + e.invested, 0);
      const expectedAmt = valueFromC20 * (1 + cat.expectedPercent / 100);
      return sum + expectedAmt;
    }, 0);
  };

  const getTotalProfitLoss = () => {
    return categories.reduce((sum, cat) => {
      const valueFromC20 = cat.entries.reduce((s, e) => s + e.invested, 0);
      const expectedAmt = valueFromC20 * (1 + cat.expectedPercent / 100);
      return sum + (cat.currentValue - expectedAmt);
    }, 0);
  };

  const getTotalCurrent = () => {
    return categories.reduce((sum, cat) => sum + cat.currentValue, 0);
  };

  const dashboardData = useMemo(() => {
    return categories.map((cat) => {
      const valueFromC20 = getCategoryValue(cat.name);
      const expectedAmt = valueFromC20 * (1 + cat.expectedPercent / 100);
      const profitLoss = cat.currentValue - expectedAmt;
      return {
        sheetName: cat.displayName || cat.name,
        categoryName: cat.name,
        categorySlug: cat.slug,
        valueFromC20,
        expectedPercent: cat.expectedPercent,
        expectedAmt,
        profitLoss,
        currentValue: cat.currentValue,
      };
    });
  }, [categories, getCategoryValue]);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return dashboardData;
    const query = searchQuery.toLowerCase();
    return dashboardData.filter((row) =>
      row.sheetName.toLowerCase().includes(query)
    );
  }, [dashboardData, searchQuery]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortField || !sortDirection) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      if (sortField === "name") {
        aValue = a.sheetName.toLowerCase();
        bValue = b.sheetName.toLowerCase();
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortDirection]);

  // Chart data - must be before conditional return (Rules of Hooks)
  const pieData = useMemo(() => {
    if (categories.length === 0) return [];
    const data = categories
      .map((cat) => {
        const value = cat.entries.reduce((sum, entry) => sum + entry.invested, 0);
        return {
          name: cat.displayName || cat.name,
          value,
          fullName: cat.displayName || cat.name,
        };
      })
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
    return data;
  }, [categories]);

  const comparisonData = useMemo(() => {
    if (categories.length === 0) return [];
    return categories
      .map((cat) => {
        const valueFromC20 = cat.entries.reduce((sum, entry) => sum + entry.invested, 0);
        const expectedAmt = valueFromC20 * (1 + cat.expectedPercent / 100);
        return {
          name: (cat.displayName || cat.name).length > 10
            ? (cat.displayName || cat.name).substring(0, 10) + "..."
            : (cat.displayName || cat.name),
          fullName: cat.displayName || cat.name,
          "Expected": expectedAmt,
          "Current": cat.currentValue,
          invested: valueFromC20,
        };
      })
      .sort((a, b) => b.invested - a.invested);
  }, [categories]);

  // Don't render until mounted
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Navigation />
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8">
          <div className="space-y-6">
            <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
              <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="h-4 w-4 ml-1 text-primary" />;
    }
    if (sortDirection === "desc") {
      return <ArrowDown className="h-4 w-4 ml-1 text-primary" />;
    }
    return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
  };

  const handleEdit = (categorySlug: string) => {
    const category = categories.find((cat) => cat.slug === categorySlug);
    if (!category) return;
    setEditingSlug(categorySlug);
    setEditingValues({
      ...editingValues,
      [categorySlug]: {
        expectedPercent: category.expectedPercent.toString(),
        currentValue: formatNumberWithCommas(category.currentValue),
      },
    });
  };

  const handleCancelEdit = (categorySlug: string) => {
    setEditingSlug(null);
    setEditingValues((prev) => {
      const newValues = { ...prev };
      delete newValues[categorySlug];
      return newValues;
    });
  };

  const handleSave = async (categorySlug: string) => {
    const category = categories.find((cat) => cat.slug === categorySlug);
    if (!category) return;
    const editValues = editingValues[categorySlug];
    if (!editValues) return;

    const expectedPercent = parseFloat(editValues.expectedPercent) || 0;
    const currentValue = parseFormattedNumber(editValues.currentValue);

    if (expectedPercent < 0 || currentValue < 0) {
      showToast.error("Invalid values", "Values cannot be negative");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/categories/${categorySlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedPercent,
          currentValue,
        }),
      });

      const result = await response.json();
      if (result.success) {
        showToast.success("Category updated", "Changes have been saved successfully");
        await fetchCategories();
        setEditingSlug(null);
        setEditingValues((prev) => {
          const newValues = { ...prev };
          delete newValues[categorySlug];
          return newValues;
        });
      } else {
        showToast.error("Update failed", result.error || "Error updating category");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      showToast.error("Update failed", "Error updating category. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEditingValue = (categorySlug: string, field: "expectedPercent" | "currentValue", value: string) => {
    if (field === "currentValue") {
      let val = value.replace(/[^0-9,]/g, "");
      const numStr = val.replace(/,/g, "");
      if (numStr) {
        const num = parseFloat(numStr);
        if (!isNaN(num)) {
          val = formatNumberWithCommas(num);
        }
      }
      setEditingValues((prev) => ({
        ...prev,
        [categorySlug]: {
          ...prev[categorySlug],
          currentValue: val,
        },
      }));
    } else {
      const val = value.replace(/[^0-9.]/g, "");
      setEditingValues((prev) => ({
        ...prev,
        [categorySlug]: {
          ...prev[categorySlug],
          expectedPercent: val,
        },
      }));
    }
  };

  const totalInvestment = getTotalInvestment();
  const avgExpected = getAvgExpectedPercent();
  const totalExpected = getTotalExpected();
  const totalProfitLoss = getTotalProfitLoss();
  const totalCurrent = getTotalCurrent();

  const handleExport = () => {
    const exportData: CategoryExport[] = categories.map((cat) => {
      const totalInvested = cat.entries.reduce((sum, entry) => sum + entry.invested, 0);
      const expectedAmt = totalInvested * (1 + cat.expectedPercent / 100);
      const profitLoss = cat.currentValue - expectedAmt;
      const profitLossPercent = totalInvested > 0 ? ((profitLoss / totalInvested) * 100) : 0;

      return {
        name: cat.name,
        displayName: cat.displayName,
        slug: cat.slug,
        expectedPercent: cat.expectedPercent,
        currentValue: cat.currentValue,
        totalInvested,
        expectedAmount: expectedAmt,
        profitLoss,
        profitLossPercent,
        entries: cat.entries,
      };
    });

    exportToCSV(exportData);
    showToast.success("Export started", "Your portfolio data is being downloaded");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-x-hidden">
      <Navigation />
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8 max-w-full w-full overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-full overflow-x-hidden"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6 lg:mb-8">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">Investment Dashboard</h1>
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">Real-time portfolio overview</p>
            </div>
            {categories.length > 0 && (
              <Button
                onClick={handleExport}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>

          <Card className="mb-4 sm:mb-6 lg:mb-8 shadow-lg border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl w-full overflow-hidden">
            <CardHeader className="pb-2 sm:pb-3 lg:pb-4 px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 lg:pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 lg:gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg lg:text-xl xl:text-2xl text-gray-900 dark:text-gray-100">Portfolio Summary</CardTitle>
                  <CardDescription className="text-[10px] sm:text-xs lg:text-sm">Complete breakdown by category</CardDescription>
                </div>
                <div className="relative w-full sm:w-56 lg:w-64">
                  <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    placeholder="Search categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-7 sm:pl-8 lg:pl-10 pr-7 sm:pr-8 lg:pr-10 h-8 sm:h-9 lg:h-10 text-[10px] sm:text-xs lg:text-sm"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0.5 sm:right-1 top-1/2 transform -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 w-full overflow-hidden">
              <div className="overflow-x-auto w-full" style={{ maxWidth: '100%' }}>
                <div className="inline-block min-w-full align-middle w-full">
                  <div className="overflow-hidden rounded-xl w-full">
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/80 dark:to-gray-700/80 border-b-2 border-gray-200 dark:border-gray-700 hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-gray-100/80 dark:hover:from-gray-800/80 dark:hover:to-gray-700/80">
                          <TableHead className="font-bold text-[10px] sm:text-xs lg:text-sm uppercase tracking-wider text-gray-700 dark:text-gray-300 py-2 px-1.5 sm:py-3 sm:px-3 lg:px-6 whitespace-nowrap">
                            <button
                              onClick={() => handleSort("name")}
                              className="flex items-center hover:text-primary transition-colors"
                            >
                              Name
                              {getSortIcon("name")}
                            </button>
                          </TableHead>
                          <TableHead className="text-right font-bold text-[10px] sm:text-xs lg:text-sm uppercase tracking-wider text-gray-700 dark:text-gray-300 py-2 px-1.5 sm:py-3 sm:px-3 lg:px-6 whitespace-nowrap">
                            <button
                              onClick={() => handleSort("valueFromC20")}
                              className="flex items-center justify-end ml-auto hover:text-primary transition-colors"
                            >
                              <span className="hidden sm:inline">Total Amt</span>
                              <span className="sm:hidden">Total</span>
                              {getSortIcon("valueFromC20")}
                            </button>
                          </TableHead>
                          <TableHead className="text-right font-bold text-[10px] sm:text-xs lg:text-sm uppercase tracking-wider text-gray-700 dark:text-gray-300 py-2 px-1.5 sm:py-3 sm:px-3 lg:px-6 whitespace-nowrap">
                            <button
                              onClick={() => handleSort("expectedPercent")}
                              className="flex items-center justify-end ml-auto hover:text-primary transition-colors"
                            >
                              <span className="hidden sm:inline">Expected %</span>
                              <span className="sm:hidden">Exp %</span>
                              {getSortIcon("expectedPercent")}
                            </button>
                          </TableHead>
                          <TableHead className="text-right font-bold text-[10px] sm:text-xs lg:text-sm uppercase tracking-wider text-gray-700 dark:text-gray-300 py-2 px-1.5 sm:py-3 sm:px-3 lg:px-6 whitespace-nowrap">
                            <button
                              onClick={() => handleSort("expectedAmt")}
                              className="flex items-center justify-end ml-auto hover:text-primary transition-colors"
                            >
                              <span className="hidden lg:inline">Expected Amount</span>
                              <span className="lg:hidden hidden sm:inline">Exp Amt</span>
                              <span className="sm:hidden">Exp</span>
                              {getSortIcon("expectedAmt")}
                            </button>
                          </TableHead>
                          <TableHead className="text-right font-bold text-[10px] sm:text-xs lg:text-sm uppercase tracking-wider text-gray-700 dark:text-gray-300 py-2 px-1.5 sm:py-3 sm:px-3 lg:px-6 whitespace-nowrap">
                            <button
                              onClick={() => handleSort("profitLoss")}
                              className="flex items-center justify-end ml-auto hover:text-primary transition-colors"
                            >
                              <span className="hidden sm:inline">Profit/Loss</span>
                              <span className="sm:hidden">P/L</span>
                              {getSortIcon("profitLoss")}
                            </button>
                          </TableHead>
                          <TableHead className="text-right font-bold text-[10px] sm:text-xs lg:text-sm uppercase tracking-wider text-gray-700 dark:text-gray-300 py-2 px-1.5 sm:py-3 sm:px-3 lg:px-6 whitespace-nowrap">
                            <button
                              onClick={() => handleSort("currentValue")}
                              className="flex items-center justify-end ml-auto hover:text-primary transition-colors"
                            >
                              <span className="hidden sm:inline">Current Value</span>
                              <span className="sm:hidden">Cur</span>
                              {getSortIcon("currentValue")}
                            </button>
                          </TableHead>
                          <TableHead className="text-center font-bold text-[10px] sm:text-xs lg:text-sm uppercase tracking-wider text-gray-700 dark:text-gray-300 py-2 px-1 sm:py-3 sm:px-2 lg:px-6 whitespace-nowrap">
                            <span className="hidden sm:inline">Actions</span>
                            <span className="sm:hidden">Act</span>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                              {categories.length === 0
                                ? "No categories found. Create one in the Categories page."
                                : "No categories found matching your search."}
                            </TableCell>
                          </TableRow>
                        ) : (
                          sortedData.map((row) => {
                            const categorySlug = row.categorySlug;
                            const category = categories.find((cat) => cat.slug === categorySlug);
                            const isEditing = editingSlug === categorySlug;

                            return (
                              <TableRow key={row.categoryName}>
                                <TableCell className="font-semibold text-gray-900 dark:text-gray-100 py-2 px-1.5 sm:py-3 sm:px-3 lg:px-6">
                                  <Link
                                    href={`/categories/${categorySlug}`}
                                    className="text-primary hover:text-primary/80 hover:underline transition-all cursor-pointer font-semibold text-[10px] sm:text-xs lg:text-sm"
                                  >
                                    <span className="truncate block max-w-[80px] sm:max-w-none">{row.sheetName}</span>
                                  </Link>
                                </TableCell>
                                <TableCell className="text-right font-medium text-gray-700 dark:text-gray-300 py-2 px-1.5 sm:py-3 sm:px-3 lg:px-6">
                                  <div className="text-right text-[10px] sm:text-xs lg:text-sm">{formatCurrency(row.valueFromC20)}</div>
                                </TableCell>
                                <TableCell className="text-right py-2 px-1.5 sm:py-3 sm:px-3 lg:px-6">
                                  {isEditing ? (
                                    <div className="flex justify-end">
                                      <Input
                                        type="text"
                                        value={editingValues[categorySlug]?.expectedPercent ?? (category ? category.expectedPercent.toString() : row.expectedPercent.toString())}
                                        onChange={(e) => handleUpdateEditingValue(categorySlug, "expectedPercent", e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleSave(categorySlug);
                                          }
                                        }}
                                        className="w-12 sm:w-16 lg:w-20 text-right text-[10px] sm:text-xs lg:text-sm border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary h-7 sm:h-8 lg:h-10"
                                        disabled={saving}
                                        autoFocus
                                      />
                                    </div>
                                  ) : (
                                    <div className="text-right font-medium text-gray-700 dark:text-gray-300 text-[10px] sm:text-xs lg:text-sm">
                                      {formatPercent(row.expectedPercent)}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-medium text-gray-700 dark:text-gray-300 py-2 px-1.5 sm:py-3 sm:px-3 lg:px-6">
                                  <div className="text-right text-[10px] sm:text-xs lg:text-sm">{formatCurrency(row.expectedAmt)}</div>
                                </TableCell>
                                <TableCell className={`text-right font-semibold py-2 px-1.5 sm:py-3 sm:px-3 lg:px-6 ${row.profitLoss >= 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                                  }`}>
                                  <div className="text-right text-[10px] sm:text-xs lg:text-sm">{formatCurrency(row.profitLoss)}</div>
                                </TableCell>
                                <TableCell className="text-right py-2 px-1.5 sm:py-3 sm:px-3 lg:px-6">
                                  {isEditing ? (
                                    <div className="flex justify-end">
                                      <Input
                                        type="text"
                                        value={editingValues[categorySlug]?.currentValue ?? (category ? formatNumberWithCommas(category.currentValue) : formatNumberWithCommas(row.currentValue))}
                                        onChange={(e) => handleUpdateEditingValue(categorySlug, "currentValue", e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleSave(categorySlug);
                                          }
                                        }}
                                        className="w-16 sm:w-24 lg:w-32 text-right text-[10px] sm:text-xs lg:text-sm border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary h-7 sm:h-8 lg:h-10"
                                        disabled={saving}
                                      />
                                    </div>
                                  ) : (
                                    <div className="text-right font-medium text-gray-700 dark:text-gray-300 text-[10px] sm:text-xs lg:text-sm">
                                      {formatCurrency(row.currentValue)}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="text-center py-2 px-1 sm:py-3 sm:px-2 lg:px-6">
                                  {isEditing ? (
                                    <div className="flex items-center justify-center gap-0.5 sm:gap-1 lg:gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleSave(categorySlug)}
                                        disabled={saving}
                                        className="h-6 w-6 sm:h-7 sm:w-7 lg:h-9 lg:w-9 hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                                      >
                                        <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleCancelEdit(categorySlug)}
                                        disabled={saving}
                                        className="h-6 w-6 sm:h-7 sm:w-7 lg:h-9 lg:w-9 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                      >
                                        <X className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEdit(categorySlug)}
                                      disabled={saving}
                                      className="h-6 w-6 sm:h-7 sm:w-7 lg:h-9 lg:w-9 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    >
                                      <Pencil className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-4 lg:w-4" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                      <TableFooter>
                        <TableRow className="bg-gradient-to-r from-gray-100/90 to-gray-200/90 dark:from-gray-800/90 dark:to-gray-700/90 border-t-2 border-gray-300 dark:border-gray-600 font-bold hover:bg-gradient-to-r hover:from-gray-100/90 hover:to-gray-200/90 dark:hover:from-gray-800/90 dark:hover:to-gray-700/90">
                          <TableCell className="font-bold text-gray-900 dark:text-gray-100 py-2 sm:py-3 lg:py-5 px-1.5 sm:px-3 lg:px-6 text-[10px] sm:text-xs lg:text-sm">
                            Totals
                          </TableCell>
                          <TableCell className="text-right font-bold text-gray-900 dark:text-gray-100 py-2 sm:py-3 lg:py-5 px-1.5 sm:px-3 lg:px-6 text-[10px] sm:text-xs lg:text-sm">
                            <div className="text-right">{formatCurrency(totalInvestment)}</div>
                          </TableCell>
                          <TableCell className="text-right font-bold text-gray-900 dark:text-gray-100 py-2 sm:py-3 lg:py-5 px-1.5 sm:px-3 lg:px-6 text-[10px] sm:text-xs lg:text-sm">
                            <div className="text-right">{formatPercent(avgExpected)}</div>
                          </TableCell>
                          <TableCell className="text-right font-bold text-gray-900 dark:text-gray-100 py-2 sm:py-3 lg:py-5 px-1.5 sm:px-3 lg:px-6 text-[10px] sm:text-xs lg:text-sm">
                            <div className="text-right">{formatCurrency(totalExpected)}</div>
                          </TableCell>
                          <TableCell className={`text-right font-bold py-2 sm:py-3 lg:py-5 px-1.5 sm:px-3 lg:px-6 text-[10px] sm:text-xs lg:text-sm ${totalProfitLoss >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                            }`}>
                            <div className="text-right">{formatCurrency(totalProfitLoss)}</div>
                          </TableCell>
                          <TableCell className="text-right font-bold text-gray-900 dark:text-gray-100 py-2 sm:py-3 lg:py-5 px-1.5 sm:px-3 lg:px-6 text-[10px] sm:text-xs lg:text-sm">
                            <div className="text-right">{formatCurrency(totalCurrent)}</div>
                          </TableCell>
                          <TableCell className="text-center py-2 sm:py-3 lg:py-5 px-1 sm:px-2 lg:px-6"></TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Details Section */}
          {categories.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 lg:mb-6 text-gray-900 dark:text-gray-100">Category Details</h2>
              <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((cat) => {
                  const totalInvested = cat.entries.reduce((sum, entry) => sum + entry.invested, 0);
                  const expectedAmt = totalInvested * (1 + cat.expectedPercent / 100);
                  const profitLoss = cat.currentValue - expectedAmt;
                  const profitPercent = totalInvested > 0 ? ((profitLoss / totalInvested) * 100) : 0;
                  const totalEntries = cat.entries.length;
                  const avgInvested = totalEntries > 0 ? totalInvested / totalEntries : 0;

                  return (
                    <motion.div
                      key={cat.slug}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="h-full hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-700/60 backdrop-blur-xl">
                        <CardHeader className="px-3 sm:px-6 pt-3 sm:pt-6 pb-2 sm:pb-4">
                          <CardTitle className="text-base sm:text-lg lg:text-xl flex items-center justify-between">
                            <span className="text-gray-900 dark:text-gray-100 truncate pr-2">
                              {cat.displayName || cat.name}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(`/categories/${cat.slug}`, '_blank')}
                              className="h-7 w-7 sm:h-8 sm:w-8 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary transition-colors flex-shrink-0"
                            >
                              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6 space-y-3 sm:space-y-4">
                          <div className="grid grid-cols-2 gap-2 sm:gap-4">
                            <div>
                              <div className="text-xs sm:text-sm text-muted-foreground mb-1">Total Invested</div>
                              <div className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 dark:text-gray-100 break-words">
                                {formatCurrency(totalInvested)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm text-muted-foreground mb-1">Current Value</div>
                              <div className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 dark:text-gray-100 break-words">
                                {formatCurrency(cat.currentValue)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm text-muted-foreground mb-1">Expected %</div>
                              <div className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 dark:text-gray-100">
                                {formatPercent(cat.expectedPercent)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm text-muted-foreground mb-1">Expected Amount</div>
                              <div className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 dark:text-gray-100 break-words">
                                {formatCurrency(expectedAmt)}
                              </div>
                            </div>
                          </div>
                          <div className={`p-2 sm:p-3 rounded-lg ${profitLoss >= 0
                            ? "bg-green-50/50 dark:bg-green-900/20"
                            : "bg-red-50/50 dark:bg-red-900/20"
                            }`}>
                            <div className="text-xs sm:text-sm text-muted-foreground mb-1">Profit/Loss</div>
                            <div className={`text-base sm:text-lg lg:text-xl font-bold ${profitLoss >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                              }`}>
                              {formatCurrency(profitLoss)}
                            </div>
                            <div className={`text-xs sm:text-sm mt-1 ${profitLoss >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                              }`}>
                              {profitPercent >= 0 ? "+" : ""}{profitPercent.toFixed(2)}%
                            </div>
                          </div>
                          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-xs sm:text-sm text-muted-foreground mb-1">Total Entries</div>
                            <div className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 dark:text-gray-100">
                              {totalEntries}
                            </div>
                            {totalEntries > 0 && (
                              <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                                Avg: {formatCurrency(avgInvested)}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {categories.length > 0 && (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Card className="border-0 bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-700/60 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 lg:pt-6 pb-2 sm:pb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg lg:text-xl text-gray-900 dark:text-gray-100">Investment Allocation</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Distribution across categories</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6">
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280} className="sm:h-[320px] lg:h-[360px]">
                        <PieChart>
                          <defs>
                            <linearGradient id="gradient1" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#667eea" stopOpacity={1} />
                              <stop offset="100%" stopColor="#764ba2" stopOpacity={1} />
                            </linearGradient>
                            <linearGradient id="gradient2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f093fb" stopOpacity={1} />
                              <stop offset="100%" stopColor="#f5576c" stopOpacity={1} />
                            </linearGradient>
                            <linearGradient id="gradient3" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#4facfe" stopOpacity={1} />
                              <stop offset="100%" stopColor="#00f2fe" stopOpacity={1} />
                            </linearGradient>
                            <linearGradient id="gradient4" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#43e97b" stopOpacity={1} />
                              <stop offset="100%" stopColor="#38f9d7" stopOpacity={1} />
                            </linearGradient>
                            <linearGradient id="gradient5" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#fa709a" stopOpacity={1} />
                              <stop offset="100%" stopColor="#fee140" stopOpacity={1} />
                            </linearGradient>
                            <linearGradient id="gradient6" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#30cfd0" stopOpacity={1} />
                              <stop offset="100%" stopColor="#330867" stopOpacity={1} />
                            </linearGradient>
                          </defs>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ percent }) => {
                              if (percent < 0.05) return ""; // Hide labels for very small slices
                              return `${(percent * 100).toFixed(0)}%`;
                            }}
                            outerRadius={pieData.length <= 3 ? 100 : 90}
                            innerRadius={pieData.length <= 3 ? 40 : 30}
                            paddingAngle={2}
                            fill="#8884d8"
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={800}
                            animationEasing="ease-out"
                          >
                            {pieData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={SOLID_COLORS[index % SOLID_COLORS.length]}
                                stroke="rgba(255, 255, 255, 0.8)"
                                strokeWidth={2}
                                style={{
                                  filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
                                  transition: 'all 0.3s ease',
                                }}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number, name: string, props: any) => [
                              formatCurrency(value),
                              props.payload.fullName || props.payload.name,
                            ]}
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '0.75rem',
                              color: 'hsl(var(--foreground))',
                              fontSize: '0.875rem',
                              padding: '0.75rem',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                            }}
                            labelStyle={{
                              fontWeight: 600,
                              marginBottom: '0.5rem',
                            }}
                          />
                          <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value, entry: any) => {
                              const percent = ((entry.payload.value / pieData.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1);
                              return `${value} (${percent}%)`;
                            }}
                            wrapperStyle={{
                              color: 'hsl(var(--foreground))',
                              fontSize: '0.75rem',
                              paddingTop: '1rem',
                            }}
                            iconType="circle"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                        <p className="text-sm">No investment data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Card className="border-0 bg-gradient-to-br from-white/80 to-white/60 dark:from-gray-800/80 dark:to-gray-700/60 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="px-3 sm:px-4 lg:px-6 pt-3 sm:pt-4 lg:pt-6 pb-2 sm:pb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10">
                        <Target className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg lg:text-xl text-gray-900 dark:text-gray-100">Expected vs Current Value</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">Target vs actual performance</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6">
                    {comparisonData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280} className="sm:h-[320px] lg:h-[360px]">
                        <BarChart
                          data={comparisonData}
                          margin={{ top: 20, right: 10, left: 0, bottom: 60 }}
                        >
                          <defs>
                            <linearGradient id="expectedGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#667eea" stopOpacity={0.9} />
                              <stop offset="100%" stopColor="#764ba2" stopOpacity={0.9} />
                            </linearGradient>
                            <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#4facfe" stopOpacity={0.9} />
                              <stop offset="100%" stopColor="#00f2fe" stopOpacity={0.9} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="hsl(var(--border))"
                            opacity={0.3}
                            vertical={false}
                          />
                          <XAxis
                            dataKey="name"
                            stroke="hsl(var(--muted-foreground))"
                            tick={{
                              fill: 'hsl(var(--muted-foreground))',
                              fontSize: 11,
                              fontWeight: 500,
                            }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            interval={0}
                          />
                          <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            tick={{
                              fill: 'hsl(var(--muted-foreground))',
                              fontSize: 11,
                            }}
                            tickFormatter={(value) => {
                              if (Math.abs(value) >= 1000000) return `₹${(value / 1000000).toFixed(1)}M`;
                              if (Math.abs(value) >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
                              return `₹${value}`;
                            }}
                            width={60}
                          />
                          <Tooltip
                            formatter={(value: number, name: string, props: any) => [
                              formatCurrency(value),
                              name === "Expected" ? "Expected Value" : "Current Value",
                            ]}
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '0.75rem',
                              color: 'hsl(var(--foreground))',
                              fontSize: '0.875rem',
                              padding: '0.75rem',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                            }}
                            labelStyle={{
                              fontWeight: 600,
                              marginBottom: '0.5rem',
                            }}
                            labelFormatter={(label) => comparisonData.find(d => d.name === label)?.fullName || label}
                            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                          />
                          <Legend
                            wrapperStyle={{
                              color: 'hsl(var(--foreground))',
                              fontSize: '0.75rem',
                              paddingTop: '0.5rem',
                            }}
                            iconType="square"
                          />
                          <Bar
                            dataKey="Expected"
                            fill="url(#expectedGradient)"
                            radius={[8, 8, 0, 0]}
                            animationBegin={0}
                            animationDuration={1000}
                            animationEasing="ease-out"
                            style={{
                              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                            }}
                          />
                          <Bar
                            dataKey="Current"
                            fill="url(#currentGradient)"
                            radius={[8, 8, 0, 0]}
                            animationBegin={100}
                            animationDuration={1000}
                            animationEasing="ease-out"
                            style={{
                              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                            }}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                        <p className="text-sm">No comparison data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

