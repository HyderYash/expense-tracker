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
    const { name, quantity, invested, currentValue, expectedPercent } = body;
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

    const newEntry: any = { name, quantity, invested };
    if (currentValue !== undefined && currentValue !== null) {
      newEntry.currentValue = currentValue;
    }
    // Default to 10% if not provided
    newEntry.expectedPercent = (expectedPercent !== undefined && expectedPercent !== null) ? expectedPercent : 10;
    category.entries.push(newEntry);
    
    // Update category currentValue to be sum of all entry currentValues
    // Only count entries that have currentValue explicitly set (including 0)
    const totalCurrentValue = category.entries.reduce((sum, entry) => {
      if (entry.currentValue !== undefined && entry.currentValue !== null) {
        return sum + entry.currentValue;
      }
      return sum;
    }, 0);
    category.currentValue = totalCurrentValue;
    
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
    const { entryIndex, name, quantity, invested, currentValue, expectedPercent } = body;
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
    // Allow null to explicitly clear the currentValue, and allow 0 as a valid value
    if (currentValue !== undefined) {
      category.entries[entryIndex].currentValue = currentValue === null ? undefined : currentValue;
    }
    // Allow null to explicitly clear the expectedPercent, and allow 0 as a valid value
    if (expectedPercent !== undefined) {
      category.entries[entryIndex].expectedPercent = expectedPercent === null ? undefined : expectedPercent;
    }

    // Update category currentValue to be sum of all entry currentValues
    // Only count entries that have currentValue explicitly set (including 0)
    const totalCurrentValue = category.entries.reduce((sum, entry) => {
      if (entry.currentValue !== undefined && entry.currentValue !== null) {
        return sum + entry.currentValue;
      }
      return sum;
    }, 0);
    category.currentValue = totalCurrentValue;

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
    
    // Update category currentValue to be sum of all entry currentValues
    // Only count entries that have currentValue explicitly set (including 0)
    const totalCurrentValue = category.entries.reduce((sum, entry) => {
      if (entry.currentValue !== undefined && entry.currentValue !== null) {
        return sum + entry.currentValue;
      }
      return sum;
    }, 0);
    category.currentValue = totalCurrentValue;
    
    await category.save();

    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

