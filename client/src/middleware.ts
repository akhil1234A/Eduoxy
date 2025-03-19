import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userType = request.cookies.get("userType")?.value?.toLowerCase(); 

  // Role-based route mapping
  const routeRoles: Record<string, string> = {
    admin: "/admin/courses",
    teacher: "/teacher/courses",
    student: "/user/courses",
  };

  const publicRoutes = ["/signin", "/signup"];
  // const protectedRoutes = ["/payment"]; 

  const isPublicRoute = publicRoutes.includes(pathname);
  const isProtectedRoute = Object.values(routeRoles).some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isPaymentRoute = pathname.startsWith("/payment");

 
  if (pathname === "/") {
    return NextResponse.next();
  }


  if (isPublicRoute && userType) {
    const targetRoute = routeRoles[userType] || "/user/courses";
    if (!pathname.startsWith(targetRoute)) {
      return NextResponse.redirect(new URL(targetRoute, request.url));
    }
    return NextResponse.next();
  }

  if (!userType && (isProtectedRoute || isPaymentRoute)) {
    const loginUrl = new URL("/signin", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (userType && isProtectedRoute) {
    const allowedPrefix = routeRoles[userType].replace("/courses", ""); 
    if (!pathname.startsWith(allowedPrefix)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/teacher/:path*",
    "/user/:path*",
    "/signin",
    "/signup",
    "/payment/:path*",
    "/"
  ],
};
