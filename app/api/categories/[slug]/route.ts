import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import { getCurrentUser } from "@/lib/auth";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
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
    const category = await Category.findOne({ 
      slug: params.slug,
      userId 
    });
    
    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
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
    const userId = new mongoose.Types.ObjectId(user.userId);
    
    // Ensure index exists before checking
    try {
      await Category.createIndexes();
    } catch (indexError) {
      console.error("Error ensuring indexes:", indexError);
      // Continue anyway, the manual check below will catch duplicates
    }
    
    // Check if category exists
    const existingCategory = await Category.findOne({ 
      slug: params.slug, 
      userId 
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    // If slug is being updated, check if new slug already exists for this user
    if (body.slug && body.slug !== params.slug) {
      // Normalize slug: lowercase, trim, replace special chars with dashes, remove leading/trailing dashes
      const normalizedSlug = body.slug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      if (!normalizedSlug) {
        return NextResponse.json(
          { success: false, error: "Invalid slug. Please provide a valid slug." },
          { status: 400 }
        );
      }

      const duplicateCategory = await Category.findOne({ 
        userId, 
        slug: normalizedSlug,
        _id: { $ne: existingCategory._id } // Exclude current category
      });

      if (duplicateCategory) {
        return NextResponse.json(
          { success: false, error: "You already have a category with this slug" },
          { status: 400 }
        );
      }
      
      // Set the normalized slug
      body.slug = normalizedSlug;
    }

    const category = await Category.findOneAndUpdate(
      { slug: params.slug, userId },
      body,
      { new: true, runValidators: true }
    );

    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "You already have a category with this slug" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
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
    const category = await Category.findOneAndDelete({ 
      slug: params.slug,
      userId 
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

