/* eslint-disable no-console -- dev sandbox page; not shipped to users */
"use client";

import { useState } from "react";
import Avatar from "@/components/shared/Avatar";
import AvatarStack from "@/components/shared/AvatarStack";
import { AvatarUser, AvatarUserWithTag } from "@/types";

export default function TestAvatarStackPage() {
  const [clickedUser, setClickedUser] = useState<string>("");

  // Sample users with photos
  const userWithPhoto: AvatarUser = {
    id: "1",
    name: "Taylor Swift",
    username: "taylorswift",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  };

  // Sample users with initials only
  const usersWithInitials: AvatarUser[] = [
    { id: "2", name: "Paul Lahote", username: "pl", avatarUrl: null },
    { id: "3", name: "Charlie Anderson", username: "ca", avatarUrl: null },
    { id: "4", name: null, username: "user4", avatarUrl: null },
    { id: "5", name: "Kim Davis", username: "kd", avatarUrl: null },
    { id: "6", name: "Elena Vasquez", username: "ev", avatarUrl: null },
  ];

  // Sample users for stacks (club view with host)
  const clubMembers: AvatarUserWithTag[] = [
    {
      id: "host",
      name: "Emily Rodriguez",
      username: "emily",
      avatarUrl:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      tag: "H", // Host tag
    },
    { id: "2", name: "Taylor Swift", username: "ts", avatarUrl: null },
    {
      id: "3",
      name: "John Doe",
      username: "jd",
      avatarUrl:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    },
    {
      id: "4",
      name: "Sarah Wilson",
      username: "sw",
      avatarUrl:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    },
    { id: "5", name: "Paul Lahote", username: "pl", avatarUrl: null },
    {
      id: "6",
      name: "Maria Garcia",
      username: "mg",
      avatarUrl:
        "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop",
    },
    { id: "7", name: null, username: "user7", avatarUrl: null },
    { id: "8", name: "Charlie Anderson", username: "ca", avatarUrl: null },
  ];

  // Sample users for riff view (creator first)
  const riffParticipants: AvatarUserWithTag[] = [
    { id: "2", name: "Taylor Swift", username: "ts", avatarUrl: null },
    {
      id: "3",
      name: "John Doe",
      username: "jd",
      avatarUrl:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    },
    { id: "5", name: "Paul Lahote", username: "pl", avatarUrl: null },
    { id: "8", name: "Charlie Anderson", username: "ca", avatarUrl: null },
    {
      id: "6",
      name: "Maria Garcia",
      username: "mg",
      avatarUrl:
        "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop",
    },
    {
      id: "4",
      name: "Sarah Wilson",
      username: "sw",
      avatarUrl:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    },
  ];

  const handleAvatarClick = (userId: string) => {
    console.log("Avatar clicked:", userId);
    setClickedUser(userId);
  };

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "32px",
          fontWeight: 300,
          marginBottom: "40px",
        }}
      >
        Avatar & AvatarStack Component Test Page
      </h1>

      {clickedUser && (
        <div
          style={{
            padding: "16px",
            backgroundColor: "#00FF66",
            border: "2px solid #000000",
            marginBottom: "32px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              margin: 0,
            }}
          >
            Last clicked user ID: <strong>{clickedUser}</strong>
          </p>
        </div>
      )}

      {/* Section 1: Single Avatars - All Sizes */}
      <section style={{ marginBottom: "48px" }}>
        <h2
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "24px",
            fontWeight: 600,
            marginBottom: "24px",
          }}
        >
          1. Single Avatars - All Sizes
        </h2>

        <div
          style={{
            display: "flex",
            gap: "24px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p style={{ marginBottom: "8px", fontSize: "14px" }}>24px</p>
            <Avatar
              user={userWithPhoto}
              size={24}
              onClick={handleAvatarClick}
            />
          </div>
          <div>
            <p style={{ marginBottom: "8px", fontSize: "14px" }}>
              32px (default)
            </p>
            <Avatar
              user={userWithPhoto}
              size={32}
              onClick={handleAvatarClick}
            />
          </div>
          <div>
            <p style={{ marginBottom: "8px", fontSize: "14px" }}>40px</p>
            <Avatar
              user={userWithPhoto}
              size={40}
              onClick={handleAvatarClick}
            />
          </div>
          <div>
            <p style={{ marginBottom: "8px", fontSize: "14px" }}>48px</p>
            <Avatar
              user={userWithPhoto}
              size={48}
              onClick={handleAvatarClick}
            />
          </div>
        </div>
      </section>

      {/* Section 2: Border Variations */}
      <section style={{ marginBottom: "48px" }}>
        <h2
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "24px",
            fontWeight: 600,
            marginBottom: "24px",
          }}
        >
          2. Border Variations
        </h2>

        <div
          style={{
            display: "flex",
            gap: "24px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p style={{ marginBottom: "8px", fontSize: "14px" }}>
              Black 2px (club view)
            </p>
            <Avatar
              user={usersWithInitials[0]}
              size={48}
              borderColor="#000000"
              onClick={handleAvatarClick}
            />
          </div>
          <div style={{ backgroundColor: "#000000", padding: "16px" }}>
            <p style={{ marginBottom: "8px", fontSize: "14px", color: "#FFF" }}>
              White 1px (navbar)
            </p>
            <Avatar
              user={usersWithInitials[1]}
              size={40}
              borderColor="#FFFFFF"
              onClick={handleAvatarClick}
            />
          </div>
          <div>
            <p style={{ marginBottom: "8px", fontSize: "14px" }}>No border</p>
            <Avatar
              user={usersWithInitials[2]}
              size={32}
              onClick={handleAvatarClick}
            />
          </div>
          <div>
            <p style={{ marginBottom: "8px", fontSize: "14px" }}>
              Green 2px (future)
            </p>
            <Avatar
              user={usersWithInitials[3]}
              size={48}
              borderColor="#00FF66"
              onClick={handleAvatarClick}
            />
          </div>
          <div>
            <p style={{ marginBottom: "8px", fontSize: "14px" }}>
              Cyan 3px (future)
            </p>
            <Avatar
              user={usersWithInitials[4]}
              size={48}
              borderColor="#01EFFC"
              onClick={handleAvatarClick}
            />
          </div>
        </div>
      </section>

      {/* Section 3: With Tags */}
      <section style={{ marginBottom: "48px" }}>
        <h2
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "24px",
            fontWeight: 600,
            marginBottom: "24px",
          }}
        >
          3. Avatars with Tags/Labels
        </h2>

        <div
          style={{
            display: "flex",
            gap: "24px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p style={{ marginBottom: "8px", fontSize: "14px" }}>Host (H)</p>
            <Avatar
              user={userWithPhoto}
              size={48}
              tag="H"
              onClick={handleAvatarClick}
            />
          </div>
          <div>
            <p style={{ marginBottom: "8px", fontSize: "14px" }}>
              Moderator (M)
            </p>
            <Avatar
              user={usersWithInitials[0]}
              size={48}
              tag="M"
              onClick={handleAvatarClick}
            />
          </div>
          <div>
            <p style={{ marginBottom: "8px", fontSize: "14px" }}>New (N)</p>
            <Avatar
              user={usersWithInitials[1]}
              size={48}
              tag="N"
              onClick={handleAvatarClick}
            />
          </div>
          <div>
            <p style={{ marginBottom: "8px", fontSize: "14px" }}>
              Custom (1, 2, etc)
            </p>
            <Avatar
              user={usersWithInitials[2]}
              size={48}
              tag="3"
              onClick={handleAvatarClick}
            />
          </div>
        </div>
      </section>

      {/* Section 4: Club View Avatar Stack */}
      <section style={{ marginBottom: "48px" }}>
        <h2
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "24px",
            fontWeight: 600,
            marginBottom: "16px",
          }}
        >
          4. Club View - Avatar Stack
        </h2>
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            color: "#666",
            marginBottom: "24px",
          }}
        >
          48px avatars, 2px black borders, host first with "H" tag, rightmost on
          top
        </p>

        <AvatarStack
          users={clubMembers}
          size={48}
          borderColor="#000000"
          onAvatarClick={handleAvatarClick}
        />
      </section>

      {/* Section 5: Riff View Avatar Stack */}
      <section style={{ marginBottom: "48px" }}>
        <h2
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "24px",
            fontWeight: 600,
            marginBottom: "16px",
          }}
        >
          5. Riff View - Avatar Stack
        </h2>
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            color: "#666",
            marginBottom: "24px",
          }}
        >
          32px avatars, no borders, creator first, rightmost on top
        </p>

        <AvatarStack
          users={riffParticipants}
          size={32}
          onAvatarClick={handleAvatarClick}
        />
      </section>

      {/* Section 6: Z-Index Demonstration */}
      <section style={{ marginBottom: "48px" }}>
        <h2
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "24px",
            fontWeight: 600,
            marginBottom: "16px",
          }}
        >
          6. Z-Index Stacking Demo
        </h2>
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            color: "#666",
            marginBottom: "24px",
          }}
        >
          The rightmost avatar should appear on top (highest z-index). Try
          hovering to see stacking order.
        </p>

        <AvatarStack
          users={[
            { ...usersWithInitials[0], tag: "1" },
            { ...usersWithInitials[1], tag: "2" },
            { ...usersWithInitials[2], tag: "3" },
            { ...usersWithInitials[3], tag: "4" },
            { ...usersWithInitials[4], tag: "5" },
          ]}
          size={48}
          borderColor="#000000"
          onAvatarClick={handleAvatarClick}
        />
      </section>

      {/* Section 7: Photo vs Initials Mix */}
      <section style={{ marginBottom: "48px" }}>
        <h2
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "24px",
            fontWeight: 600,
            marginBottom: "16px",
          }}
        >
          7. Mixed: Photos & Initials
        </h2>
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            color: "#666",
            marginBottom: "24px",
          }}
        >
          Stack showing both user photos and initials fallback
        </p>

        <AvatarStack
          users={clubMembers.slice(0, 6)}
          size={40}
          borderColor="#000000"
          onAvatarClick={handleAvatarClick}
        />
      </section>

      {/* Section 8: Edge Cases */}
      <section style={{ marginBottom: "48px" }}>
        <h2
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "24px",
            fontWeight: 600,
            marginBottom: "16px",
          }}
        >
          8. Edge Cases
        </h2>

        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <div>
            <p style={{ marginBottom: "8px", fontSize: "14px" }}>
              Username only (no name)
            </p>
            <Avatar
              user={{
                id: "edge1",
                name: null,
                username: "user123",
                avatarUrl: null,
              }}
              size={48}
              onClick={handleAvatarClick}
            />
          </div>
          <div>
            <p style={{ marginBottom: "8px", fontSize: "14px" }}>
              Name only (no username)
            </p>
            <Avatar
              user={{
                id: "edge2",
                name: "John Smith",
                username: null,
                avatarUrl: null,
              }}
              size={48}
              onClick={handleAvatarClick}
            />
          </div>
          <div>
            <p style={{ marginBottom: "8px", fontSize: "14px" }}>
              Single name (no space)
            </p>
            <Avatar
              user={{
                id: "edge3",
                name: "Madonna",
                username: null,
                avatarUrl: null,
              }}
              size={48}
              onClick={handleAvatarClick}
            />
          </div>
          <div>
            <p style={{ marginBottom: "8px", fontSize: "14px" }}>
              Empty strings fallback
            </p>
            <Avatar
              user={{
                id: "edge4",
                name: null,
                username: null,
                avatarUrl: null,
              }}
              size={48}
              onClick={handleAvatarClick}
            />
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section
        style={{
          marginTop: "64px",
          padding: "24px",
          backgroundColor: "#F5F5F5",
          border: "2px solid #000000",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "18px",
            fontWeight: 600,
            marginBottom: "16px",
          }}
        >
          Testing Instructions
        </h3>
        <ul
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            lineHeight: "1.6",
          }}
        >
          <li>Hover over any avatar to see the tooltip with the user's name</li>
          <li>
            Click on any avatar to see the clicked user ID displayed at the top
          </li>
          <li>
            Verify z-index stacking: rightmost avatars should appear on top when
            overlapping
          </li>
          <li>Check all border variations render correctly</li>
          <li>Verify tags display at the top-left corner</li>
          <li>Test that all sizes (24, 32, 40, 48px) render proportionally</li>
          <li>Verify initials fallback works for users without photos</li>
        </ul>
      </section>
    </div>
  );
}
