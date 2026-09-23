import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import CreateRiffClient from "@/components/riffs/CreateRiffClient";

export const dynamic = "force-dynamic";

export default async function NewRiffPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  return <CreateRiffClient />;
}
