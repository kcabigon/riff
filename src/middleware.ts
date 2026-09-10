import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Prisma needs a real Node.js runtime (this project's Postgres connection
// isn't edge-compatible) — the default Edge middleware runtime can't run
// the club-riff lookup below.
export const runtime = "nodejs";

// Routes that require authentication
const protectedPrefixes = [
  "/my-riffs",
  "/clubs",
  "/riffs",
  "/write",
  "/read",
  "/profile",
  "/account",
  "/onboarding",
  "/auth/post-login",
  "/admin",
];

function isProtectedRoute(pathname: string): boolean {
  // Club and riff join pages are publicly accessible without auth
  if (/^\/clubs\/[^/]+\/join$/.test(pathname)) return false;
  if (/^\/riffs\/[^/]+\/join$/.test(pathname)) return false;
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

export async function middleware(request: NextRequest) {
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

  // Pre-reveal club riffs live on the club page now, not the standalone
  // riff page — redirecting here instead of inside /riffs/[id]/page.tsx
  // means the client's URL bar never commits to /riffs/[id] in the first
  // place. A redirect() thrown from a Server Component only fires after
  // the client has already navigated there, which briefly flashes the old
  // URL/page on client-side navigations (router.push from RiffEventCard,
  // the Write page, etc); a middleware redirect resolves before that
  // commit happens.
  const riffMatch = pathname.match(/^\/riffs\/([^/]+)$/);
  if (riffMatch) {
    const riff = await prisma.riff.findUnique({
      where: { id: riffMatch[1] },
      select: { clubId: true, status: true },
    });
    if (
      riff?.clubId &&
      riff.status !== "REVEALED" &&
      riff.status !== "COMPLETED"
    ) {
      return NextResponse.redirect(
        new URL(`/clubs/${riff.clubId}`, request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|api/).*)"],
};
