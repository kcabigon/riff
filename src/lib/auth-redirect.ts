/**
 * Auth redirect utilities
 * Handles redirecting users after successful authentication
 */

import { prisma } from "./prisma";

/**
 * Get the redirect URL for a user after login
 * Redirects to their most recently active club, or club list if no clubs
 * @param userId - The authenticated user's ID
 * @returns The URL to redirect to
 */
export async function getPostAuthRedirect(userId: string): Promise<string> {
  try {
    // Fetch user's clubs ordered by most recently updated
    const clubs = await prisma.club.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
        isArchived: false,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 1,
      select: {
        id: true,
      },
    });

    // If user has clubs, redirect to the most recent one
    if (clubs.length > 0) {
      return `/club/${clubs[0].id}`;
    }

    // If no clubs, redirect to club discovery/creation
    return "/clubs";
  } catch (error) {
    console.error("Error getting post-auth redirect:", error);
    // Fallback to clubs page
    return "/clubs";
  }
}
