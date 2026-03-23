import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import { prisma } from "./prisma";
import { sendSignInEmail, sendOnboardingEmail } from "./resend";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: {
    ...PrismaAdapter(prisma),
    // Override createUser to allow partial user creation (email only)
    createUser: async (user: { email: string; emailVerified: Date | null }) => {
      return await prisma.user.create({
        data: {
          email: user.email.toLowerCase(),
          emailVerified: user.emailVerified,
          name: null, // Explicitly set to null - will be collected during onboarding
          // name and username are optional now, will be collected during onboarding
          onboardingStep: "NAME", // Start at NAME step for new users
          onboardingCompleted: false,
        },
      });
    },
  },
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM || "noreply@localhost",
      // Custom email sender - will be called for both new and existing users
      sendVerificationRequest: async ({ identifier: email, url }) => {
        try {
          // Check if user exists to determine which email template to use
          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: { id: true, onboardingCompleted: true },
          });

          if (user && user.onboardingCompleted) {
            // Existing user - send sign-in email
            await sendSignInEmail(email, url);
          } else {
            // New user or incomplete onboarding - send onboarding email
            await sendOnboardingEmail(email, url);
          }
        } catch (error) {
          console.error("Failed to send authentication email:", error);
          throw new Error("Failed to send authentication email");
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
        token.username = user.username;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.onboardingCompleted = user.onboardingCompleted;
        token.onboardingStep = user.onboardingStep;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.onboardingCompleted = token.onboardingCompleted;
        session.user.onboardingStep = token.onboardingStep;
      }
      return session;
    },
    // Redirect based on onboarding status
    async redirect({ url, baseUrl }) {
      // If URL is already specified and valid, use it
      if (url.startsWith(baseUrl)) {
        return url;
      }

      // Get user to check onboarding status
      const session = await auth();
      if (session?.user) {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: {
            onboardingCompleted: true,
            onboardingStep: true,
            lastActiveClubId: true,
            clubMemberships: {
              select: { clubId: true },
              orderBy: { joinedAt: "asc" },
              take: 1,
            },
          },
        });

        if (!user?.onboardingCompleted) {
          // Redirect to appropriate onboarding step
          const step = user?.onboardingStep || "NAME";
          const stepRoutes = {
            NAME: "/onboarding/name",
            CLUB_CHOICE: "/onboarding/club-choice",
            INVITE: "/onboarding/invite",
            COMPLETED: "/clubs",
          };
          return `${baseUrl}${stepRoutes[step as keyof typeof stepRoutes]}`;
        }

        // User has completed onboarding
        if (user.lastActiveClubId) {
          // Check if user is still a member of last active club
          const isMember = await prisma.clubMember.findFirst({
            where: {
              userId: session.user.id,
              clubId: user.lastActiveClubId,
            },
          });
          if (isMember) {
            return `${baseUrl}/clubs/${user.lastActiveClubId}`;
          }
        }

        // Fallback to first club
        if (user.clubMemberships.length > 0) {
          return `${baseUrl}/clubs/${user.clubMemberships[0].clubId}`;
        }

        // No clubs - redirect to create club (edge case)
        return `${baseUrl}/onboarding/create-club`;
      }

      // Default fallback
      return `${baseUrl}/login`;
    },
  },
});
