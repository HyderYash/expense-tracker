import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { sendPasswordResetCode } from "@/lib/email";

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

    // Don't reveal if user exists for security reasons
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a password reset code has been sent.",
      });
    }

    // Generate reset code
    const code = generateCode();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 30); // 30 minutes expiry

    // Use updateOne to directly update the database - bypass Mongoose model if needed
    // First try with the model
    let updateResult = await User.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordResetCode: code,
          passwordResetExpiry: expiry,
        },
      }
    );
    
    // If that didn't work, try using the collection directly
    if (updateResult.modifiedCount === 0) {
      const mongoose = (await import("mongoose")).default;
      // Get the collection name from the model
      const collectionName = User.collection.name;
      const collection = mongoose.connection.db.collection(collectionName);
      const directResult = await collection.updateOne(
        { _id: user._id },
        {
          $set: {
            passwordResetCode: code,
            passwordResetExpiry: expiry,
          },
        }
      );
      console.log("Direct collection update result:", {
        collectionName,
        matchedCount: directResult.matchedCount,
        modifiedCount: directResult.modifiedCount,
        acknowledged: directResult.acknowledged,
      });
      updateResult = directResult;
    }

    console.log("Update result:", {
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount,
      acknowledged: updateResult.acknowledged,
    });

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "User not found. Please try again." },
        { status: 404 }
      );
    }

    // Fetch fresh from DB to verify it was actually saved
    const updatedUser = await User.findById(user._id);
    
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: "Failed to save reset code. Please try again." },
        { status: 500 }
      );
    }

    // Verify the code was saved
    console.log("Password reset code saved:", {
      userId: updatedUser._id.toString(),
      email: updatedUser.email,
      code: code,
      savedCode: updatedUser.passwordResetCode,
      savedExpiry: updatedUser.passwordResetExpiry,
      codesMatch: updatedUser.passwordResetCode === code,
      allFields: Object.keys(updatedUser.toObject()),
    });
    
    // Double check with a direct query using lean
    const directCheck = await User.findOne({ email: user.email }).lean();
    console.log("Direct DB query check:", {
      hasCode: !!directCheck?.passwordResetCode,
      code: directCheck?.passwordResetCode,
      expiry: directCheck?.passwordResetExpiry,
      allKeys: Object.keys(directCheck || {}),
    });

    // Send reset code via email
    try {
      await sendPasswordResetCode(user.email, code, user.name);
    } catch (emailError: any) {
      console.error("Error sending password reset code:", emailError);
      // Don't clear the code if email fails - user might still use it
      return NextResponse.json(
        { success: false, error: "Failed to send reset code. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password reset code sent to your email",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error processing password reset request" },
      { status: 500 }
    );
  }
}

