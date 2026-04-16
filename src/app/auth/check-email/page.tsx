"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AuthCard from "@/components/auth/AuthCard";
import CTAButton from "@/components/CTAButton";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleResend = async () => {
    // TODO: Implement resend logic
    setCountdown(60);
    setCanResend(false);
  };

  return (
    <AuthCard>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "32px",
          textAlign: "center",
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontFamily: "var(--font-dm-serif-text)",
            fontSize: "64px",
            fontWeight: 400,
            lineHeight: 1.2,
            color: "#000000",
            margin: 0,
          }}
        >
          Check your email
        </h1>

        {/* Message */}
        {email && (
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              lineHeight: 1.6,
              color: "#000000",
              margin: 0,
            }}
          >
            We sent a magic link to{" "}
            <span style={{ fontWeight: 700 }}>{email}</span>
          </p>
        )}

        {/* Resend */}
        <CTAButton onClick={handleResend} disabled={!canResend}>
          {canResend ? "Resend email" : `Resend in ${countdown}s`}
        </CTAButton>
      </div>
    </AuthCard>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthCard>
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#808080",
              }}
            >
              Loading...
            </p>
          </div>
        </AuthCard>
      }
    >
      <CheckEmailContent />
    </Suspense>
  );
}
