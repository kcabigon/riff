"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import PrimaryButton from "@/components/PrimaryButton";
import TextInput from "@/components/TextInput";
import Avatar from "@/components/shared/Avatar";
import { formatSubmittedDate } from "@/lib/timeAgo";

type JoinStep = "email" | "check-email" | "name" | "join";

interface Props {
  piece: {
    id: string;
    title: string | null;
    subtitle: string | null;
    wordCount: number;
    readLengthMin: number;
    preview: string;
    submittedAt: string | null;
    author: {
      id: string;
      firstName: string | null;
      name: string | null;
      username: string | null;
      avatarUrl: string | null;
    };
  };
  isLoggedIn: boolean;
  hasName: boolean;
  needsOnboarding: boolean;
  user?: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  } | null;
}

export default function PieceJoinClient({
  piece,
  isLoggedIn,
  hasName,
  needsOnboarding,
}: Props) {
  const router = useRouter();

  const getInitialStep = (): JoinStep => {
    if (!isLoggedIn) return "email";
    if (!hasName) return "name";
    return "join";
  };

  const [step, setStep] = useState<JoinStep>(getInitialStep);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authorName =
    piece.author.firstName ||
    piece.author.name?.split(" ")[0] ||
    piece.author.username ||
    "Someone";
  const fullAuthorName =
    piece.author.name || piece.author.username || "Someone";

  const goToPiece = () => router.push(`/read/${piece.id}`);

  const handleJoin = async () => {
    setLoading(true);
    setError(null);
    try {
      if (needsOnboarding) {
        await fetch("/api/onboarding/complete", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step: "COMPLETED" }),
        });
      }
      const res = await fetch(`/api/pieces/${piece.id}/join`, {
        method: "POST",
      });
      if (res.ok) {
        goToPiece();
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong. Try again.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await signIn("resend", {
        email,
        redirect: false,
        callbackUrl: `/pieces/${piece.id}/join`,
      });
      if (result?.error) {
        setError("Failed to send magic link. Please try again.");
        setLoading(false);
      } else {
        setStep("check-email");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleNameSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter both first and last name");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const nameRes = await fetch("/api/onboarding/name", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      });
      if (!nameRes.ok) {
        const data = await nameRes.json();
        throw new Error(data.error || "Failed to save name");
      }
      await fetch("/api/onboarding/complete", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "COMPLETED" }),
      });

      const joinRes = await fetch(`/api/pieces/${piece.id}/join`, {
        method: "POST",
      });
      if (joinRes.ok) {
        goToPiece();
      } else {
        const data = await joinRes.json();
        throw new Error(data.error || "Failed to join");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}>
      <div
        style={{
          borderBottom: "1px solid #E6E6E6",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Link href="/" style={{ display: "flex" }}>
          <Image
            src="/images/riff_logo_black_shadow.svg"
            alt="Riff"
            width={44}
            height={28}
          />
        </Link>
      </div>

      <div
        style={{ maxWidth: "680px", margin: "0 auto", padding: "48px 24px 0" }}
      >
        <h1
          style={{
            fontFamily: "var(--font-dm-serif-text)",
            fontSize: "clamp(32px, 5vw, 40px)",
            fontWeight: 400,
            color: "#000000",
            margin: "0 0 12px 0",
            lineHeight: 1.2,
          }}
        >
          {piece.title || "Untitled"}
        </h1>

        {piece.subtitle && (
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#808080",
              margin: "0 0 24px 0",
              lineHeight: 1.5,
            }}
          >
            {piece.subtitle}
          </p>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "40px",
            paddingBottom: "24px",
            borderBottom: "1px solid #E6E6E6",
          }}
        >
          <Avatar user={piece.author} size={32} />
          <div>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#000000",
                margin: "0 0 2px 0",
              }}
            >
              {fullAuthorName}
            </p>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: 300,
                color: "#808080",
                margin: 0,
              }}
            >
              {piece.readLengthMin} min read
              {piece.wordCount > 0 &&
                ` · ${piece.wordCount.toLocaleString()} words`}
              {piece.submittedAt &&
                ` · ${formatSubmittedDate(piece.submittedAt)}`}
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: "680px",
          margin: "0 auto",
          padding: "0 24px",
          position: "relative",
        }}
      >
        <div
          style={{
            maxHeight: "480px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "18px",
              fontWeight: 400,
              lineHeight: 1.6,
              color: "#000000",
              margin: 0,
            }}
          >
            {piece.preview}
          </p>
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "160px",
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0) 0%, #FFFFFF 90%)",
            }}
          />
        </div>
      </div>

      <div
        style={{ maxWidth: "680px", margin: "0 auto", padding: "0 24px 96px" }}
      >
        <div
          style={{
            border: "2px solid #000000",
            boxShadow: "8px 8px 0px 0px #00FF66",
            backgroundColor: "#FFFFFF",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-dm-serif-text)",
              fontSize: "24px",
              fontWeight: 400,
              color: "#000000",
              margin: "0 0 12px 0",
            }}
          >
            {authorName} wants to riff
          </h2>
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: "#808080",
              margin: "0 0 24px 0",
              lineHeight: 1.5,
              maxWidth: "440px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Become Friends on Riff, then read and comment on the rest of this
            piece, plus everything {authorName} writes next.
          </p>

          {error && (
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: 300,
                color: "#DC2626",
                margin: "0 0 16px 0",
                textAlign: "center",
              }}
            >
              {error}
            </p>
          )}

          {step === "email" && (
            <form
              onSubmit={handleEmailSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                maxWidth: "320px",
                margin: "0 auto",
              }}
            >
              <TextInput
                type="email"
                name="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                autoFocus
                autoComplete="email"
              />
              <PrimaryButton type="submit" loading={loading}>
                Let&apos;s riff
              </PrimaryButton>
            </form>
          )}

          {step === "check-email" && (
            <div style={{ maxWidth: "320px", margin: "0 auto" }}>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "14px",
                  fontWeight: 300,
                  color: "#000000",
                  margin: 0,
                }}
              >
                We sent a magic link to <strong>{email}</strong>. Click it to
                continue.
              </p>
            </div>
          )}

          {step === "name" && (
            <form
              onSubmit={handleNameSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                maxWidth: "320px",
                margin: "0 auto",
              }}
            >
              <TextInput
                type="text"
                name="firstName"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={loading}
                required
                autoFocus
              />
              <TextInput
                type="text"
                name="lastName"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={loading}
                required
              />
              <PrimaryButton type="submit" loading={loading}>
                Let&apos;s riff
              </PrimaryButton>
            </form>
          )}

          {step === "join" && (
            <PrimaryButton loading={loading} onClick={handleJoin}>
              Let&apos;s riff
            </PrimaryButton>
          )}
        </div>
      </div>
    </div>
  );
}
