import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Enter your email to get a magic link and sign in to Riff.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
