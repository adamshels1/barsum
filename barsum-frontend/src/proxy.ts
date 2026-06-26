import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function getPayload(
  token: string
): { role?: string; expertStatus?: string } | null {
  try {
    const base64 = token.split(".")[1];
    const standard = base64
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
    const decoded = atob(standard);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("barsum_token")?.value;

  const isAuthPage = pathname.startsWith("/auth/") || pathname === "/";
  if (isAuthPage) return NextResponse.next();

  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const payload = getPayload(token);
  if (!payload || !payload.role) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const role = payload.role;

  if (pathname.startsWith("/child/") && role !== "child") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/parent/") && role !== "parent") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/expert/")) {
    if (role !== "expert") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    const expertStatus = payload.expertStatus as string | undefined;
    const isOnboarding = pathname === "/expert/onboarding";
    if (!isOnboarding && expertStatus !== "approved") {
      return NextResponse.redirect(new URL("/expert/onboarding", request.url));
    }
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/child/:path*",
    "/parent/:path*",
    "/expert/:path*",
    "/admin/:path*",
  ],
};
