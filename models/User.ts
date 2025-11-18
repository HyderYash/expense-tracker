import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: "admin" | "user";
  twoFactorEnabled: boolean;
  twoFactorCode?: string;
  twoFactorCodeExpiry?: Date;
  emailVerified: boolean;
  emailVerificationCode?: string;
  emailVerificationExpiry?: Date;
  passwordResetCode?: string;
  passwordResetExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    twoFactorEnabled: { type: Boolean, default: true },
    twoFactorCode: { type: String },
    twoFactorCodeExpiry: { type: Date },
    emailVerified: { type: Boolean, default: true },
    emailVerificationCode: { type: String },
    emailVerificationExpiry: { type: Date },
    passwordResetCode: { type: String },
    passwordResetExpiry: { type: Date },
  },
  {
    timestamps: true,
    strict: true, // Ensure strict mode is enabled
  }
);

// Delete the model if it exists to force recompilation with new schema
if (mongoose.models.User) {
  delete mongoose.models.User;
}

const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);

export default User;

