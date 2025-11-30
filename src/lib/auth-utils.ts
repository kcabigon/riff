import { auth } from "./auth";

/**
 * Get the current authenticated user session
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await auth();
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
