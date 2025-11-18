import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/signin", "/signup", "/forgot-password", "/reset-password"];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Handle root route - let the page component decide
  if (pathname === "/") {
    return NextResponse.next();
  }

  // If no token and trying to access protected route, redirect to signin
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // If token exists and trying to access auth pages, redirect to dashboard
  if (token && isPublicRoute && pathname !== "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

