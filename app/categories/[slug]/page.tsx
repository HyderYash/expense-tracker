"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { showToast } from "@/lib/toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/navigation";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2, TrendingUp, Package, Edit2, Pencil, Check, X, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Helper function to format number with commas
function formatNumberWithCommas(value: number | string): string {
  const numStr = String(value).replace(/,/g, "");
  if (!numStr || numStr === "0") return "";
  const num = parseFloat(numStr);
  if (isNaN(num)) return "";
  return num.toLocaleString("en-IN");
}

// Helper function to parse comma-formatted string to number
function parseFormattedNumber(value: string): number {
  const numStr = value.replace(/,/g, "").trim();
  if (!numStr) return 0;
  const num = parseFloat(numStr);
  return isNaN(num) ? 0 : num;
}

interface Entry {
  name: string;
  quantity: number;
  invested: number;
  currentValue?: number;
  expectedPercent?: number;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  expectedPercent: number;
  currentValue: number;
  entries: Entry[];
  displayName?: string;
  description?: string;
}

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValues, setEditingValues] = useState<Record<number, { name: string; quantity: string; invested: string; currentValue: string; expectedPercent: string }>>({});
  const [newEntry, setNewEntry] = useState({ name: "", quantity: "", invested: "", currentValue: "", expectedPercent: "10" });
  const [saving, setSaving] = useState(false);
  const [displayValues, setDisplayValues] = useState<Record<number, { quantity: string; invested: string }>>({});
  const [editingCategory, setEditingCategory] = useState(false);
  const [categoryEditValues, setCategoryEditValues] = useState({ displayName: "" });
  const [showStatsCards, setShowStatsCards] = useState(false); // Mobile only - hide by default
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null);

  const fetchCategory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/categories/${slug}`);
      const result = await response.json();
      if (result.success) {
        setCategory(result.data);
        // Initialize display values
        const display: Record<number, { quantity: string; invested: string }> = {};
        result.data.entries.forEach((entry: Entry, index: number) => {
          display[index] = {
            quantity: String(entry.quantity),
            invested: formatNumberWithCommas(entry.invested),
          };
        });
        setDisplayValues(display);
      }
    } catch (error) {
      console.error("Error fetching category:", error);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchCategory();
  }, [fetchCategory]);


  const handleAdd = async () => {
    const quantity = parseFloat(newEntry.quantity) || 0;
    const investedNum = parseFormattedNumber(newEntry.invested);
    // Allow 0 as a valid value, only use null if the field is empty
    const currentValueNum = newEntry.currentValue.trim() !== "" ? parseFormattedNumber(newEntry.currentValue) : null;
    // Default to 10% if field is empty
    const expectedPercentNum = newEntry.expectedPercent.trim() !== "" ? parseFloat(newEntry.expectedPercent) : 10;

    if (!newEntry.name || quantity <= 0 || investedNum <= 0) return;
    if (!category) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/categories/${slug}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newEntry.name,
          quantity: quantity,
          invested: investedNum,
          currentValue: currentValueNum,
          expectedPercent: expectedPercentNum,
        }),
      });

      if (response.ok) {
        showToast.success("Entry added", "New entry has been added successfully");
        setNewEntry({ name: "", quantity: "", invested: "", currentValue: "", expectedPercent: "10" });
        await fetchCategory();
      } else {
        const result = await response.json();
        showToast.error("Add failed", result.error || "Error adding entry");
      }
    } catch (error) {
      console.error("Error adding entry:", error);
      showToast.error("Add failed", "Error adding entry. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (index: number) => {
    if (!category) return;
    const entry = category.entries[index];
    setEditingIndex(index);
    setEditingValues({
      ...editingValues,
      [index]: {
        name: entry.name,
        quantity: String(entry.quantity),
        invested: formatNumberWithCommas(entry.invested),
        currentValue: (entry.currentValue !== undefined && entry.currentValue !== null) ? formatNumberWithCommas(entry.currentValue) : "",
        expectedPercent: (entry.expectedPercent !== undefined && entry.expectedPercent !== null) ? entry.expectedPercent.toString() : "10",
      },
    });
  };

  const handleCancelEdit = (index: number) => {
    setEditingIndex(null);
    setEditingValues((prev) => {
      const newValues = { ...prev };
      delete newValues[index];
      return newValues;
    });
  };

  const handleSave = async (entryIndex: number) => {
    if (!category) return;
    const editValues = editingValues[entryIndex];
    if (!editValues) return;

    const quantity = parseFloat(editValues.quantity) || 0;
    const invested = parseFormattedNumber(editValues.invested);
    // Allow 0 as a valid value, only use undefined if the field is empty
    const currentValue = editValues.currentValue.trim() !== "" ? parseFormattedNumber(editValues.currentValue) : null;
    // Default to 10% if field is empty
    const expectedPercent = editValues.expectedPercent.trim() !== "" ? parseFloat(editValues.expectedPercent) : 10;
    const name = editValues.name.trim();

    if (!name) {
      showToast.error("Validation error", "Name is required");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/categories/${slug}/entries`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryIndex,
          name,
          quantity,
          invested,
          currentValue,
          expectedPercent,
        }),
      });

      if (response.ok) {
        showToast.success("Entry updated", "Changes have been saved successfully");
        await fetchCategory();
        setEditingIndex(null);
        setEditingValues((prev) => {
          const newValues = { ...prev };
          delete newValues[entryIndex];
          return newValues;
        });
      } else {
        const result = await response.json();
        showToast.error("Update failed", result.error || "Error updating entry");
      }
    } catch (error) {
      console.error("Error updating entry:", error);
      showToast.error("Update failed", "Error updating entry. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEditingValue = (index: number, field: "name" | "quantity" | "invested" | "currentValue" | "expectedPercent", value: string) => {
    if (field === "invested" || field === "currentValue") {
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
        [index]: {
          ...prev[index],
          [field]: val,
        },
      }));
    } else if (field === "quantity" || field === "expectedPercent") {
      const val = value.replace(/[^0-9.]/g, "");
      setEditingValues((prev) => ({
        ...prev,
        [index]: {
          ...prev[index],
          [field]: val,
        },
      }));
    } else {
      setEditingValues((prev) => ({
        ...prev,
        [index]: {
          ...prev[index],
          name: value,
        },
      }));
    }
  };

  const handleDeleteClick = (entryIndex: number) => {
    setEntryToDelete(entryIndex);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!category || entryToDelete === null) return;

    try {
      setSaving(true);
      setDeleteDialogOpen(false);
      const response = await fetch(`/api/categories/${slug}/entries?entryIndex=${entryToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showToast.success("Entry deleted", "Entry has been removed successfully");
        await fetchCategory();
      } else {
        const result = await response.json();
        showToast.error("Delete failed", result.error || "Error deleting entry");
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
      showToast.error("Delete failed", "Error deleting entry. Please try again.");
    } finally {
      setSaving(false);
      setEntryToDelete(null);
    }
  };

  const handleEditCategory = () => {
    if (!category) return;
    setEditingCategory(true);
    setCategoryEditValues({
      displayName: category.displayName || category.name,
    });
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategory(false);
    setCategoryEditValues({ displayName: "" });
  };

  const handleSaveCategory = async () => {
    if (!category) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/categories/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: categoryEditValues.displayName.trim() || undefined,
        }),
      });

      const result = await response.json();
      if (result.success) {
        await fetchCategory();
        setEditingCategory(false);
        setCategoryEditValues({ displayName: "" });
        showToast.success("Category updated", "Display name has been updated");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Navigation />
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8">
          <div className="space-y-6">
            <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Navigation />
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Category not found</div>
          </div>
        </div>
      </div>
    );
  }

  const total = category.entries.reduce((sum, entry) => sum + entry.invested, 0);
  const displayName = category.displayName || category.name;
  const avgInvested = category.entries.length > 0 ? total / category.entries.length : 0;

  // Calculate weighted expected percentage for the category based on its entries
  const getCategoryExpectedPercent = (): number => {
    if (total === 0) return 10; // Default to 10% if no investments

    // Calculate weighted average based on invested amounts
    const weightedSum = category.entries.reduce((sum, entry) => {
      const expectedPercent = entry.expectedPercent ?? 10; // Default to 10% if not set
      return sum + (entry.invested * expectedPercent);
    }, 0);

    return weightedSum / total;
  };

  // Calculate profit/loss like Groww: Returns = Current Value - Invested Amount
  const profitLoss = category.currentValue - total; // Profit/Loss = Current Value - Total Invested
  const profitPercent = total > 0 ? ((profitLoss / total) * 100) : 0;

  // Calculate current value for each entry - use entry's currentValue if available (including 0), otherwise calculate proportionally
  const getEntryCurrentValue = (entry: Entry) => {
    // Check if currentValue is explicitly set (including 0) vs undefined/null
    if (entry.currentValue !== undefined && entry.currentValue !== null) {
      return entry.currentValue;
    }
    // Fallback to proportional calculation if no currentValue set
    if (total === 0) return 0;
    return (entry.invested / total) * category.currentValue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation />
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4 sm:space-y-6"
        >
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              {editingCategory ? (
                <div className="space-y-3">
                  <Input
                    value={categoryEditValues.displayName}
                    onChange={(e) => setCategoryEditValues(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Category Name"
                    className="text-lg sm:text-xl lg:text-2xl font-bold h-10 sm:h-12"
                    disabled={saving}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleSaveCategory}
                      disabled={saving}
                      size="sm"
                      className="hover:bg-green-600 dark:hover:bg-green-700 dark:bg-green-600 dark:text-white"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      onClick={handleCancelCategoryEdit}
                      disabled={saving}
                      variant="outline"
                      size="sm"
                      className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700/50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent break-words">
                  {displayName}
                </h1>
              )}
            </div>
            {!editingCategory && (
              <Button
                variant="ghost"
                onClick={handleEditCategory}
                className="flex items-center gap-2 hover:bg-primary/10 dark:hover:bg-primary/20 w-full sm:w-auto justify-center sm:justify-start"
              >
                <Edit2 className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                <span className="text-xs sm:text-sm text-muted-foreground">Click to edit</span>
              </Button>
            )}
          </div>

          {/* Stats Cards - Mobile: Hidden by default with toggle, Desktop: Always visible */}
          <div className="block sm:hidden mb-3">
            <Button
              variant="outline"
              onClick={() => setShowStatsCards(!showStatsCards)}
              className="w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                View Summary
              </span>
              {showStatsCards ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className={`space-y-3 sm:space-y-0 sm:grid sm:gap-4 sm:grid-cols-2 md:grid-cols-4 ${showStatsCards ? 'block' : 'hidden sm:block'}`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="h-full"
            >
              <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/30 hover:shadow-lg transition-shadow h-full">
                <CardContent className="p-4 sm:p-4 lg:p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between flex-1">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Total Invested</p>
                      <p className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-100">{formatCurrency(total)}</p>
                      <div className="h-5"></div>
                    </div>
                    <div className="p-3 rounded-full bg-blue-200/50 dark:bg-blue-800/50 flex-shrink-0 flex items-center justify-center">
                      <span className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-blue-300">₹</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="h-full"
            >
              <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/30 dark:to-green-800/30 hover:shadow-lg transition-shadow h-full">
                <CardContent className="p-4 sm:p-4 lg:p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between flex-1">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Current Value</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100">{formatCurrency(category.currentValue)}</p>
                      <div className="h-5"></div>
                    </div>
                    <div className="p-3 rounded-full bg-green-200/50 dark:bg-green-800/50 flex-shrink-0">
                      <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-700 dark:text-green-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="h-full"
            >
              <Card className={`border-0 shadow-md hover:shadow-lg transition-shadow h-full ${profitLoss >= 0
                ? "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/30 dark:to-emerald-800/30"
                : "bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/30 dark:to-red-800/30"
                }`}>
                <CardContent className="p-4 sm:p-4 lg:p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between flex-1">
                    <div className="flex-1">
                      <p className={`text-sm font-medium mb-1 ${profitLoss >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}`}>
                        Profit/Loss
                      </p>
                      <p className={`text-xl sm:text-2xl font-bold mb-1 ${profitLoss >= 0 ? "text-emerald-900 dark:text-emerald-100" : "text-red-900 dark:text-red-100"}`}>
                        {formatCurrency(profitLoss)}
                      </p>
                      <p className={`text-xs ${profitLoss >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {profitPercent >= 0 ? "+" : ""}{profitPercent.toFixed(2)}%
                      </p>
                    </div>
                    <div className={`p-3 rounded-full flex-shrink-0 ${profitLoss >= 0 ? "bg-emerald-200/50 dark:bg-emerald-800/50" : "bg-red-200/50 dark:bg-red-800/50"}`}>
                      <TrendingUp className={`h-5 w-5 sm:h-6 sm:w-6 ${profitLoss >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300 rotate-180"}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="h-full"
            >
              <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/30 dark:to-purple-800/30 hover:shadow-lg transition-shadow h-full">
                <CardContent className="p-4 sm:p-4 lg:p-6 h-full flex flex-col">
                  <div className="flex items-center justify-between flex-1">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Total Entries</p>
                      <p className="text-xl sm:text-2xl font-bold text-purple-900 dark:text-purple-100 mb-1">{category.entries.length}</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        Avg: {formatCurrency(avgInvested)}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-purple-200/50 dark:bg-purple-800/50 flex-shrink-0">
                      <Package className="h-5 w-5 sm:h-6 sm:w-6 text-purple-700 dark:text-purple-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Table Section */}
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/90 backdrop-blur-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/90 dark:to-gray-700/90 border-b border-gray-200 dark:border-gray-600 px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl sm:text-2xl font-bold break-words text-gray-900 dark:text-gray-100">Holdings</CardTitle>
                  <CardDescription className="mt-1 text-sm">Manage your investments with real-time updates</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Mobile: Card Layout, Desktop: Table */}
              <div className="block sm:hidden">
                {category.entries.length === 0 ? (
                  <div className="p-8 text-center">
                    <Package className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">No entries found</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Add your first investment below</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {category.entries.map((entry, index) => {
                      const isEditing = editingIndex === index;
                      const editValues = editingValues[index];

                      return (
                        <div
                          key={index}
                          className="p-3 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              {isEditing ? (
                                <Input
                                  value={editValues?.name ?? entry.name}
                                  onChange={(e) => handleUpdateEditingValue(index, "name", e.target.value)}
                                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 font-medium bg-white dark:bg-gray-800/50 text-foreground text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                                  placeholder="Investment name"
                                />
                              ) : (
                                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{entry.name}</h3>
                              )}
                            </div>
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              {isEditing ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleSave(index)}
                                    disabled={saving}
                                    className="h-7 w-7 hover:bg-green-50 dark:hover:bg-green-900/40 hover:text-green-600 dark:hover:text-green-400 dark:text-gray-300"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleCancelEdit(index)}
                                    disabled={saving}
                                    className="h-7 w-7 hover:bg-gray-100 dark:hover:bg-gray-700/80 dark:text-gray-300"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(index)}
                                    disabled={saving}
                                    className="h-7 w-7 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400 dark:text-gray-300"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteClick(index)}
                                    disabled={saving}
                                    className="h-7 w-7 hover:bg-red-50 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400 dark:text-gray-300"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">Qty</p>
                              {isEditing ? (
                                <Input
                                  type="text"
                                  value={editValues?.quantity ?? String(entry.quantity)}
                                  onChange={(e) => handleUpdateEditingValue(index, "quantity", e.target.value)}
                                  className="w-full text-right border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800/50 text-foreground text-xs focus:border-primary focus:ring-1 focus:ring-primary"
                                  placeholder="0"
                                />
                              ) : (
                                <p className="font-medium text-xs text-gray-900 dark:text-gray-100">{entry.quantity}</p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">Invested</p>
                              {isEditing ? (
                                <Input
                                  type="text"
                                  value={editValues?.invested ?? formatNumberWithCommas(entry.invested)}
                                  onChange={(e) => handleUpdateEditingValue(index, "invested", e.target.value)}
                                  className="w-full text-right border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800/50 text-foreground text-xs focus:border-primary focus:ring-1 focus:ring-primary"
                                  placeholder="0"
                                />
                              ) : (
                                <p className="font-medium text-xs text-gray-900 dark:text-gray-100">{formatCurrency(entry.invested)}</p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">Current</p>
                              {isEditing ? (
                                <Input
                                  type="text"
                                  value={editValues?.currentValue ?? formatNumberWithCommas(getEntryCurrentValue(entry))}
                                  onChange={(e) => handleUpdateEditingValue(index, "currentValue", e.target.value)}
                                  className="w-full text-right border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800/50 text-foreground text-xs focus:border-primary focus:ring-1 focus:ring-primary"
                                  placeholder="0"
                                />
                              ) : (
                                <p className="font-medium text-xs text-gray-900 dark:text-gray-100">{formatCurrency(getEntryCurrentValue(entry))}</p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">P/L</p>
                              {(() => {
                                const entryCurrentValue = getEntryCurrentValue(entry);
                                const profitLoss = entryCurrentValue - entry.invested; // Returns = Current Value - Invested Amount
                                return (
                                  <p className={`font-semibold text-xs ${profitLoss >= 0
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                    }`}>
                                    {profitLoss >= 0 ? "+" : ""}{formatCurrency(profitLoss)}
                                  </p>
                                );
                              })()}
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">Exp %</p>
                              {isEditing ? (
                                <Input
                                  type="text"
                                  value={editValues?.expectedPercent ?? ""}
                                  onChange={(e) => handleUpdateEditingValue(index, "expectedPercent", e.target.value)}
                                  onBlur={(e) => {
                                    if (!e.target.value.trim()) {
                                      handleUpdateEditingValue(index, "expectedPercent", "10");
                                    }
                                  }}
                                  className="w-full text-right border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800/50 text-foreground text-xs focus:border-primary focus:ring-1 focus:ring-primary"
                                  placeholder="10"
                                />
                              ) : (
                                <p className="font-medium text-xs text-gray-900 dark:text-gray-100">
                                  {entry.expectedPercent !== undefined && entry.expectedPercent !== null ? `${entry.expectedPercent.toFixed(1)}%` : "10.0%"}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">Exp Val</p>
                              {(() => {
                                const expectedPercent = entry.expectedPercent ?? 10;
                                const expectedValue = entry.invested * (1 + expectedPercent / 100);
                                return (
                                  <p className="font-medium text-xs text-gray-900 dark:text-gray-100">
                                    {formatCurrency(expectedValue)}
                                  </p>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Desktop: Table Layout */}
              <div className="hidden sm:block overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/80 dark:bg-gray-800/90 border-b border-gray-200 dark:border-gray-600">
                          <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 py-3 px-3 sm:px-6 whitespace-nowrap">
                            <span className="hidden sm:inline">Investment Name</span>
                            <span className="sm:hidden">Name</span>
                          </TableHead>
                          <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 py-3 px-3 sm:px-6 whitespace-nowrap">
                            Qty
                          </TableHead>
                          <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 py-3 px-3 sm:px-6 whitespace-nowrap">
                            <span className="hidden sm:inline">Invested Amount</span>
                            <span className="sm:hidden">Invested</span>
                          </TableHead>
                          <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 py-3 px-3 sm:px-6 whitespace-nowrap">
                            <span className="hidden sm:inline">Current Value</span>
                            <span className="sm:hidden">Current</span>
                          </TableHead>
                          <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 py-3 px-3 sm:px-6 whitespace-nowrap">
                            <span className="hidden sm:inline">Profit/Loss</span>
                            <span className="sm:hidden">P/L</span>
                          </TableHead>
                          <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 py-3 px-3 sm:px-6 whitespace-nowrap">
                            <span className="hidden sm:inline">Expected %</span>
                            <span className="sm:hidden">Exp %</span>
                          </TableHead>
                          <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 py-3 px-3 sm:px-6 whitespace-nowrap">
                            <span className="hidden sm:inline">Expected Value</span>
                            <span className="sm:hidden">Exp Val</span>
                          </TableHead>
                          <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300 py-3 px-3 sm:px-6 whitespace-nowrap">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {category.entries.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-12">
                              <div className="flex flex-col items-center gap-3">
                                <Package className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                                <p className="text-gray-500 dark:text-gray-400 font-medium">No entries found</p>
                                <p className="text-sm text-gray-400 dark:text-gray-500">Add your first investment below</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          category.entries.map((entry, index) => {
                            const isEditing = editingIndex === index;
                            const editValues = editingValues[index];

                            return (
                              <TableRow
                                key={index}
                                className="border-b border-gray-100 dark:border-gray-700/80 hover:bg-gray-50/50 dark:hover:bg-gray-800/70 transition-colors"
                              >
                                <TableCell className="py-3 px-3 sm:px-6">
                                  {isEditing ? (
                                    <Input
                                      value={editValues?.name ?? entry.name}
                                      onChange={(e) => handleUpdateEditingValue(index, "name", e.target.value)}
                                      className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 font-medium bg-white dark:bg-gray-800/50 text-foreground text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                                      placeholder="Investment name"
                                    />
                                  ) : (
                                    <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">{entry.name}</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right py-3 px-3 sm:px-6">
                                  {isEditing ? (
                                    <div className="flex justify-end">
                                      <Input
                                        type="text"
                                        value={editValues?.quantity ?? String(entry.quantity)}
                                        onChange={(e) => handleUpdateEditingValue(index, "quantity", e.target.value)}
                                        className="w-16 sm:w-24 text-right border border-gray-200 dark:border-gray-600 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 bg-white dark:bg-gray-800/50 text-foreground text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                                        placeholder="0"
                                      />
                                    </div>
                                  ) : (
                                    <span className="font-medium text-xs sm:text-sm text-gray-700 dark:text-gray-300">{entry.quantity}</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right py-3 px-3 sm:px-6">
                                  {isEditing ? (
                                    <div className="flex justify-end">
                                      <Input
                                        type="text"
                                        value={editValues?.invested ?? formatNumberWithCommas(entry.invested)}
                                        onChange={(e) => handleUpdateEditingValue(index, "invested", e.target.value)}
                                        className="w-24 sm:w-32 text-right border border-gray-200 dark:border-gray-600 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 bg-white dark:bg-gray-800/50 text-foreground text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                                        placeholder="0"
                                      />
                                    </div>
                                  ) : (
                                    <span className="font-medium text-xs sm:text-sm text-gray-700 dark:text-gray-300">{formatNumberWithCommas(entry.invested)}</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right py-3 px-3 sm:px-6">
                                  {isEditing ? (
                                    <div className="flex justify-end">
                                      <Input
                                        type="text"
                                        value={editValues?.currentValue ?? formatNumberWithCommas(getEntryCurrentValue(entry))}
                                        onChange={(e) => handleUpdateEditingValue(index, "currentValue", e.target.value)}
                                        className="w-24 sm:w-32 text-right border border-gray-200 dark:border-gray-600 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 bg-white dark:bg-gray-800/50 text-foreground text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                                        placeholder="0"
                                      />
                                    </div>
                                  ) : (
                                    <span className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100">{formatCurrency(getEntryCurrentValue(entry))}</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right py-3 px-3 sm:px-6">
                                  {(() => {
                                    const entryCurrentValue = getEntryCurrentValue(entry);
                                    const profitLoss = entryCurrentValue - entry.invested; // Returns = Current Value - Invested Amount
                                    return (
                                      <span className={`font-semibold text-xs sm:text-sm ${profitLoss >= 0
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-red-600 dark:text-red-400"
                                        }`}>
                                        {profitLoss >= 0 ? "+" : ""}{formatCurrency(profitLoss)}
                                      </span>
                                    );
                                  })()}
                                </TableCell>
                                <TableCell className="text-right py-3 px-3 sm:px-6">
                                  {isEditing ? (
                                    <div className="flex justify-end">
                                      <Input
                                        type="text"
                                        value={editValues?.expectedPercent ?? ""}
                                        onChange={(e) => handleUpdateEditingValue(index, "expectedPercent", e.target.value)}
                                        onBlur={(e) => {
                                          if (!e.target.value.trim()) {
                                            handleUpdateEditingValue(index, "expectedPercent", "10");
                                          }
                                        }}
                                        className="w-16 sm:w-20 text-right border border-gray-200 dark:border-gray-600 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 bg-white dark:bg-gray-800/50 text-foreground text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                                        placeholder="10"
                                      />
                                    </div>
                                  ) : (
                                    <span className="font-medium text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                                      {entry.expectedPercent !== undefined && entry.expectedPercent !== null ? `${entry.expectedPercent.toFixed(1)}%` : "10.0%"}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right py-3 px-3 sm:px-6">
                                  {(() => {
                                    const expectedPercent = entry.expectedPercent ?? 10;
                                    const expectedValue = entry.invested * (1 + expectedPercent / 100);
                                    return (
                                      <span className="font-medium text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                                        {formatCurrency(expectedValue)}
                                      </span>
                                    );
                                  })()}
                                </TableCell>
                                <TableCell className="text-center py-3 px-3 sm:px-6">
                                  <div className="flex items-center justify-center gap-1">
                                    {isEditing ? (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleSave(index)}
                                          disabled={saving}
                                          className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-green-50 dark:hover:bg-green-900/40 hover:text-green-600 dark:hover:text-green-400 dark:text-gray-300 transition-colors"
                                        >
                                          <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleCancelEdit(index)}
                                          disabled={saving}
                                          className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-gray-100 dark:hover:bg-gray-700/80 dark:text-gray-300 transition-colors"
                                        >
                                          <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                        </Button>
                                      </>
                                    ) : (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleEdit(index)}
                                          disabled={saving}
                                          className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400 dark:text-gray-300 transition-colors"
                                        >
                                          <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleDeleteClick(index)}
                                          disabled={saving}
                                          className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-red-50 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400 dark:text-gray-300 transition-colors"
                                        >
                                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                      {category.entries.length > 0 && (
                        <TableFooter>
                          <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/90 dark:to-gray-700/90 border-t-2 border-gray-200 dark:border-gray-600">
                            <TableCell colSpan={2} className="font-bold text-gray-900 dark:text-gray-100 py-4 px-6">
                              Total Investment
                            </TableCell>
                            <TableCell className="text-right font-bold text-gray-900 dark:text-gray-100 py-4 px-6 text-lg">
                              {formatCurrency(total)}
                            </TableCell>
                            <TableCell className="text-right font-bold text-gray-900 dark:text-gray-100 py-4 px-6 text-lg">
                              {formatCurrency(category.currentValue)}
                            </TableCell>
                            <TableCell className={`text-right font-bold py-4 px-6 text-lg ${profitLoss >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                              }`}>
                              {profitLoss >= 0 ? "+" : ""}{formatCurrency(profitLoss)}
                            </TableCell>
                            <TableCell className="text-right font-bold text-gray-900 dark:text-gray-100 py-4 px-6 text-lg">
                              {formatPercent(getCategoryExpectedPercent())}
                            </TableCell>
                            <TableCell className="text-right font-bold text-gray-900 dark:text-gray-100 py-4 px-6 text-lg">
                              {(() => {
                                const totalExpectedAmount = category.entries.reduce((sum, entry) => {
                                  const expectedPercent = entry.expectedPercent ?? 10;
                                  const expectedAmount = entry.invested * (1 + expectedPercent / 100);
                                  return sum + expectedAmount;
                                }, 0);
                                return formatCurrency(totalExpectedAmount);
                              })()}
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        </TableFooter>
                      )}
                    </Table>
                  </div>
                </div>
              </div>

              {/* Mobile Total */}
              {category.entries.length > 0 && (
                <div className="block sm:hidden px-3 py-2.5 bg-gray-50/50 dark:bg-gray-800/70 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">Total</span>
                    <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{formatCurrency(total)}</span>
                  </div>
                </div>
              )}

              {/* Add Entry Form */}
              <div className="p-3 sm:p-6 bg-gray-50/50 dark:bg-gray-800/70 border-t border-gray-200 dark:border-gray-600">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Input
                    placeholder="Investment name"
                    value={newEntry.name}
                    onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
                    className="flex-1 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/50 focus:border-primary h-9 sm:h-10 text-xs sm:text-base"
                  />
                  <Input
                    type="text"
                    placeholder="Qty"
                    value={newEntry.quantity}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, "");
                      setNewEntry({ ...newEntry, quantity: val });
                    }}
                    className="w-full sm:w-32 border-gray-200 dark:border-gray-600 focus:border-primary h-9 sm:h-10 text-xs sm:text-base"
                  />
                  <Input
                    type="text"
                    placeholder="Amount"
                    value={newEntry.invested}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9,]/g, "");
                      const numStr = val.replace(/,/g, "");
                      if (numStr) {
                        const num = parseFloat(numStr);
                        if (!isNaN(num)) {
                          val = formatNumberWithCommas(num);
                        }
                      }
                      setNewEntry({ ...newEntry, invested: val });
                    }}
                    onBlur={(e) => {
                      const num = parseFormattedNumber(e.target.value);
                      setNewEntry({ ...newEntry, invested: formatNumberWithCommas(num) });
                    }}
                    className="w-full sm:w-40 border-gray-200 dark:border-gray-600 focus:border-primary h-9 sm:h-10 text-xs sm:text-base"
                  />
                  <Input
                    type="text"
                    placeholder="Current Value (optional)"
                    value={newEntry.currentValue}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9,]/g, "");
                      const numStr = val.replace(/,/g, "");
                      if (numStr) {
                        const num = parseFloat(numStr);
                        if (!isNaN(num)) {
                          val = formatNumberWithCommas(num);
                        }
                      }
                      setNewEntry({ ...newEntry, currentValue: val });
                    }}
                    onBlur={(e) => {
                      const num = parseFormattedNumber(e.target.value);
                      setNewEntry({ ...newEntry, currentValue: formatNumberWithCommas(num) });
                    }}
                    className="w-full sm:w-40 border-gray-200 dark:border-gray-700 focus:border-primary h-9 sm:h-10 text-xs sm:text-base"
                  />
                  <Input
                    type="text"
                    placeholder="Expected % (optional)"
                    value={newEntry.expectedPercent}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, "");
                      setNewEntry({ ...newEntry, expectedPercent: val });
                    }}
                    className="w-full sm:w-32 border-gray-200 dark:border-gray-600 focus:border-primary h-9 sm:h-10 text-xs sm:text-base"
                  />
                  <Button
                    onClick={handleAdd}
                    disabled={saving}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/80 dark:text-primary-foreground font-medium px-3 sm:px-6 h-9 sm:h-10 text-xs sm:text-base w-full sm:w-auto shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    )}
                    <span className="hidden sm:inline">Add Entry</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <DialogTitle className="text-xl">Delete Entry</DialogTitle>
              </div>
              <DialogDescription className="text-base pt-2">
                Are you sure you want to delete this entry? This action cannot be undone and will permanently remove the entry and its associated data.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setEntryToDelete(null);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

