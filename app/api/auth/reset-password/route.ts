import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Email, verification code, and new password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    await connectDB();
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or verification code" },
        { status: 400 }
      );
    }

    // Normalize the code (remove any whitespace, ensure it's a string)
    const normalizedCode = String(code).trim();
    const storedCode = user.passwordResetCode ? String(user.passwordResetCode).trim() : null;

    // Debug logging
    console.log("Password reset attempt:", {
      email: normalizedEmail,
      providedCode: normalizedCode,
      storedCode: storedCode,
      hasCode: !!user.passwordResetCode,
      hasExpiry: !!user.passwordResetExpiry,
      expiry: user.passwordResetExpiry,
      now: new Date(),
    });

    // Check if reset code exists and is valid
    if (!storedCode || !user.passwordResetExpiry) {
      return NextResponse.json(
        { success: false, error: "No password reset code found. Please request a new code." },
        { status: 400 }
      );
    }

    // Check if code is expired
    if (new Date() > user.passwordResetExpiry) {
      user.passwordResetCode = undefined;
      user.passwordResetExpiry = undefined;
      await user.save();
      return NextResponse.json(
        { success: false, error: "Password reset code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // Verify code (compare as strings)
    if (storedCode !== normalizedCode) {
      console.log("Code mismatch:", { storedCode, providedCode: normalizedCode });
      return NextResponse.json(
        { success: false, error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset code
    user.password = hashedPassword;
    user.passwordResetCode = undefined;
    user.passwordResetExpiry = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. You can now sign in with your new password.",
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error resetting password" },
      { status: 500 }
    );
  }
}

