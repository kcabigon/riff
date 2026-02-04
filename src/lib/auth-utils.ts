import { cookies } from "next/headers";
import { auth } from "./auth";
import { prisma } from "./prisma";

/**
 * Returns the current session. In development, if a `dev-user-email` cookie
 * is set (via /api/dev/set-user) the session is synthesised from the DB —
 * no NextAuth sign-in required. Falls back to NextAuth's auth() otherwise.
 *
 * Use this everywhere instead of calling auth() directly.
 */
export async function getSession() {
  if (process.env.NODE_ENV !== "production") {
    const cookieStore = await cookies();
    const devEmail = cookieStore.get("dev-user-email")?.value;

    if (devEmail) {
      const user = await prisma.user.findUnique({
        where: { email: devEmail },
      });

      if (user) {
        return {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            onboardingCompleted: user.onboardingCompleted,
            onboardingStep: user.onboardingStep,
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
      }
    }
  }

  return auth();
}

/**
 * Get the current authenticated user session
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Require authentication - throws error if not authenticated
 * Use this in API routes that require a logged-in user
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
