import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isStudentRoute = createRouteMatcher(["/user/(.*)"]);
const isTeacherRoute = createRouteMatcher(["/teacher/(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin/(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { sessionClaims } = await auth();
  
  const userRole =
    (sessionClaims?.metadata as { userType: "student" | "teacher" | "admin" })
      ?.userType || "student"; 

  
  if (isStudentRoute(req) && userRole !== "student") {
    const url = new URL(
      userRole === "teacher" ? "/teacher/courses" : "/admin/",
      req.url
    );
    return NextResponse.redirect(url);
  }

  if (isTeacherRoute(req) && userRole !== "teacher") {
    const url = new URL(
      userRole === "student" ? "/user/courses" : "/admin/",
      req.url
    );
    return NextResponse.redirect(url);
  }

  if (isAdminRoute(req) && userRole !== "admin") {
    const url = new URL(
      userRole === "student" ? "/user/courses" : "/teacher/courses",
      req.url
    );
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
