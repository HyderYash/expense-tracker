import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User, { IUser } from "@/models/User";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    const tokenData = await getCurrentUser(request);

    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findById(tokenData.userId).select("-password") as (IUser & { _id: mongoose.Types.ObjectId }) | null;

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          twoFactorEnabled: user.twoFactorEnabled || false,
        },
      },
    });
  } catch (error: any) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error fetching user" },
      { status: 500 }
    );
  }
}

