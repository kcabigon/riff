"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/shared/Modal";
import PrimaryButton from "@/components/PrimaryButton";

interface AssignCoHostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  clubId: string;
  currentCoHost: { id: string; name: string | null } | null;
  members: { id: string; name: string | null }[];
}

export default function AssignCoHostModal({
  isOpen,
  onClose,
  onUpdated,
  clubId,
  currentCoHost,
  members,
}: AssignCoHostModalProps) {
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [isReassigning, setIsReassigning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedMemberId("");
      setIsReassigning(false);
      setIsSaving(false);
      setIsRemoving(false);
      setError(null);
    }
  }, [isOpen]);

  const handleAssign = async (targetUserId: string) => {
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/clubs/${clubId}/assign-cohost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to assign co-host");
        setIsSaving(false);
        return;
      }

      onClose();
      onUpdated();
    } catch {
      setError("Something went wrong. Please try again.");
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    setError(null);

    try {
      const res = await fetch(`/api/clubs/${clubId}/assign-cohost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: null }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to remove co-host");
        setIsRemoving(false);
        return;
      }

      onClose();
      onUpdated();
    } catch {
      setError("Something went wrong. Please try again.");
      setIsRemoving(false);
    }
  };

  const showPicker = !currentCoHost || isReassigning;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign co-host" size="sm">
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Info box */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "2px solid #000000",
            padding: "16px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#000000",
              margin: "0 0 4px",
              lineHeight: 1.6,
            }}
          >
            Host with a friend. Your co-host can start and reveal riffs, and
            edit club details.
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
            You stay in control — they can&apos;t transfer admin privileges or
            delete the club. You can remove them anytime.
          </p>
        </div>

        {/* Current co-host display */}
        {currentCoHost && !isReassigning && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              border: "2px solid #000000",
              backgroundColor: "#FFFFFF",
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "12px",
                  fontWeight: 300,
                  color: "#808080",
                  margin: "0 0 2px",
                }}
              >
                Current co-host
              </p>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  fontWeight: 400,
                  color: "#000000",
                  margin: 0,
                }}
              >
                {currentCoHost.name || "Unknown"}
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setIsReassigning(true)}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "2px solid #000000",
                  boxShadow: "4px 4px 0px 0px #000000",
                  cursor: "pointer",
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "12px",
                  fontWeight: 300,
                  color: "#000000",
                  padding: "4px 12px",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "4px 4px 0px 0px #01EFFC";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "4px 4px 0px 0px #000000";
                }}
              >
                Re-assign
              </button>
              <button
                onClick={handleRemove}
                disabled={isRemoving}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: isRemoving
                    ? "2px solid #9C9C9C"
                    : "2px solid #000000",
                  cursor: isRemoving ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "12px",
                  fontWeight: 300,
                  color: isRemoving ? "#9C9C9C" : "#000000",
                  padding: "4px 12px",
                  whiteSpace: "nowrap",
                }}
              >
                {isRemoving ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        )}

        {/* Member picker */}
        {showPicker && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <select
              value={selectedMemberId}
              onChange={(e) => {
                setSelectedMemberId(e.target.value);
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

            {selectedMemberId && (
              <PrimaryButton
                type="button"
                loading={isSaving}
                onClick={() => handleAssign(selectedMemberId)}
                style={{ width: "100%" }}
              >
                {isSaving
                  ? "Saving..."
                  : currentCoHost
                    ? "Re-assign co-host"
                    : "Assign co-host"}
              </PrimaryButton>
            )}
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
      </div>
    </Modal>
  );
}
