"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/auth/AuthCard";
import TextInput from "@/components/TextInput";
import PrimaryButton from "@/components/PrimaryButton";

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
        callbackUrl: "/auth/post-login",
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
        <TextInput
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

        <PrimaryButton type="submit" loading={loading} disabled={loading}>
          Let&apos;s do this shit
        </PrimaryButton>
      </form>

      {/* Disclaimer */}
      <div
        style={{
          width: "100%",
          maxWidth: "344px",
          backgroundColor: "#FFFFFF",
          padding: "8px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginLeft: 0,
          marginRight: 0,
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
            padding: 0,
            height: "100%",
          }}
        >
          By continuing, you acknowledge Riff&apos;s Privacy Policy and agree to
          get occasional product update and promotional emails.
        </p>
      </div>
    </AuthCard>
  );
}
