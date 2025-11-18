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

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Verification code is required" },
        { status: 400 }
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

    // Check if code exists and is valid
    if (!dbUser.twoFactorCode || !dbUser.twoFactorCodeExpiry) {
      return NextResponse.json(
        { success: false, error: "No verification code found. Please request a new code." },
        { status: 400 }
      );
    }

    // Check if code is expired
    if (new Date() > dbUser.twoFactorCodeExpiry) {
      dbUser.twoFactorCode = undefined;
      dbUser.twoFactorCodeExpiry = undefined;
      await dbUser.save();
      return NextResponse.json(
        { success: false, error: "Verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // Verify code
    if (dbUser.twoFactorCode !== code) {
      return NextResponse.json(
        { success: false, error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Enable 2FA and clear code
    dbUser.twoFactorEnabled = true;
    dbUser.twoFactorCode = undefined;
    dbUser.twoFactorCodeExpiry = undefined;
    await dbUser.save();

    return NextResponse.json({
      success: true,
      message: "Two-factor authentication enabled successfully",
    });
  } catch (error: any) {
    console.error("Verify 2FA error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error verifying 2FA code" },
      { status: 500 }
    );
  }
}

