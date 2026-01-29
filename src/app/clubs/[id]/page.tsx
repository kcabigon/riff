import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ClubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Verify user is a member of this club
  const membership = await prisma.clubMember.findFirst({
    where: {
      clubId: id,
      userId: (session.user as any).id,
    },
    include: {
      club: {
        select: {
          id: true,
          name: true,
          description: true,
          bannerImage: true,
        },
      },
    },
  });

  if (!membership) {
    redirect("/clubs");
  }

  const club = membership.club;

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 24px",
        fontFamily: "var(--font-dm-sans)",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Banner */}
        {club.bannerImage && (
          <div
            style={{
              width: "100%",
              height: "300px",
              backgroundColor: "#E6E6E6",
              marginBottom: "32px",
              backgroundImage: `url(${club.bannerImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              border: "2px solid #000000",
            }}
          />
        )}

        {/* Club info */}
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "48px",
              fontWeight: 300,
              margin: "0 0 16px 0",
            }}
          >
            {club.name}
          </h1>
          {club.description && (
            <p
              style={{
                fontSize: "18px",
                fontWeight: 300,
                color: "#959595",
                margin: 0,
              }}
            >
              {club.description}
            </p>
          )}
        </div>

        {/* Placeholder content */}
        <div
          style={{
            padding: "40px",
            backgroundColor: "#F9F9F9",
            border: "2px dashed #E6E6E6",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "18px",
              fontWeight: 300,
              color: "#959595",
              margin: 0,
            }}
          >
            Welcome to your club! More features coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
