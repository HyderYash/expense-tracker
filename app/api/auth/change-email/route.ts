import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth";
import { sendEmailVerificationCode } from "@/lib/email";
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

    const { newEmail } = await request.json();

    if (!newEmail) {
      return NextResponse.json(
        { success: false, error: "New email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = newEmail.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
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

    // Check if new email is the same as current
    if (dbUser.email === normalizedEmail) {
      return NextResponse.json(
        { success: false, error: "New email must be different from current email" },
        { status: 400 }
      );
    }

    // Check if email is already taken
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "This email is already in use" },
        { status: 400 }
      );
    }

    // Generate verification code
    const code = generateCode();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 30); // 30 minutes expiry

    dbUser.emailVerificationCode = code;
    dbUser.emailVerificationExpiry = expiry;
    await dbUser.save();

    // Send verification code to new email
    try {
      await sendEmailVerificationCode(normalizedEmail, code, dbUser.name);
    } catch (emailError: any) {
      console.error("Error sending verification code:", emailError);
      return NextResponse.json(
        { success: false, error: "Failed to send verification code. Please check your email configuration." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your new email address",
      pendingEmail: normalizedEmail,
    });
  } catch (error: any) {
    console.error("Change email error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error initiating email change" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { code, newEmail } = await request.json();

    if (!code || !newEmail) {
      return NextResponse.json(
        { success: false, error: "Verification code and new email are required" },
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

    // Check if verification code exists and is valid
    if (!dbUser.emailVerificationCode || !dbUser.emailVerificationExpiry) {
      return NextResponse.json(
        { success: false, error: "No verification code found. Please request a new code." },
        { status: 400 }
      );
    }

    // Check if code is expired
    if (new Date() > dbUser.emailVerificationExpiry) {
      dbUser.emailVerificationCode = undefined;
      dbUser.emailVerificationExpiry = undefined;
      await dbUser.save();
      return NextResponse.json(
        { success: false, error: "Verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // Verify code
    if (dbUser.emailVerificationCode !== code) {
      return NextResponse.json(
        { success: false, error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Check if new email matches
    if (dbUser.emailVerificationCode === code && newEmail.toLowerCase().trim() !== dbUser.email) {
      // Update email
      const oldEmail = dbUser.email;
      dbUser.email = newEmail.toLowerCase().trim();
      dbUser.emailVerificationCode = undefined;
      dbUser.emailVerificationExpiry = undefined;
      await dbUser.save();

      return NextResponse.json({
        success: true,
        message: "Email changed successfully",
        data: {
          user: {
            id: dbUser._id.toString(),
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
          },
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Email verification failed" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Verify email change error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error verifying email change" },
      { status: 500 }
    );
  }
}

