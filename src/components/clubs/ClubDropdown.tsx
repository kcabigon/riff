"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface ClubDropdownProps {
  clubs: Array<{
    id: string;
    name: string;
  }>;
  currentClub: {
    id: string;
    name: string;
  };
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export default function ClubDropdown({
  clubs,
  currentClub,
  isOpen,
  onToggle,
  onClose,
}: ClubDropdownProps) {
  const [isHovered, setIsHovered] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleClubSelect = (clubId: string) => {
    onClose();
    router.push(`/clubs/${clubId}`);
  };

  const handleStartNewClub = () => {
    onClose();
    router.push("/onboarding/create-club");
  };

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        onClick={onToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          backgroundColor: isOpen ? "#FFFFFF" : "#000000",
          border: `1px solid ${isOpen ? "#00FF66" : "#FFFFFF"}`,
          boxShadow: "2px 2px 0px 0px #FFFFFF",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          transition: "none",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "12px",
            fontWeight: 300,
            color: isOpen
              ? "#000000"
              : isHovered
                ? "#00FF66"
                : "#FFFFFF",
            transition: "none",
            maxWidth: "160px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {currentClub.name}
        </span>

        {/* Down Arrow Icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          style={{
            color: isOpen
              ? "#000000"
              : isHovered
                ? "#00FF66"
                : "#FFFFFF",
            transition: "none",
          }}
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            minWidth: "200px",
            backgroundColor: "#FFFFFF",
            border: "1px solid #00FF66",
            zIndex: 1000,
          }}
        >
          {/* Club List */}
          {clubs.map((club) => (
            <button
              key={club.id}
              onClick={() => handleClubSelect(club.id)}
              style={{
                width: "100%",
                padding: "8px 12px",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: 300,
                color: club.id === currentClub.id ? "#00FF66" : "#000000",
                backgroundColor: "transparent",
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                transition: "none",
              }}
              onMouseEnter={(e) => {
                if (club.id !== currentClub.id) {
                  e.currentTarget.style.backgroundColor = "#F5F5F5";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {club.name}
            </button>
          ))}

          {/* Separator */}
          {clubs.length > 0 && (
            <div
              style={{
                height: "1px",
                backgroundColor: "#808080",
                borderTop: "1px dashed #808080",
                margin: "4px 0",
              }}
            />
          )}

          {/* Start New Club Action */}
          <button
            onClick={handleStartNewClub}
            style={{
              width: "100%",
              padding: "8px 12px",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              fontWeight: 300,
              color: "#808080",
              backgroundColor: "transparent",
              border: "none",
              textAlign: "left",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#F5F5F5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{ color: "#808080" }}
            >
              <path
                d="M8 3V13M3 8H13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Start new club
          </button>
        </div>
      )}
    </div>
  );
}
