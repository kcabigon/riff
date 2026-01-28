"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/auth/AuthCard";
import AuthInput from "@/components/auth/AuthInput";
import AuthButton from "@/components/auth/AuthButton";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Basic email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      // NextAuth magic link sign-in
      const result = await signIn("resend", {
        email,
        redirect: false,
        callbackUrl: "/auth/check-email",
      });

      if (result?.error) {
        setError("Failed to send magic link. Please try again.");
        setLoading(false);
      } else {
        // Redirect to check email page
        router.push("/auth/check-email");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "32px",
        }}
      >
        <AuthInput
          type="email"
          name="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          disabled={loading}
          required
          autoFocus
          autoComplete="email"
        />

        <AuthButton type="submit" loading={loading} disabled={loading}>
          Let&apos;s do this shit
        </AuthButton>
      </form>

      {/* Disclaimer */}
      <div
        style={{
          width: "100%",
          maxWidth: "344px",
          backgroundColor: "#FFFFFF",
          padding: "8px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            textAlign: "center",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "12px",
            fontWeight: 300,
            lineHeight: "normal",
            color: "#000000",
            margin: 0,
          }}
        >
          By continuing, you acknowledge Riff&apos;s Privacy Policy and agree
          to get occasional product update and promotional emails.
        </p>
      </div>
    </AuthCard>
  );
}
