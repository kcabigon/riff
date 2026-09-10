import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import JoinRiffClient from "@/components/riffs/JoinRiffClient";
import { getRiffDisplayTitle } from "@/lib/riff-utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const riff = await prisma.riff.findUnique({
    where: { id },
    select: { title: true, prompt: true, volumeNumber: true, status: true },
  });

  if (!riff) {
    return { title: "Join a Riff on Riff" };
  }

  const title = `Join "${getRiffDisplayTitle(riff)}" on Riff`;

  if (riff.prompt) {
    return {
      title,
      description: riff.prompt,
      openGraph: { title, description: riff.prompt },
      twitter: { card: "summary", title, description: riff.prompt },
    };
  }

  return { title };
}

export default async function JoinRiffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: riffId } = await params;

  // Fetch riff details — public, no auth required
  const riff = await prisma.riff.findUnique({
    where: { id: riffId },
    select: {
      id: true,
      title: true,
      prompt: true,
      deadline: true,
      status: true,
      volumeNumber: true,
      clubId: true,
      creator: {
        select: { id: true, name: true, username: true, avatarUrl: true },
      },
    },
  });

  if (!riff) {
    notFound();
  }

  // Club riffs stay behind club membership — this join route is clubless-only.
  if (riff.clubId) {
    redirect(`/riffs/${riffId}`);
  }

  const session = await getSession();

  let hasName = false;
  let needsOnboarding = false;
  let loggedInUser: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  } | null = null;
  let userClubs: Array<{ id: string; name: string }> = [];
  let lastActiveClubId: string | null = null;

  // Logged in — already a participant? go straight to the riff
  if (session?.user) {
    const userId = session.user.id;

    const participant = await prisma.riffParticipant.findUnique({
      where: { riffId_userId: { riffId, userId } },
    });
    if (participant) {
      redirect(`/riffs/${riffId}`);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        name: true,
        username: true,
        avatarUrl: true,
        onboardingCompleted: true,
        lastActiveClubId: true,
        clubMemberships: {
          select: {
            club: { select: { id: true, name: true } },
          },
        },
      },
    });

    hasName = !!user?.firstName;
    needsOnboarding = !user?.onboardingCompleted;

    if (user) {
      loggedInUser = {
        id: user.id,
        name: user.name,
        username: user.username,
        avatarUrl: user.avatarUrl,
      };
      userClubs = user.clubMemberships.map((m) => m.club);
      lastActiveClubId = user.lastActiveClubId;
    }
  }

  return (
    <JoinRiffClient
      riff={{
        id: riff.id,
        title: riff.title,
        prompt: riff.prompt,
        deadline: riff.deadline ? riff.deadline.toISOString() : null,
        status: riff.status,
        volumeNumber: riff.volumeNumber,
        creator: riff.creator,
      }}
      isLoggedIn={!!session?.user}
      hasName={hasName}
      needsOnboarding={needsOnboarding}
      user={loggedInUser}
      userClubs={userClubs}
      lastActiveClubId={lastActiveClubId}
    />
  );
}
