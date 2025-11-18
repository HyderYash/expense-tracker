import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";
import { send2FACode } from "@/lib/email";
import mongoose from "mongoose";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
    const userId = new mongoose.Types.ObjectId(user.userId);
    const dbUser = await User.findById(userId);

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Generate and send verification code
    const code = generateCode();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10); // 10 minutes expiry

    dbUser.twoFactorCode = code;
    dbUser.twoFactorCodeExpiry = expiry;
    await dbUser.save();

    // Send code via email
    try {
      await send2FACode(dbUser.email, code, dbUser.name);
    } catch (emailError: any) {
      console.error("Error sending 2FA code:", emailError);
      return NextResponse.json(
        { success: false, error: "Failed to send verification code. Please check your email configuration." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email",
    });
  } catch (error: any) {
    console.error("Enable 2FA error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error enabling 2FA" },
      { status: 500 }
    );
  }
}

