"use client";

import { useEffect, useState } from "react";
import {
  sweepOutcomeFor,
  sweepRunFor,
  revealsAutomatically,
  type CadenceValue,
} from "@/lib/cadence";
import { getRiffCountdown, type RiffCountdown } from "@/lib/riff-utils";

// A live countdown for an active riff, or null when it has no deadline.
//
// Auto-reveal clubs count to the sweep run that acts on the riff rather than
// the deadline, since that's when pieces actually unlock (and submitting stays
// open until then). Freestyle clubs and open riffs count to the deadline, then
// wait on the host.
//
// `cadence` is null for open (clubless) riffs.
export function useRiffCountdown(riff: {
  deadline: string | null;
  createdAt: string;
  submittedCount: number;
  cadence: CadenceValue | null;
}): RiffCountdown | null {
  const [now, setNow] = useState(() => Date.now());
  const hasDeadline = riff.deadline !== null;

  // Every 15s, so the minute rolls over close to when it should.
  useEffect(() => {
    if (!hasDeadline) return;
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, [hasDeadline]);

  if (!riff.deadline) return null;
  const deadline = new Date(riff.deadline);

  if (!riff.cadence || !revealsAutomatically(riff.cadence)) {
    return getRiffCountdown(deadline, null, now);
  }

  const outcome = sweepOutcomeFor(riff.cadence, {
    createdAt: new Date(riff.createdAt),
    deadline,
    submittedCount: riff.submittedCount,
  });
  return getRiffCountdown(sweepRunFor(deadline), outcome, now);
}
