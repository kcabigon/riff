import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import NavBar from "@/components/clubs/NavBar";
import RiffCard from "@/components/riffs/RiffCard";
import EmptyRiffState from "@/components/riffs/EmptyRiffState";

export default async function TestClubViewPage() {
  // Get authenticated user
  const sessionUser = await getCurrentUser();

  if (!sessionUser) {
    redirect("/test-auth");
  }

  // Fetch full user details from database
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
    },
  });

  if (!user) {
    redirect("/test-auth");
  }

  // Fetch user's clubs
  const clubs = await prisma.club.findMany({
    where: {
      members: {
        some: {
          userId: user.id,
        },
      },
      isArchived: false,
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
      admin: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
      moderator: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get the first club
  const currentClub = clubs[0];

  // Fetch riffs for the current club
  let activeRiffs: any[] = [];
  let completedRiffs: any[] = [];

  if (currentClub) {
    const riffs = await prisma.riff.findMany({
      where: {
        clubId: currentClub.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        pieces: {
          include: {
            piece: {
              select: {
                id: true,
                title: true,
                authorId: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    activeRiffs = riffs.filter((r) => r.status === "ACTIVE");
    completedRiffs = riffs.filter((r) => r.status === "COMPLETED");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FFFFFF",
      }}
    >
      <NavBar user={user} clubs={clubs} currentClub={currentClub} />

      {/* Main Content */}
      <main
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "48px 24px",
        }}
      >
        {/* Club Header */}
        {currentClub && (
          <div
            style={{
              marginBottom: "48px",
            }}
          >
            <h1
              style={{
                fontFamily: "var(--font-dm-serif-text)",
                fontSize: "32px",
                fontWeight: 400,
                lineHeight: 1.2,
                color: "#000000",
                marginBottom: "8px",
              }}
            >
              {currentClub.name}
            </h1>
            {currentClub.description && (
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  fontWeight: 300,
                  lineHeight: 1.6,
                  color: "#959595",
                }}
              >
                {currentClub.description}
              </p>
            )}
          </div>
        )}

        {/* Active Riffs Section */}
        <section style={{ marginBottom: "56px" }}>
          <h2
            style={{
              fontFamily: "var(--font-dm-serif-text)",
              fontSize: "24px",
              fontWeight: 400,
              lineHeight: 1.2,
              color: "#000000",
              marginBottom: "24px",
            }}
          >
            Current Riff
          </h2>

          {activeRiffs.length === 0 ? (
            <EmptyRiffState onStartNewRiff={() => {}} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {activeRiffs.map((riff) => {
                const isParticipant = riff.participants.some(
                  (p: any) => p.userId === user.id
                );
                const hasSubmitted = riff.pieces.some(
                  (pr: any) => pr.piece.authorId === user.id
                );

                return (
                  <RiffCard
                    key={riff.id}
                    riff={riff}
                    isJoined={isParticipant}
                    hasSubmitted={hasSubmitted}
                    currentUserId={user.id}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Completed Riffs Section */}
        {completedRiffs.length > 0 && (
          <section>
            <h2
              style={{
                fontFamily: "var(--font-dm-serif-text)",
                fontSize: "24px",
                fontWeight: 400,
                lineHeight: 1.2,
                color: "#000000",
                marginBottom: "24px",
              }}
            >
              Completed Riffs
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: "20px",
              }}
            >
              {completedRiffs.map((riff) => (
                <div
                  key={riff.id}
                  style={{
                    width: "240px",
                    height: "320px",
                    border: "1px solid #000000",
                    boxShadow: "8px 8px 0px 0px #000000",
                    position: "relative",
                    backgroundColor: "#000000",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "24px",
                  }}
                >
                  <div style={{ textAlign: "center" }}>
                    <h3
                      style={{
                        fontFamily: "var(--font-dm-serif-text)",
                        fontSize: "20px",
                        fontWeight: 400,
                        lineHeight: 1.2,
                        marginBottom: "8px",
                      }}
                    >
                      {riff.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "12px",
                        fontWeight: 300,
                        lineHeight: 1.4,
                        color: "#FFFFFF",
                      }}
                    >
                      {riff.pieces.length} submission{riff.pieces.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
