import { NextResponse } from "next/server";

/**
 * Dev-only endpoint. Sets (or clears) the dev-user-email cookie so that
 * getSession() in auth-utils.ts will synthesise a session for that user.
 *
 * Usage:
 *   /api/dev/set-user?email=alice@test.local          — sign in as alice
 *   /api/dev/set-user?email=alice@test.local&redirect=/clubs/abc — sign in + go somewhere specific
 *   /api/dev/set-user                                  — clear (sign out)
 */
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  const redirectTo = url.searchParams.get("redirect") || "/";

  const response = NextResponse.redirect(new URL(redirectTo, req.url));

  if (email) {
    response.cookies.set("dev-user-email", email, {
      path: "/",
      httpOnly: true,
    });
  } else {
    response.cookies.delete("dev-user-email");
  }

  return response;
}
