"use client";

import { useIsMobile } from "@/hooks/useMediaQuery";
import WelcomeTutorial from "./WelcomeTutorial";
import MobileWelcomeTutorial from "./MobileWelcomeTutorial";

export default function WelcomeClient() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileWelcomeTutorial /> : <WelcomeTutorial />;
}
