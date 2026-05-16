"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Convenience hook for navigating to user profile pages.
 *
 * Returns a callback function that navigates to /profile/[userId]
 * when called with a user ID.
 *
 * Usage:
 * ```tsx
 * const handleAvatarClick = useProfileNavigation();
 * <Avatar user={user} onClick={handleAvatarClick} />
 * ```
 */
export function useProfileNavigation() {
  const router = useRouter();

  return useCallback(
    (userId: string) => {
      router.push(`/profile/${userId}`);
    },
    [router]
  );
}
