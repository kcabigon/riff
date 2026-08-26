"use client";

import { useCallback, useState } from "react";

export function useRevealRiff() {
  const [isRevealing, setIsRevealing] = useState(false);

  const revealRiff = useCallback(async (riffId: string): Promise<boolean> => {
    setIsRevealing(true);
    try {
      const res = await fetch(`/api/riffs/${riffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REVEALED" }),
      });
      return res.ok;
    } catch (err) {
      console.error("Error revealing riff:", err);
      return false;
    } finally {
      setIsRevealing(false);
    }
  }, []);

  return { revealRiff, isRevealing };
}
