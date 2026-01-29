"use client";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export default function OnboardingProgress({
  currentStep,
  totalSteps,
}: OnboardingProgressProps) {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
      }}
    >
      {/* Progress text */}
      <p
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "14px",
          fontWeight: 300,
          color: "#959595",
          margin: 0,
        }}
      >
        Step {currentStep} of {totalSteps}
      </p>

      {/* Progress dots */}
      <div style={{ display: "flex", gap: "12px" }}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: index < currentStep ? "#00FF66" : "#E6E6E6",
              border: "2px solid #000000",
            }}
          />
        ))}
      </div>
    </div>
  );
}
