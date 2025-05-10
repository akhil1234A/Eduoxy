import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const ROUTE_ROLES: Record<string, string> = {
  admin: "/admin",
  teacher: "/teacher",
  student: "/user",
};

const VALID_ROUTES: Record<string, string[]> = {
  admin: ["/admin/dashboard", "/admin/users", "/admin/courses", "/admin/earnings", "/admin/instructors", "/admin/courses", "/admin/settings", "/admin/roadmaps", "/admin/forums"],
  teacher: ["/teacher/courses", "/teacher/earnings", "/teacher/dashboard", "/teacher/profile", "/teacher/settings", "/teacher/chat", "/teacher/forums"],
  student: ["/user/dashboard", "/user/courses", "/user/certificates", "/user/purchases", "/user/profile", "/user/settings", "/user/chat", "/user/forums", "/user/roadmaps"],
};

const PUBLIC_ROUTES = ["/signin", "/signup"];
const ROOT_ROUTE = "/";
const UNAUTHORIZED_ROUTE = "/unauthorized";
const SIGNIN_ROUTE = "/signin";
const PAYMENT_PREFIX = "/payment";

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.includes(pathname);
}

function getUserRolePath(userType: string) {
  if (!Object.keys(ROUTE_ROLES).includes(userType)) {
    return null; // Invalid userType
  }
  return ROUTE_ROLES[userType];
}

function isAnyProtectedRoute(pathname: string) {
  return Object.values(ROUTE_ROLES).some((prefix) => pathname.startsWith(prefix));
}

function isValidRouteForRole(pathname: string, userType: string) {
  const validRoutes = VALID_ROUTES[userType] || [];
  return validRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("authToken")?.value;

  let userType: string | null = null;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userType: string };
      userType = decoded.userType.toLowerCase();
    } catch (error) {
      const err = error as Error; 
      console.log("[Middleware] Invalid token", err.message);
    }
  }

  const isLoggedIn = Boolean(userType);

  if (pathname === ROOT_ROUTE) return NextResponse.next();

  // Redirect logged-in users away from public routes
  if (isPublicRoute(pathname) && isLoggedIn) {
    const userBaseRoute = getUserRolePath(userType!) ?? "/user";
    if (!pathname.startsWith(userBaseRoute)) {
      console.log(`[Redirect] Logged-in user accessing public → ${userBaseRoute}`);
      return NextResponse.redirect(new URL(userBaseRoute + "/courses", request.url));
    }
    return NextResponse.next();
  }

  const isProtected = isAnyProtectedRoute(pathname);
  const isPayment = pathname.startsWith(PAYMENT_PREFIX);

  // Redirect unauthenticated users
  if (!isLoggedIn && (isProtected || isPayment)) {
    const loginUrl = new URL(SIGNIN_ROUTE, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    console.log(`[Redirect] Not logged in → Signin`);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access restriction
  if (isLoggedIn && isProtected) {
    const allowedPrefix = getUserRolePath(userType!);
    if (!allowedPrefix || !pathname.startsWith(allowedPrefix)) {
      console.log(`[Unauthorized] ${userType} tried to access ${pathname}`);
      return NextResponse.redirect(new URL(UNAUTHORIZED_ROUTE, request.url));
    }
    if (!isValidRouteForRole(pathname, userType!)) {
      console.log(`[Invalid Route] ${pathname} does not exist for ${userType}`);
      return NextResponse.redirect(new URL("/404", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};