import { NextRequest, NextResponse } from "next/server";

const ROUTE_ROLES: Record<string, string> = {
  admin: "/admin",
  teacher: "/teacher",
  student: "/user",
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
  return ROUTE_ROLES[userType] ?? "/user";
}

function isAnyProtectedRoute(pathname: string) {
  return Object.values(ROUTE_ROLES).some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userType = request.cookies.get("userType")?.value?.toLowerCase();

  if (pathname === ROOT_ROUTE) return NextResponse.next();

  const isLoggedIn = Boolean(userType);
  const userBaseRoute = getUserRolePath(userType || "student");

  // Redirect logged-in users away from public routes
  if (isPublicRoute(pathname) && isLoggedIn) {
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
    if (!pathname.startsWith(allowedPrefix)) {
      console.log(`[Unauthorized] ${userType} tried to access ${pathname}`);
      return NextResponse.redirect(new URL(UNAUTHORIZED_ROUTE, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|static|favicon.ico).*)'],
};
