import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const key = new TextEncoder().encode(secretKey);

// Pages that don't require authentication
const publicPaths = ["/login", "/signup", "/api/auth/login", "/api/auth/signup", "/api/auth/logout", "/api/setup", "/api/health"];

// Pages that unapproved users can access
const pendingAllowedPaths = ["/pending", "/api/auth/me", "/api/auth/logout"];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((p) => pathname.startsWith(p)) || pathname.startsWith("/images") || pathname.startsWith("/_next");
}

function isPendingAllowedPath(pathname: string): boolean {
  return pendingAllowedPaths.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = request.cookies.get("auth-token")?.value;

  // No token → redirect to login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token
  try {
    const { payload } = await jwtVerify(token, key);
    const user = payload as { approved?: number; role?: string };

    // Check if user is approved
    const isApproved = user.approved === 1 || user.role === "admin";

    // If not approved
    if (!isApproved) {
      // Allow access to pending page and logout
      if (isPendingAllowedPath(pathname)) {
        return NextResponse.next();
      }
      // Redirect to pending page
      return NextResponse.redirect(new URL("/pending", request.url));
    }

    // If user visits "/" → redirect to dashboard
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // If approved user visits pending page → redirect to dashboard
    if (pathname === "/pending") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  } catch {
    // Invalid/expired token → clear cookie and redirect to login
    const loginUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("auth-token");
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public images
     */
    "/((?!_next/static|_next/image|favicon.ico|images/).*)",
  ],
};
