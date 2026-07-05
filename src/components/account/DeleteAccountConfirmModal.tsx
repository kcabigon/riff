"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import Modal from "@/components/shared/Modal";
import TextInput from "@/components/TextInput";
import DestructiveButton from "@/components/DestructiveButton";

interface BlockingClub {
  id: string;
  name: string;
}

interface DeleteAccountConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatClubNames(clubs: BlockingClub[]): string {
  if (clubs.length === 1) return clubs[0].name;
  if (clubs.length === 2) return `${clubs[0].name} and ${clubs[1].name}`;
  return `${clubs
    .slice(0, -1)
    .map((c) => c.name)
    .join(", ")}, and ${clubs[clubs.length - 1].name}`;
}

export default function DeleteAccountConfirmModal({
  isOpen,
  onClose,
}: DeleteAccountConfirmModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockingClubs, setBlockingClubs] = useState<BlockingClub[] | null>(
    null
  );
  const [isChecking, setIsChecking] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const isConfirmed = confirmText === "DELETE";
  const isBlocked = blockingClubs !== null && blockingClubs.length > 0;

  useEffect(() => {
    if (!isOpen) {
      setConfirmText("");
      setError(null);
      setIsDeleting(false);
      setBlockingClubs(null);
      setIsChecking(false);
      setFetchError(false);
      return;
    }

    let ignore = false;
    setIsChecking(true);
    setFetchError(false);
    fetch("/api/users/me/admin-clubs")
      .then((res) => {
        if (!res.ok) throw new Error("check_failed");
        return res.json();
      })
      .then((data) => {
        if (!ignore) setBlockingClubs(data.blockingClubs ?? []);
      })
      .catch(() => {
        if (!ignore) setFetchError(true);
      })
      .finally(() => {
        if (!ignore) setIsChecking(false);
      });

    return () => {
      ignore = true;
    };
  }, [isOpen]);

  const handleDelete = async () => {
    if (!isConfirmed) return;
    setIsDeleting(true);
    setError(null);

    try {
      const res = await fetch("/api/users/me", { method: "DELETE" });

      if (!res.ok) {
        setError(
          res.status === 409
            ? "You're hosting a club with other members. Head to your club settings to transfer host or delete the club first."
            : "Something went wrong. Please try again."
        );
        setIsDeleting(false);
        return;
      }

      await signOut({ callbackUrl: "/" });
    } catch {
      setError("Something went wrong. Please try again.");
      setIsDeleting(false);
    }
  };

  const buttonDisabled = !isConfirmed || isDeleting;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete your account?"
      size="sm"
    >
      {isChecking ? (
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#808080",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          Loading...
        </p>
      ) : fetchError ? (
        <>
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#808080",
              margin: "0 0 24px",
              lineHeight: 1.6,
            }}
          >
            Unable to verify your clubs right now. Close and try again.
          </p>
          <div style={{ textAlign: "center" }}>
            <button
              onClick={onClose}
              style={{
                backgroundColor: "#FFFFFF",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: 300,
                color: "#808080",
                padding: "4px 12px",
                textDecoration: "underline",
              }}
            >
              Cancel
            </button>
          </div>
        </>
      ) : isBlocked ? (
        <>
          {/* Host gate warning box */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "2px solid #DC2626",
              padding: "16px",
              marginBottom: "24px",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#DC2626",
                margin: "0 0 4px",
                lineHeight: 1.6,
              }}
            >
              You&apos;re the host of{" "}
              <strong>{formatClubNames(blockingClubs)}</strong>.
            </p>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#808080",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              You can&apos;t delete your account while other members are in your
              club. Head to your club settings to transfer host to someone else,
              or delete the club if it&apos;s no longer active. Come back here
              when you&apos;re done.
            </p>
          </div>

          <div style={{ textAlign: "center" }}>
            <button
              onClick={onClose}
              style={{
                backgroundColor: "#FFFFFF",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: 300,
                color: "#808080",
                padding: "4px 12px",
                textDecoration: "underline",
              }}
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Warning box */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "2px solid #DC2626",
              padding: "16px",
              marginBottom: "24px",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#DC2626",
                margin: "0 0 4px",
                lineHeight: 1.6,
              }}
            >
              Your account and all your data will be permanently deleted.
            </p>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#808080",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              This cannot be undone.
            </p>
          </div>

          {/* Confirm input */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              marginBottom: "24px",
            }}
          >
            <label
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: 300,
                color: "#000000",
              }}
            >
              Type <strong>DELETE</strong> to confirm
            </label>
            <TextInput
              autoFocus
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleDelete()}
              placeholder="DELETE"
              autoComplete="off"
              style={isConfirmed ? { borderColor: "#DC2626" } : undefined} // override border to red when confirmed — TextInput's focus/blur handlers update it imperatively
            />
          </div>

          {error && (
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: 300,
                color: "#DC2626",
                margin: "0 0 16px",
              }}
            >
              {error}
            </p>
          )}

          <DestructiveButton
            size="lg"
            onClick={handleDelete}
            disabled={buttonDisabled}
            style={{ width: "100%", marginBottom: "16px" }}
          >
            {isDeleting ? "Deleting..." : "Delete my account"}
          </DestructiveButton>

          <div style={{ textAlign: "center" }}>
            <button
              onClick={onClose}
              style={{
                backgroundColor: "#FFFFFF",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: 300,
                color: "#808080",
                padding: "4px 12px",
                textDecoration: "underline",
              }}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
