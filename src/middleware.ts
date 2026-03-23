import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const stagingPassword = process.env.STAGING_PASSWORD;

  // Only enforce basic auth if STAGING_PASSWORD is set (staging environment)
  if (!stagingPassword) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = atob(encoded);
      const [username, password] = decoded.split(":");
      if (username === "riff" && password === stagingPassword) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Riff Staging"',
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|api/auth).*)"],
};
