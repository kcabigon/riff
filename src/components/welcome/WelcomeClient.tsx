"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/useMediaQuery";
import WelcomeTutorial from "./WelcomeTutorial";
import MobileWelcomeTutorial from "./MobileWelcomeTutorial";

export default function WelcomeClient() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSkip = async () => {
    try {
      const res = await fetch("/api/users/me");
      const { user } = await res.json();
      if (user?.lastActiveClubId) {
        router.push(`/clubs/${user.lastActiveClubId}`);
      } else {
        router.push("/");
      }
    } catch {
      router.push("/");
    }
  };

  if (!mounted) {
    return (
      <div style={{ width: "100vw", height: "100vh", background: "#0a0a0a" }} />
    );
  }

  return isMobile ? (
    <MobileWelcomeTutorial onSkip={handleSkip} />
  ) : (
    <WelcomeTutorial onSkip={handleSkip} />
  );
}
