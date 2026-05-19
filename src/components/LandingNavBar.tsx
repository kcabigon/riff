"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signOut } from "next-auth/react";
import Avatar from "@/components/shared/Avatar";
import Dropdown, { DropdownItem } from "@/components/shared/Dropdown";
import { AvatarUser } from "@/types";

interface LandingNavBarProps {
  sticky?: boolean;
  user?: AvatarUser | null;
}

export default function LandingNavBar({
  sticky = false,
  user = null,
}: LandingNavBarProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      <nav
        style={{
          position: sticky ? "sticky" : "relative",
          top: sticky ? 0 : undefined,
          backgroundColor: "#000000",
          zIndex: 100,
        }}
      >
        <div
          style={{
            padding: "16px 42px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left: Logo + wordmark (wordmark hidden on mobile) */}
          <a
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            <Image
              src="/images/landing/riff_logo.svg"
              alt="Riff logo"
              width={55}
              height={36}
              priority
            />
            <span
              style={{
                fontFamily: "var(--font-playfair)",
                fontSize: "32px",
                fontWeight: 900,
                fontStyle: "italic",
                color: "#FFFFFF",
                lineHeight: 1,
              }}
              className="lnav-hidden-mobile"
            >
              Riff
            </span>
          </a>

          {/* Right: About + Sign In / Avatar (desktop only) */}
          <div
            className="lnav-desktop"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "40px",
            }}
          >
            <a
              href="/about"
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#FFFFFF",
                textDecoration: "none",
              }}
            >
              About
            </a>

            {user ? (
              <Dropdown
                trigger={
                  <Avatar
                    user={user}
                    size={40}
                    borderColor="#FFFFFF"
                    style={{ cursor: "pointer" }}
                  />
                }
                items={[
                  {
                    type: "action",
                    label: "Club",
                    onClick: () => router.push("/auth/post-login"),
                  },
                  {
                    type: "action",
                    label: "Profile",
                    onClick: () => router.push(`/profile/${user.id}`),
                  },
                  {
                    type: "action",
                    label: "Settings",
                    onClick: () => router.push("/settings"),
                  },
                  {
                    type: "action",
                    label: "Log out",
                    onClick: () => signOut({ callbackUrl: "/" }),
                  },
                ]}
                align="right"
                minWidth={160}
              />
            ) : (
              <button
                onClick={() => router.push("/login")}
                style={{
                  backgroundColor: "#000000",
                  border: "1px solid #FFFFFF",
                  padding: "12px 24px",
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  fontWeight: 400,
                  color: "#FFFFFF",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#FFFFFF";
                  e.currentTarget.style.color = "#000000";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#000000";
                  e.currentTarget.style.color = "#FFFFFF";
                }}
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile: avatar (logged in) or hamburger (logged out) */}
          <div className="lnav-mobile" style={{ display: "none" }}>
            {user ? (
              <Avatar
                user={user}
                size={40}
                borderColor="#FFFFFF"
                style={{ cursor: "pointer" }}
                onClick={() => setDrawerOpen(true)}
              />
            ) : (
              <button
                onClick={() => setDrawerOpen(true)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
                aria-label="Open menu"
              >
                <Image
                  src="/icons/mobile_menu.svg"
                  alt="Menu"
                  width={32}
                  height={32}
                />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div
          onClick={closeDrawer}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 199,
          }}
        />
      )}

      {/* Mobile Drawer Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100%",
          width: "280px",
          backgroundColor: "#000000",
          zIndex: 200,
          transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 300ms ease",
          display: "flex",
          flexDirection: "column",
          padding: "24px",
          gap: "24px",
        }}
      >
        <button
          onClick={closeDrawer}
          style={{
            alignSelf: "flex-end",
            background: "none",
            border: "none",
            color: "#FFFFFF",
            fontSize: "24px",
            cursor: "pointer",
            padding: 0,
            lineHeight: 1,
          }}
          aria-label="Close menu"
        >
          ✕
        </button>

        {user ? (
          <>
            <button
              onClick={() => {
                closeDrawer();
                router.push("/auth/post-login");
              }}
              style={drawerLinkStyle}
            >
              Club
            </button>
            <button
              onClick={() => {
                closeDrawer();
                router.push(`/profile/${user.id}`);
              }}
              style={drawerLinkStyle}
            >
              Profile
            </button>
            <button
              onClick={() => {
                closeDrawer();
                router.push("/settings");
              }}
              style={drawerLinkStyle}
            >
              Settings
            </button>
            <a href="/about" onClick={closeDrawer} style={drawerAnchorStyle}>
              About
            </a>
            <button
              onClick={() => {
                closeDrawer();
                signOut({ callbackUrl: "/" });
              }}
              style={{ ...drawerLinkStyle, color: "#808080" }}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                closeDrawer();
                router.push("/login");
              }}
              style={{
                backgroundColor: "#000000",
                border: "1px solid #FFFFFF",
                padding: "12px 24px",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 400,
                color: "#FFFFFF",
                cursor: "pointer",
              }}
            >
              Sign In
            </button>
            <a href="/about" onClick={closeDrawer} style={drawerAnchorStyle}>
              About
            </a>
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 767px) {
          .lnav-hidden-mobile { display: none !important; }
          .lnav-desktop { display: none !important; }
          .lnav-mobile { display: flex !important; }
        }
        @media (min-width: 768px) {
          .lnav-mobile { display: none !important; }
        }
      `}</style>
    </>
  );
}

const drawerLinkStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  fontFamily: "var(--font-dm-sans)",
  fontSize: "16px",
  fontWeight: 300,
  color: "#FFFFFF",
  cursor: "pointer",
  textAlign: "left",
};

const drawerAnchorStyle: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans)",
  fontSize: "16px",
  fontWeight: 300,
  color: "#FFFFFF",
  textDecoration: "none",
};
