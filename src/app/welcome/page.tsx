import { requireAuth } from "@/lib/auth-utils";
import WelcomeTutorial from "@/components/welcome/WelcomeTutorial";

export const metadata = {
  title: "Welcome · Riff",
};

export default async function WelcomePage() {
  await requireAuth();
  return <WelcomeTutorial />;
}
