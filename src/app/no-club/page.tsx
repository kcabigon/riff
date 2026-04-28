import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import NoClubClient from "./NoClubClient";

export default async function NoClubPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
    },
  });

  if (!user) redirect("/login");

  return <NoClubClient user={user} />;
}
