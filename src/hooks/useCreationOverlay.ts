"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

// Where each creation flow lands once the thing exists. Kept here so all the
// entry points (nav Create menu, club switcher, Home empty state) can't drift
// to different destinations for the same action.
export const riffCreatedPath = (riffId: string) => `/riffs/${riffId}`;
export const clubCreatedPath = (clubId: string) =>
  `/clubs/${clubId}?welcome=host`;

// Open/close state for a creation overlay plus the handoff on success —
// every entry point does the same two things when creation finishes (close
// the overlay, navigate to what was just created), so they share this
// instead of repeating the pair at each call site.
export function useCreationOverlay(destination: (id: string) => string) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const onCreated = useCallback(
    (id: string) => {
      setIsOpen(false);
      router.push(destination(id));
    },
    [router, destination]
  );

  return { isOpen, open, close, onCreated };
}
