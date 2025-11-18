import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import { getCurrentUser } from "@/lib/auth";
import mongoose from "mongoose";

export async function POST(
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
    const { name, quantity, invested } = body;
    const userId = new mongoose.Types.ObjectId(user.userId);

    if (!name || quantity === undefined || invested === undefined) {
      return NextResponse.json(
        { success: false, error: "Name, quantity, and invested are required" },
        { status: 400 }
      );
    }

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

    category.entries.push({ name, quantity, invested });
    await category.save();

    return NextResponse.json({ success: true, data: category }, { status: 201 });
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
    const { entryIndex, name, quantity, invested } = body;
    const userId = new mongoose.Types.ObjectId(user.userId);

    if (entryIndex === undefined) {
      return NextResponse.json(
        { success: false, error: "entryIndex is required" },
        { status: 400 }
      );
    }

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

    if (entryIndex < 0 || entryIndex >= category.entries.length) {
      return NextResponse.json(
        { success: false, error: "Invalid entry index" },
        { status: 400 }
      );
    }

    if (name !== undefined) category.entries[entryIndex].name = name;
    if (quantity !== undefined) category.entries[entryIndex].quantity = quantity;
    if (invested !== undefined) category.entries[entryIndex].invested = invested;

    await category.save();

    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
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
    const { searchParams } = new URL(request.url);
    const entryIndex = parseInt(searchParams.get("entryIndex") || "");
    const userId = new mongoose.Types.ObjectId(user.userId);

    if (isNaN(entryIndex)) {
      return NextResponse.json(
        { success: false, error: "entryIndex is required" },
        { status: 400 }
      );
    }

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

    if (entryIndex < 0 || entryIndex >= category.entries.length) {
      return NextResponse.json(
        { success: false, error: "Invalid entry index" },
        { status: 400 }
      );
    }

    category.entries.splice(entryIndex, 1);
    await category.save();

    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

