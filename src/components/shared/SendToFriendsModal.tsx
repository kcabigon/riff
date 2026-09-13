"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/shared/Modal";
import Avatar from "@/components/shared/Avatar";
import PrimaryButton from "@/components/PrimaryButton";

interface SendCandidate {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  alreadyNotified: boolean;
}

interface SendToFriendsModalProps {
  pieceId: string;
  onClose: () => void;
  onBack?: () => void;
}

// Email specific existing friends about a piece they already have
// Friends-tier access to — no access change, just a heads-up. Friends
// already made aware of this piece via the riff it was submitted through
// (they read it, or belong to the club/riff that got the automatic
// submission email) start unchecked (computed server-side, see
// /api/pieces/[id]/send-candidates).
export default function SendToFriendsModal({
  pieceId,
  onClose,
  onBack,
}: SendToFriendsModalProps) {
  const [candidates, setCandidates] = useState<SendCandidate[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentCount, setSentCount] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/pieces/${pieceId}/send-candidates`)
      .then((res) => res.json())
      .then((data) => {
        const list: SendCandidate[] = data.candidates ?? [];
        setCandidates(list);
        setSelectedIds(
          new Set(list.filter((c) => !c.alreadyNotified).map((c) => c.id))
        );
      })
      .catch(() => setError("Couldn't load your friends."));
  }, [pieceId]);

  const toggleFriend = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Pre-checked friends lead the list; friends already made aware of this
  // piece trail below a plain divider — no label needed, the grouping (and
  // checkbox state) speaks for itself. For a piece with no riff, every
  // friend lands in preChecked and preUnchecked stays empty, so no divider
  // renders at all.
  const preChecked = (candidates ?? []).filter((c) => !c.alreadyNotified);
  const preUnchecked = (candidates ?? []).filter((c) => c.alreadyNotified);

  const renderFriendRow = (friend: SendCandidate) => (
    <button
      key={friend.id}
      onClick={() => toggleFriend(friend.id)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        width: "100%",
        border: "none",
        background: "none",
        padding: "8px",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div
        style={{
          width: "16px",
          height: "16px",
          border: "2px solid #000000",
          backgroundColor: selectedIds.has(friend.id) ? "#00FF66" : "#FFFFFF",
          flexShrink: 0,
        }}
      />
      <Avatar user={friend} size={32} />
      <span
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "16px",
          fontWeight: 300,
          color: "#000000",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {friend.name || friend.username || "Friend"}
      </span>
    </button>
  );

  const handleSend = async () => {
    if (sending || selectedIds.size === 0) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/pieces/${pieceId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendIds: [...selectedIds] }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to send.");
        return;
      }
      setSentCount(data.sentCount ?? selectedIds.size);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Send to friends" size="sm">
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {candidates === null && !error && (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {["70%", "55%"].map((width) => (
              <div
                key={width}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "8px 4px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "64px",
                    backgroundColor: "#E6E6E6",
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{ width, height: "16px", backgroundColor: "#E6E6E6" }}
                />
              </div>
            ))}
          </div>
        )}

        {error && <p style={errorTextStyle}>{error}</p>}

        {candidates && candidates.length === 0 && !error && (
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#000000",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            No friends yet — invite someone first.
          </p>
        )}

        {candidates && candidates.length > 0 && (
          <>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#000000",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              They already have access — this just sends a heads-up email with a
              link.
            </p>

            <div
              style={{
                border: "2px solid #000000",
                backgroundColor: "#FFFFFF",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  maxHeight: "300px",
                  overflowY: "auto",
                  padding: "4px",
                }}
              >
                {preChecked.map((friend) => renderFriendRow(friend))}
                {preChecked.length > 0 && preUnchecked.length > 0 && (
                  <div
                    style={{ borderTop: "1px solid #E6E6E6", margin: "4px" }}
                  />
                )}
                {preUnchecked.map((friend) => renderFriendRow(friend))}
              </div>
            </div>

            {sentCount !== null && (
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  fontWeight: 300,
                  color: "#000000",
                  margin: 0,
                }}
              >
                Sent to {sentCount} friend{sentCount === 1 ? "" : "s"}.
              </p>
            )}

            <PrimaryButton
              onClick={handleSend}
              disabled={selectedIds.size === 0}
              loading={sending}
            >
              {`Send${selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}`}
            </PrimaryButton>
          </>
        )}

        {onBack && (
          <div style={{ textAlign: "center" }}>
            <button
              onClick={onBack}
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
              Back
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

const errorTextStyle: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans)",
  fontSize: "12px",
  fontWeight: 300,
  color: "#DC2626",
  margin: 0,
};
