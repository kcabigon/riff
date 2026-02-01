import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        padding: "40px 24px",
      }}
    >
      <div
        style={{
          maxWidth: "560px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "40px",
        }}
      >
        {/* Wordmark */}
        <Image
          src="/images/riff_wordmark_black_outline.svg"
          alt="Riff"
          width={160}
          height={104}
          priority
        />

        {/* Tagline */}
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "18px",
            fontWeight: 300,
            color: "#959595",
            textAlign: "center",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          A private essay-sharing platform for creative communities.
        </p>

        {/* CTA */}
        <Link
          href="/login"
          style={{
            backgroundColor: "#FFFFFF",
            border: "2px solid #000000",
            boxShadow: "8px 8px 0px 0px #00FF66",
            padding: "12px 64px",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#000000",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}
