import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    onboardingCompleted?: boolean;
    onboardingStep?: string | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      username?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      onboardingCompleted?: boolean;
      onboardingStep?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    onboardingCompleted?: boolean;
    onboardingStep?: string | null;
  }
}
