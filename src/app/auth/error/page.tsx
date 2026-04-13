"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import PrimaryButton from "@/components/PrimaryButton";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case "Configuration":
        return "There is a problem with the server configuration.";
      case "AccessDenied":
        return "Access denied. You do not have permission to sign in.";
      case "Verification":
        return "The verification link is invalid or has expired.";
      default:
        return "An error occurred during authentication.";
    }
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
        {/* Error Icon */}
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: "#FF0000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid #000000",
          }}
        >
          <span
            style={{
              fontSize: "32px",
              color: "#FFFFFF",
              fontWeight: "bold",
            }}
          >
            !
          </span>
        </div>

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
          Authentication Error
        </h1>

        {/* Error Message */}
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
          {getErrorMessage(error)}
        </p>

        {/* Error Code */}
        {error && (
          <div
            style={{
              padding: "8px 16px",
              backgroundColor: "#F5F5F5",
              border: "1px solid #E6E6E6",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: 300,
                color: "#959595",
                margin: 0,
              }}
            >
              Error code: {error}
            </p>
          </div>
        )}

        {/* Action Button */}
        <div style={{ width: "100%", marginTop: "24px" }}>
          <Link href="/login" style={{ textDecoration: "none", width: "100%" }}>
            <PrimaryButton>Try again</PrimaryButton>
          </Link>
        </div>

        {/* Help Text */}
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            lineHeight: 1.6,
            color: "#959595",
            margin: 0,
            marginTop: "16px",
          }}
        >
          If the problem persists, please contact support.
        </p>
      </div>
    </AuthCard>
  );
}

export default function AuthErrorPage() {
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
      <ErrorContent />
    </Suspense>
  );
}
