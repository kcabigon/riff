"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import AuthCard from "@/components/auth/AuthCard";
import CTAButton from "@/components/CTAButton";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!email) router.replace("/login");
  }, [email, router]);

  const handleResend = async () => {
    if (!email || sending) return;

    setSending(true);
    setError("");
    setSent(false);
    try {
      const result = await signIn("resend", {
        email,
        redirect: false,
        callbackUrl: "/auth/post-login",
      });
      if (!result?.ok || result.error) {
        setError("Could not resend the email. Please try again.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Could not resend the email. Please try again.");
    } finally {
      setSending(false);
    }
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
        <CTAButton onClick={handleResend} disabled={sending}>
          {sending ? "Sending..." : "Resend email"}
        </CTAButton>
        {error && (
          <p role="alert" style={{ color: "#DC2626" }}>
            {error}
          </p>
        )}
        {sent && <p role="status">Email sent. Check your inbox.</p>}
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
