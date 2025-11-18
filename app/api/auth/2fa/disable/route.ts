import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";
import mongoose from "mongoose";

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
    const userId = new mongoose.Types.ObjectId(user.userId);
    const dbUser = await User.findById(userId);

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Disable 2FA
    dbUser.twoFactorEnabled = false;
    dbUser.twoFactorCode = undefined;
    dbUser.twoFactorCodeExpiry = undefined;
    await dbUser.save();

    return NextResponse.json({
      success: true,
      message: "Two-factor authentication disabled successfully",
    });
  } catch (error: any) {
    console.error("Disable 2FA error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error disabling 2FA" },
      { status: 500 }
    );
  }
}

