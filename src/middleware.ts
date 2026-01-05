import { getToken } from "next-auth/jwt";
import { NextResponse, NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPublicPath = pathname === "/";

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // 🔹 Debug


  // 1. Public path `/`
  if (isPublicPath) {
    if (token) {
      if (token.flag === "1") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      const roles = (token.roles as string[]) || [];
      const firstAllowed = roles.find((r) => r.startsWith("/dashboard"));

      return NextResponse.redirect(new URL(firstAllowed || "/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // 2. Private paths `/dashboard`
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Admin bypass
    if (token.flag === "1") {
      return NextResponse.next();
    }

    const roles = (token.roles as string[]) || [];

    // `/dashboard` root → send to first allowed p
    if (pathname === "/dashboard") {
      const firstAllowed = roles.find((r) => r.startsWith("/dashboard"));
      return NextResponse.redirect(new URL(firstAllowed || "/", request.url));
    }

    // Direct access → check if user has this route
    if (!roles.includes(pathname)) {
      const firstAllowed = roles.find((r) => r.startsWith("/dashboard"));
      return NextResponse.redirect(new URL(firstAllowed || "/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};
