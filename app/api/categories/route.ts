import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import { getCurrentUser } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectDB();
    const userId = new mongoose.Types.ObjectId(user.userId);
    const categories = await Category.find({ userId }).sort({ name: 1 });
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectDB();
    const body = await request.json();
    
    const { name, slug, expectedPercent, currentValue, displayName, description } = body;
    
    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Normalize slug: lowercase, trim, replace special chars with dashes, remove leading/trailing dashes
    const normalizedSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    if (!normalizedSlug) {
      return NextResponse.json(
        { success: false, error: "Invalid slug. Please provide a valid category name or slug." },
        { status: 400 }
      );
    }

    // Convert userId to ObjectId
    let userId: mongoose.Types.ObjectId;
    try {
      userId = new mongoose.Types.ObjectId(user.userId);
    } catch (error) {
      console.error("Invalid userId format:", user.userId, error);
      return NextResponse.json(
        { success: false, error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // Ensure correct indexes exist and remove old incorrect ones
    try {
      // Drop the old slug_1 index if it exists (it enforces uniqueness on slug alone, which is wrong)
      try {
        await Category.collection.dropIndex("slug_1");
        console.log("Dropped old slug_1 index");
      } catch (dropError: any) {
        // Index might not exist, which is fine
        if (!dropError.message?.includes("index not found")) {
          console.log("Could not drop slug_1 index (might not exist):", dropError.message);
        }
      }
      
      // Ensure the compound unique index exists
      await Category.createIndexes();
      console.log("Ensured compound index (userId_1_slug_1) exists");
    } catch (indexError) {
      console.error("Error ensuring indexes:", indexError);
      // Continue anyway, the manual check below will catch duplicates
    }

    // Check if slug already exists for this user
    // Use explicit ObjectId comparison to ensure proper filtering
    const existingCategory = await Category.findOne({ 
      userId: userId,
      slug: normalizedSlug 
    });

    // Debug logging
    if (existingCategory) {
      console.log("Found existing category:", {
        categoryId: existingCategory._id.toString(),
        foundUserId: existingCategory.userId.toString(),
        currentUserId: userId.toString(),
        slug: normalizedSlug,
        userIdMatch: existingCategory.userId.toString() === userId.toString()
      });
    } else {
      console.log("No existing category found for:", {
        userId: userId.toString(),
        slug: normalizedSlug
      });
    }

    if (existingCategory) {
      // Double-check that it actually belongs to this user
      if (existingCategory.userId.toString() !== userId.toString()) {
        console.error("Category found but userId mismatch:", {
          foundUserId: existingCategory.userId.toString(),
          currentUserId: userId.toString(),
          slug: normalizedSlug
        });
        // This shouldn't happen, but if it does, allow creation
      } else {
        return NextResponse.json(
          { success: false, error: "You already have a category with this slug. Please choose a different name or slug." },
          { status: 400 }
        );
      }
    }

    try {
      console.log("Creating category with:", {
        name: name.trim(),
        slug: normalizedSlug,
        userId: userId.toString()
      });

      const category = await Category.create({
        name: name.trim(),
        slug: normalizedSlug,
        expectedPercent: expectedPercent ?? 15,
        currentValue: currentValue || 0,
        displayName: displayName || name.trim(),
        description: description || "",
        entries: [],
        userId,
      });

      console.log("Category created successfully:", category._id.toString());
      return NextResponse.json({ success: true, data: category }, { status: 201 });
    } catch (createError: any) {
      console.error("Error creating category:", {
        error: createError.message,
        code: createError.code,
        name: createError.name,
        userId: userId.toString(),
        slug: normalizedSlug
      });

      // Handle duplicate key error (MongoDB error code 11000)
      if (createError.code === 11000 || createError.name === "MongoServerError") {
        // Check if it's a duplicate key error
        const isDuplicate = createError.message?.includes("duplicate") || 
                           createError.message?.includes("E11000");
        if (isDuplicate) {
          // Before returning error, check if it's actually a duplicate for this user
          const actualDuplicate = await Category.findOne({
            userId: userId,
            slug: normalizedSlug
          });
          
          if (actualDuplicate && actualDuplicate.userId.toString() === userId.toString()) {
            return NextResponse.json(
              { success: false, error: "You already have a category with this slug. Please choose a different name or slug." },
              { status: 400 }
            );
          } else {
            // Index error but not actually a duplicate for this user - this means there's an old incorrect index
            console.error("Index error but no actual duplicate found for this user. This is likely due to an old 'slug_1' index.");
            // Try to drop the old slug_1 index and recreate the correct compound index
            try {
              // Drop old incorrect index
              try {
                await Category.collection.dropIndex("slug_1");
                console.log("Dropped old slug_1 index");
              } catch (dropError: any) {
                if (!dropError.message?.includes("index not found")) {
                  console.error("Error dropping slug_1 index:", dropError);
                }
              }
              
              // Ensure compound index exists
              await Category.createIndexes();
              console.log("Recreated compound index");
              
              // Retry creation
              const category = await Category.create({
                name: name.trim(),
                slug: normalizedSlug,
                expectedPercent: expectedPercent ?? 15,
                currentValue: currentValue || 0,
                displayName: displayName || name.trim(),
                description: description || "",
                entries: [],
                userId,
              });
              console.log("Category created successfully after fixing index:", category._id.toString());
              return NextResponse.json({ success: true, data: category }, { status: 201 });
            } catch (retryError: any) {
              console.error("Error retrying after index fix:", retryError);
              return NextResponse.json(
                { success: false, error: "Database error. Please try again or contact support." },
                { status: 500 }
              );
            }
          }
        }
      }
      throw createError;
    }
  } catch (error: any) {
    if (error.code === 11000 || (error.name === "MongoServerError" && error.message?.includes("duplicate"))) {
      return NextResponse.json(
        { success: false, error: "You already have a category with this slug. Please choose a different name or slug." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "An error occurred while creating the category" },
      { status: 500 }
    );
  }
}

