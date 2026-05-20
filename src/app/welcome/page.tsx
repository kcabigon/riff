import { requireAuth } from "@/lib/auth-utils";
import WelcomeClient from "@/components/welcome/WelcomeClient";

export const metadata = {
  title: "Welcome",
};

export default async function WelcomePage() {
  await requireAuth();
  return <WelcomeClient />;
}
