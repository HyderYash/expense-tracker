import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { generateToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password, code } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Check if 2FA code is provided
      if (!code) {
        // Generate and send 2FA code
        const { send2FACode } = await import("@/lib/email");
        const twoFACode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + 10);

        user.twoFactorCode = twoFACode;
        user.twoFactorCodeExpiry = expiry;
        await user.save();

        try {
          await send2FACode(user.email, twoFACode, user.name);
        } catch (emailError) {
          console.error("Error sending 2FA code:", emailError);
          return NextResponse.json(
            { success: false, error: "Failed to send 2FA code. Please try again." },
            { status: 500 }
          );
        }

        return NextResponse.json(
          {
            success: false,
            requires2FA: true,
            message: "Two-factor authentication code sent to your email",
          },
          { status: 200 }
        );
      }

      // Verify 2FA code
      if (!user.twoFactorCode || !user.twoFactorCodeExpiry) {
        return NextResponse.json(
          { success: false, error: "No 2FA code found. Please request a new code." },
          { status: 400 }
        );
      }

      if (new Date() > user.twoFactorCodeExpiry) {
        user.twoFactorCode = undefined;
        user.twoFactorCodeExpiry = undefined;
        await user.save();
        return NextResponse.json(
          { success: false, error: "2FA code has expired. Please request a new code." },
          { status: 400 }
        );
      }

      if (user.twoFactorCode !== code) {
        return NextResponse.json(
          { success: false, error: "Invalid 2FA code" },
          { status: 401 }
        );
      }

      // Clear 2FA code after successful verification
      user.twoFactorCode = undefined;
      user.twoFactorCodeExpiry = undefined;
      await user.save();
    }

    // Generate token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
      },
      { status: 200 }
    );

    // Set cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Signin error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error signing in" },
      { status: 500 }
    );
  }
}

