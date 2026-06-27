import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getRoleBasePath, getAllowedPrefixes } from "@/lib/role-routes";

// Paths that should redirect to role-specific base after login
const ROOT_PATHS = ["/", "/dashboard"];

// Protected paths that require authentication
const protectedPaths = [
  "/dashboard",
  "/employees",
  "/departments",
  "/attendance",
  "/leave",
  "/payroll",
  "/recruitment",
  "/performance",
  "/settings",
  "/admin",
  "/manager",
  "/employee",
  "/profile",
  "/devices",
  "/my-team",
  "/resignations",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Skip middleware for API routes - they handle auth internally
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Skip static assets and public files
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/public/") ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2?|ttf|otf|eot)$/)
  ) {
    return NextResponse.next();
  }

  const isLoggedIn = !!req.auth;
  
  // Get role from session - in NextAuth v5 middleware, user data is in req.auth
  const userRole = req.auth?.user?.role as string | undefined;

  // If not logged in and trying to access protected path, redirect to signin
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtectedPath && !isLoggedIn) {
    const signInUrl = new URL("/auth/signin", req.nextUrl);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);
    return NextResponse.redirect(signInUrl);
  }

  // If logged in and accessing root/dashboard, redirect to role-specific base URL
  if (isLoggedIn && userRole) {
    // Check if accessing root or dashboard
    if (ROOT_PATHS.some((path) => pathname === path || pathname === "/dashboard")) {
      const roleUrl = new URL(getRoleBasePath(userRole), req.nextUrl);
      return NextResponse.redirect(roleUrl);
    }

    // Role-based access control for role-specific paths
    const allowedPrefixes = getAllowedPrefixes(userRole);

    // Check if user is trying to access a role-restricted path
    if (pathname.startsWith("/admin") && !allowedPrefixes.includes("/admin")) {
      const roleUrl = new URL(getRoleBasePath(userRole), req.nextUrl);
      return NextResponse.redirect(roleUrl);
    }

    if (pathname.startsWith("/manager") && userRole !== "MANAGER") {
      const roleUrl = new URL(getRoleBasePath(userRole), req.nextUrl);
      return NextResponse.redirect(roleUrl);
    }

    if (pathname.startsWith("/payroll") && 
        userRole !== "PAYROLL_ADMIN" && 
        userRole !== "ADMIN" && 
        userRole !== "SUPER_ADMIN" && 
        userRole !== "HR_MANAGER") {
      const roleUrl = new URL(getRoleBasePath(userRole), req.nextUrl);
      return NextResponse.redirect(roleUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
