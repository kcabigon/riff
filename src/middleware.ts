import { NextRequest, NextResponse } from "next/server";

// Routes that require authentication
const protectedPrefixes = [
  "/clubs",
  "/riffs",
  "/write",
  "/read",
  "/profile",
  "/settings",
  "/onboarding",
  "/auth/post-login",
];

function isProtectedRoute(pathname: string): boolean {
  // Club join pages are publicly accessible without auth
  if (/^\/clubs\/[^/]+\/join$/.test(pathname)) return false;
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Staging password protection (if STAGING_PASSWORD is set)
  const stagingPassword = process.env.STAGING_PASSWORD;
  if (stagingPassword) {
    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      const [scheme, encoded] = authHeader.split(" ");
      if (scheme === "Basic" && encoded) {
        const decoded = atob(encoded);
        const [username, password] = decoded.split(":");
        if (username !== "riff" || password !== stagingPassword) {
          return new NextResponse("Authentication required", {
            status: 401,
            headers: {
              "WWW-Authenticate": 'Basic realm="Riff Staging"',
            },
          });
        }
      }
    } else {
      return new NextResponse("Authentication required", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Riff Staging"',
        },
      });
    }
  }

  // Auth protection: check for session cookie on protected routes
  if (isProtectedRoute(pathname)) {
    const hasSession =
      request.cookies.has("authjs.session-token") ||
      request.cookies.has("__Secure-authjs.session-token");
    if (!hasSession) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|api/).*)"],
};
