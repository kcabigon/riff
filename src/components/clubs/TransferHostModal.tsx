"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/shared/Modal";
import CTAButton from "@/components/CTAButton";

interface TransferHostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransferred: () => void;
  clubId: string;
  members: { id: string; name: string | null }[];
}

export default function TransferHostModal({
  isOpen,
  onClose,
  onTransferred,
  clubId,
  members,
}: TransferHostModalProps) {
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedMemberId("");
      setShowConfirm(false);
      setIsTransferring(false);
      setError(null);
    }
  }, [isOpen]);

  const handleTransfer = async () => {
    if (!selectedMemberId) return;
    setIsTransferring(true);
    setError(null);

    try {
      const res = await fetch(`/api/clubs/${clubId}/transfer-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: selectedMemberId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to transfer host");
        setIsTransferring(false);
        return;
      }

      onClose();
      onTransferred();
    } catch {
      setError("Something went wrong. Please try again.");
      setIsTransferring(false);
    }
  };

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transfer host" size="sm">
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
          You&apos;re handing over the keys to a new club host. Only they can
          start riffs, reveal pieces, and edit/delete the club.
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
          This can&apos;t be undone without the new host&apos;s help.
          You&apos;ll remain as a club member.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <select
          value={selectedMemberId}
          onChange={(e) => {
            setSelectedMemberId(e.target.value);
            setShowConfirm(false);
            setError(null);
          }}
          style={{
            width: "100%",
            padding: "10px 12px",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: selectedMemberId ? "#000000" : "#9C9C9C",
            backgroundColor: "#FFFFFF",
            border: "2px solid #000000",
            borderRadius: 0,
            appearance: "none",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="">Choose a member...</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name || "Unknown"}
            </option>
          ))}
        </select>

        {selectedMemberId && !showConfirm && (
          <CTAButton
            type="button"
            onClick={() => setShowConfirm(true)}
            accentColor="#DC2626"
            style={{ width: "100%" }}
          >
            Transfer host
          </CTAButton>
        )}

        {showConfirm && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "13px",
                fontWeight: 300,
                color: "#DC2626",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Transfer host to{" "}
              <strong>{selectedMember?.name || "this member"}</strong>?
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={handleTransfer}
                disabled={isTransferring}
                style={{
                  flex: 1,
                  backgroundColor: isTransferring ? "#E6E6E6" : "#DC2626",
                  border: "2px solid #000000",
                  boxShadow: isTransferring
                    ? "none"
                    : "4px 4px 0px 0px #000000",
                  padding: "10px 16px",
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "14px",
                  fontWeight: 300,
                  color: isTransferring ? "#9C9C9C" : "#FFFFFF",
                  cursor: isTransferring ? "not-allowed" : "pointer",
                }}
              >
                {isTransferring ? "Transferring..." : "Confirm"}
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1,
                  backgroundColor: "#FFFFFF",
                  border: "2px solid #000000",
                  padding: "10px 16px",
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "14px",
                  fontWeight: 300,
                  color: "#000000",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && (
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              fontWeight: 300,
              color: "#DC2626",
              margin: 0,
            }}
          >
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
