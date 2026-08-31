"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function useDraftCreation() {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const createDraft = async (riffId?: string) => {
    if (isCreating) return;
    setIsCreating(true);

    try {
      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(riffId ? { riffId } : {}),
      });

      const data = await res.json();

      if (data.success && data.piece) {
        router.push(`/write/${data.piece.id}`);
      }
    } catch (error) {
      console.error("Error creating draft:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return { createDraft, isCreating };
}
