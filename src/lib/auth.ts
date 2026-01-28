import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import { prisma } from "./prisma";
import { sendMagicLinkEmail } from "./resend";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM || "noreply@localhost",
      // Custom email sender
      sendVerificationRequest: async ({ identifier: email, url, provider }) => {
        try {
          await sendMagicLinkEmail(email, url);
        } catch (error) {
          console.error("Failed to send magic link email:", error);
          throw new Error("Failed to send magic link email");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/auth/check-email",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).username = token.username;
      }
      return session;
    },
    // Redirect to user's first club after successful sign-in
    async redirect({ url, baseUrl }) {
      // If URL is already specified and valid, use it
      if (url.startsWith(baseUrl)) {
        return url;
      }

      // For external URLs or after sign in, redirect to clubs
      return `${baseUrl}/clubs`;
    },
  },
});
