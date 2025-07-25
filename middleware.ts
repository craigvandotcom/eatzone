import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";

// Same secret used in lib/db.ts for consistency
const JWT_SECRET = "health-tracker-local-secret-key";
const getSecret = () => new TextEncoder().encode(JWT_SECRET);

// Define protected and public route patterns
const PROTECTED_ROUTES = ["/app", "/settings", "/(protected)"];

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/(auth)",
  "/api", // API routes handle their own auth
];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => {
    if (route.includes("(") && route.includes(")")) {
      // Handle route groups like /(protected)
      const routeGroup = route.replace(/[()]/g, "");
      return pathname.includes(routeGroup);
    }
    return pathname.startsWith(route);
  });
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route.includes("(") && route.includes(")")) {
      // Handle route groups like /(auth)
      const routeGroup = route.replace(/[()]/g, "");
      return pathname.includes(routeGroup);
    }
    return pathname.startsWith(route) || pathname === route;
  });
}

async function validateToken(token: string): Promise<boolean> {
  try {
    // Verify JWT token using the same method as lib/db.ts
    const { payload } = await jose.jwtVerify(token, getSecret());

    // Check if token has required userId
    return !!(payload.userId && typeof payload.userId === "string");
  } catch (error) {
    // Token is invalid, expired, or malformed
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and internal Next.js routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Get token from multiple sources with PWA-specific handling
  let token: string | null = null;
  
  // Detect PWA context from headers
  const userAgent = request.headers.get("user-agent") || "";
  const isIOSPWA = userAgent.includes("iPhone") && 
    (request.headers.get("x-requested-with") === "com.apple.mobilesafari" ||
     request.headers.get("accept")?.includes("text/html"));

  // 1. Check Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  // 2. Check cookies with PWA-aware fallback
  if (!token) {
    // Try both cookie types for PWA compatibility
    token = request.cookies.get("auth_token")?.value || null;
  }

  // 3. Check custom headers (for SPA/PWA requests)
  if (!token) {
    token = request.headers.get("x-auth-token") || 
            request.headers.get("x-pwa-token");
  }

  // 4. For iOS PWA, be more lenient about missing tokens on initial requests
  const isInitialPWARequest = isIOSPWA && !token && pathname === "/";
  
  if (isInitialPWARequest) {
    console.log("🍎 iOS PWA initial request detected, allowing through for client-side auth");
  }

  // Validate token if it exists
  const isValidToken = token ? await validateToken(token) : false;

  // Handle auth pages - redirect authenticated users to app
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.includes("(auth)")
  ) {
    if (isValidToken) {
      return NextResponse.redirect(new URL("/app", request.url));
    }
    // Allow unauthenticated users to access auth pages
    return NextResponse.next();
  }

  // Allow public routes to pass through
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check if this is a protected route
  if (isProtectedRoute(pathname)) {
    // Special handling for iOS PWA - allow some grace for client-side auth
    if (!token) {
      if (isIOSPWA) {
        console.log("🍎 iOS PWA accessing protected route without token, allowing for client-side auth check");
        // Add a header to indicate this should trigger client-side auth
        const response = NextResponse.next();
        response.headers.set("x-pwa-auth-required", "true");
        return response;
      }
      
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!isValidToken) {
      if (isIOSPWA) {
        console.log("🍎 iOS PWA with invalid token, allowing client-side auth recovery");
        const response = NextResponse.next();
        response.headers.set("x-pwa-auth-expired", "true");
        response.cookies.delete("auth_token");
        return response;
      }
      
      // Token is invalid/expired, redirect to login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      loginUrl.searchParams.set("expired", "true");

      // Clear the invalid token cookie if it exists
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("auth_token");
      return response;
    }

    // Token is valid, allow the request to proceed
    return NextResponse.next();
  }

  // For any other routes, allow them through
  return NextResponse.next();
}

// Configure which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)",
  ],
};
