"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AuthCard from "@/components/auth/AuthCard";

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
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "24px",
          textAlign: "center",
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontFamily: "var(--font-dm-serif-text)",
            fontSize: "32px",
            fontWeight: 400,
            lineHeight: 1.2,
            color: "#000000",
            margin: 0,
          }}
        >
          Check your email
        </h1>

        {/* Message */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
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
            We sent a magic link to:
          </p>
          {email && (
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 700,
                lineHeight: 1.6,
                color: "#000000",
                margin: 0,
              }}
            >
              {email}
            </p>
          )}
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
            Click the link in the email to sign in.
          </p>
        </div>

        {/* Additional info */}
        <div
          style={{
            marginTop: "16px",
            padding: "16px",
            backgroundColor: "#F5F5F5",
            border: "1px solid #E6E6E6",
            width: "100%",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              lineHeight: 1.6,
              color: "#959595",
              margin: 0,
            }}
          >
            The link will expire in 24 hours and can only be used once.
          </p>
        </div>

        {/* Resend option */}
        <div
          style={{
            marginTop: "24px",
          }}
        >
          {canResend ? (
            <button
              onClick={handleResend}
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: 300,
                color: "#000000",
                textDecoration: "underline",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Didn&apos;t receive the email? Resend
            </button>
          ) : (
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: 300,
                color: "#959595",
                margin: 0,
              }}
            >
              Resend available in {countdown}s
            </p>
          )}
        </div>
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
                color: "#959595",
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
