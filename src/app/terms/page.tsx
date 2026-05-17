import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Terms & Privacy",
  description: "Terms of use and privacy policy for Riff.",
};

const heading: React.CSSProperties = {
  fontFamily: "var(--font-dm-serif-text)",
  fontSize: "24px",
  fontWeight: 400,
  color: "#000000",
  margin: "48px 0 16px 0",
  lineHeight: 1.2,
};

const body: React.CSSProperties = {
  fontFamily: "var(--font-playfair), serif",
  fontSize: "16px",
  lineHeight: 1.7,
  color: "#000000",
  margin: "0 0 16px 0",
};

export default function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}>
      {/* Header */}
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

      {/* Content */}
      <div
        style={{
          maxWidth: "680px",
          margin: "0 auto",
          padding: "48px 24px 96px",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-dm-serif-text)",
            fontSize: "clamp(32px, 5vw, 40px)",
            fontWeight: 400,
            color: "#000000",
            margin: "0 0 8px 0",
            lineHeight: 1.2,
          }}
        >
          Terms & Privacy
        </h1>

        <p
          style={{
            ...body,
            color: "#808080",
            fontSize: "14px",
            fontFamily: "var(--font-dm-sans)",
            margin: "0 0 48px 0",
          }}
        >
          Last updated: May 17, 2026
        </p>

        <p style={body}>
          Riff is a small side project built by friends, for friends. We
          don&apos;t run ads and we don&apos;t sell your data. These terms
          reflect that — they&apos;re written in plain language because we think
          that&apos;s how it should be.
        </p>

        {/* Privacy */}
        <h2 style={heading}>What we collect</h2>
        <p style={body}>
          When you sign up, we collect your <strong>email address</strong> (for
          login), your <strong>name</strong> (so your friends know who you are),
          and optionally a <strong>bio and avatar</strong>. Everything you write
          on Riff — essays, comments, cover images — is stored so the app works.
        </p>

        <h2 style={heading}>Where it&apos;s stored</h2>
        <p style={body}>
          Your data lives on <strong>Supabase</strong> (database and image
          storage) and <strong>Vercel</strong> (hosting). We use{" "}
          <strong>Resend</strong> to send you emails. That&apos;s it — no
          analytics services, no tracking pixels, no third-party ad networks.
        </p>

        <h2 style={heading}>Cookies</h2>
        <p style={body}>
          We use a single session cookie to keep you logged in. No tracking
          cookies, no fingerprinting.
        </p>

        <h2 style={heading}>Emails</h2>
        <p style={body}>
          We send you emails when things happen in your club — new riffs, pieces
          revealed, comments on your writing. We also send occasional product
          updates. We&apos;ll never spam you or share your email with anyone.
        </p>

        <h2 style={heading}>Deleting your data</h2>
        <p style={body}>
          You can delete your account anytime from <strong>Settings</strong>.
          This permanently removes your profile, your writing, and all
          associated data. Once it&apos;s gone, it&apos;s gone.
        </p>

        {/* Terms */}
        <h2 style={{ ...heading, marginTop: "64px" }}>Your content</h2>
        <p style={body}>
          You own everything you write on Riff. We don&apos;t claim any rights
          to your essays, comments, or images. We only store and display your
          content to make the app work for you and your club.
        </p>

        <h2 style={heading}>Be cool</h2>
        <p style={body}>
          Don&apos;t use Riff to post anything harmful, illegal, or harassing.
          We can remove accounts that violate this, but honestly — this is a
          writing platform for friends. Just be cool.
        </p>

        <h2 style={heading}>The fine print</h2>
        <p style={body}>
          Riff is provided as-is. It&apos;s a passion project between friends
          who want to bring back the art of writing. We&apos;re going to keep it
          running for as long as we can, but we can&apos;t guarantee uptime or
          that we&apos;ll keep the service going forever. Back up anything you
          can&apos;t afford to lose (we offer .docx export in Settings for
          exactly this reason).
        </p>

        <p style={body}>
          Happy writing! We hope this brings you and your friends as much joy as
          it&apos;s brought us.
        </p>

        <p
          style={{
            ...body,
            color: "#808080",
            marginTop: "64px",
            fontSize: "14px",
          }}
        >
          Questions? Reach out to{" "}
          <a href="mailto:kyle.cabigon@gmail.com" style={{ color: "#808080" }}>
            kyle.cabigon@gmail.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
