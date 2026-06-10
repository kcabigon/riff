"use client";

import { useRouter } from "next/navigation";

interface TutorialExitButtonProps {
  clubId?: string;
  step?: string;
}

export default function TutorialExitButton({
  clubId,
  step,
}: TutorialExitButtonProps) {
  const router = useRouter();

  const handleExit = () => {
    if (step !== undefined) {
      sessionStorage.setItem("tutorial-step", step);
    }
    router.push(
      clubId && clubId !== "no-club" ? `/clubs/${clubId}` : "/no-club"
    );
  };

  return (
    <button
      onClick={handleExit}
      style={{
        background: "none",
        border: "none",
        fontFamily: "var(--font-dm-sans)",
        fontSize: "14px",
        fontWeight: 300,
        color: "#FFFFFF",
        cursor: "pointer",
        padding: "4px 0",
        lineHeight: "normal",
        flexShrink: 0,
      }}
    >
      Exit
    </button>
  );
}
