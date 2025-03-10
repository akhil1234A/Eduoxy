import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userType = request.cookies.get("userType")?.value?.toLowerCase(); 

 
  const routeRoles: Record<string, string> = {
    admin: "/admin",
    teacher: "/teacher",
    student: "/user",
  };

  const publicRoutes = ["/signin", "/signup", "/"];

  const isPublicRoute = publicRoutes.includes(pathname);
  const isProtectedRoute = Object.values(routeRoles).some((prefix) =>
    pathname.startsWith(prefix)
  );

  // If a logged-in user tries to access a public route, redirect them
  if (isPublicRoute && userType) {
    const targetRoute = routeRoles[userType] || "/user/courses";
    if (!pathname.startsWith(targetRoute)) {
      return NextResponse.redirect(new URL(targetRoute, request.url));
    }
    return NextResponse.next();
  }

  // If user is not logged in and trying to access protected routes, send them to signin
  if (!userType && isProtectedRoute) {
    const loginUrl = new URL("/signin", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }


  if (userType && isProtectedRoute) {
    const allowedPrefix = routeRoles[userType];
    if (!pathname.startsWith(allowedPrefix)) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return NextResponse.next();
}


export const config = {
  matcher: ["/admin/:path*", "/teacher/:path*", "/user/:path*", "/signin", "/signup", "/"],
};
