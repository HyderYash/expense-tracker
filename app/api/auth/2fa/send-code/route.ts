import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { send2FACode } from "@/lib/email";
import mongoose from "mongoose";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists for security
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a verification code has been sent.",
      });
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { success: false, error: "Two-factor authentication is not enabled for this account" },
        { status: 400 }
      );
    }

    // Generate and send code
    const code = generateCode();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10); // 10 minutes expiry

    user.twoFactorCode = code;
    user.twoFactorCodeExpiry = expiry;
    await user.save();

    // Send code via email
    try {
      await send2FACode(user.email, code, user.name);
    } catch (emailError: any) {
      console.error("Error sending 2FA code:", emailError);
      return NextResponse.json(
        { success: false, error: "Failed to send verification code. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email",
    });
  } catch (error: any) {
    console.error("Send 2FA code error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error sending 2FA code" },
      { status: 500 }
    );
  }
}

