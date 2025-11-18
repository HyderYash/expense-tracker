"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/navigation";
import { showToast } from "@/lib/toast";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Category {
  _id: string;
  name: string;
  slug: string;
  expectedPercent: number;
  currentValue: number;
  displayName?: string;
  description?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    expectedPercent: 0,
    currentValue: 0,
    displayName: "",
    description: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        fetchCategories();
      } else {
        router.push("/signin");
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      router.push("/signin");
    }
  };

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

  const generateSlug = (name: string) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const slug = formData.slug.trim() || generateSlug(formData.name);
      if (!slug) {
        showToast.error("Validation error", "Please provide a valid name or slug");
        setSaving(false);
        return;
      }

      const payload = {
        name: formData.name.trim(),
        slug: slug,
        expectedPercent: 15,
        currentValue: 0,
      };

      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setFormData({
          name: "",
          slug: "",
          expectedPercent: 0,
          currentValue: 0,
          displayName: "",
          description: "",
        });
        setSlugManuallyEdited(false);
        await fetchCategories();
        // Dispatch event to update navigation
        showToast.success("Category created", "New category has been created successfully");
        window.dispatchEvent(new Event("categoriesUpdated"));
      } else {
        showToast.error("Create failed", result.error || "Error creating category");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      showToast.error("Create failed", "Error creating category. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (slug: string) => {
    setCategoryToDelete(slug);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      setSaving(true);
      setDeleteDialogOpen(false);
      const response = await fetch(`/api/categories/${categoryToDelete}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showToast.success("Category deleted", "Category has been removed successfully");
        await fetchCategories();
        // Dispatch event to update navigation
        window.dispatchEvent(new Event("categoriesUpdated"));
      } else {
        showToast.error("Delete failed", "Failed to delete category. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      showToast.error("Delete failed", "Error deleting category. Please try again.");
    } finally {
      setSaving(false);
      setCategoryToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Navigation />
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-8">
          <div className="space-y-6">
            <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
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
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-gray-900 dark:text-gray-100">Manage Categories</h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">Create and manage your investment categories</p>

          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
            <Card className="border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl shadow-lg">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-gray-100">Add New Category</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Create a new investment category</CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block text-gray-900 dark:text-gray-100">
                      Category Name <span className="text-red-500 dark:text-red-400">*</span>
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setFormData({
                          ...formData,
                          name: name,
                          slug: slugManuallyEdited ? formData.slug : generateSlug(name),
                        });
                      }}
                      placeholder="e.g., Stocks"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block text-gray-900 dark:text-gray-100">
                      Slug <span className="text-gray-400 dark:text-gray-500 text-xs">(auto-generated)</span>
                    </label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => {
                        setSlugManuallyEdited(true);
                        setFormData({ ...formData, slug: e.target.value });
                      }}
                      onFocus={() => {
                        if (!slugManuallyEdited && !formData.slug) {
                          setFormData({ ...formData, slug: generateSlug(formData.name) });
                        }
                      }}
                      placeholder="Auto-generated from name"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      URL-friendly identifier (e.g., stocks, mutual-fund)
                    </p>
                  </div>
                  <Button type="submit" disabled={saving} className="w-full">
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Category
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl shadow-lg">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-gray-100">Existing Categories</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Manage your categories</CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden max-h-[600px] overflow-y-auto">
                      <Table>
                        <TableHeader className="sticky top-0 z-10 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">
                          <TableRow>
                            <TableHead className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 py-3 px-3 sm:px-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">Name</TableHead>
                            <TableHead className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 py-3 px-3 sm:px-6 hidden sm:table-cell bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">Slug</TableHead>
                            <TableHead className="text-right text-xs sm:text-sm text-gray-700 dark:text-gray-300 py-3 px-3 sm:px-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                  <TableBody>
                    {categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No categories yet
                        </TableCell>
                      </TableRow>
                    ) : (
                        categories.map((category) => (
                          <TableRow key={category._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                            <TableCell className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 py-3 px-3 sm:px-6">
                              {category.displayName || category.name}
                              <div className="text-xs text-muted-foreground sm:hidden mt-1">{category.slug}</div>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm text-muted-foreground py-3 px-3 sm:px-6 hidden sm:table-cell">{category.slug}</TableCell>
                            <TableCell className="text-right py-3 px-3 sm:px-6">
                              <div className="flex justify-end gap-1 sm:gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => router.push(`/categories/${category.slug}`)}
                                  className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteClick(category.slug)}
                                  disabled={saving}
                                  className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 dark:text-red-400" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <DialogTitle className="text-xl">Delete Category</DialogTitle>
                </div>
                <DialogDescription className="text-base pt-2">
                  Are you sure you want to delete this category? This action cannot be undone and will permanently remove the category and all its associated data.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setCategoryToDelete(null);
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
        </motion.div>
      </div>
    </div>
  );
}

