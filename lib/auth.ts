import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

export interface JWTPayload {
  userId: string;
  email: string;
  role: "admin" | "user";
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser(request?: NextRequest): Promise<JWTPayload | null> {
  let token: string | undefined;

  if (request) {
    // Server-side API route: get token from cookies
    token = request.cookies.get("token")?.value;
  } else {
    // Server component: use cookies() from next/headers
    try {
      const cookieStore = await cookies();
      token = cookieStore.get("token")?.value;
    } catch (error) {
      // If cookies() fails, return null
      return null;
    }
  }

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

export function setAuthCookie(token: string) {
  // This will be used in API routes
  return `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;
}

