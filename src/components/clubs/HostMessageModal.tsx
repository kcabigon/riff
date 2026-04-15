"use client";

import { useState } from "react";
import Modal from "@/components/shared/Modal";
import Avatar from "@/components/shared/Avatar";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";

const SUBJECT_LIMIT = 80;
const BODY_LIMIT = 500;

interface Member {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
}

interface HostMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubId: string;
  clubName: string;
  members: Member[];
  currentUserId: string;
  scope?: "club" | "riff";
}

type Step = "compose" | "confirm";
type AudienceType = "all" | "specific";

export default function HostMessageModal({
  isOpen,
  onClose,
  clubId,
  clubName,
  members,
  currentUserId,
  scope = "club",
}: HostMessageModalProps) {
  const [step, setStep] = useState<Step>("compose");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audienceType, setAudienceType] = useState<AudienceType>("all");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otherMembers = members.filter((m) => m.id !== currentUserId);

  // In riff scope, pre-select everyone and always send as specific
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    scope === "riff" ? new Set(otherMembers.map((m) => m.id)) : new Set()
  );

  const effectiveAudienceType = scope === "riff" ? "specific" : audienceType;

  const recipients =
    effectiveAudienceType === "all"
      ? otherMembers
      : otherMembers.filter((m) => selectedIds.has(m.id));

  const canReview =
    subject.trim().length > 0 &&
    body.trim().length > 0 &&
    recipients.length > 0;

  const handleClose = () => {
    setStep("compose");
    setSubject("");
    setBody("");
    setAudienceType("all");
    setSelectedIds(
      scope === "riff" ? new Set(otherMembers.map((m) => m.id)) : new Set()
    );
    setSending(false);
    setSent(false);
    setError(null);
    onClose();
  };

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSend = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/clubs/${clubId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          body: body.trim(),
          audienceType: effectiveAudienceType,
          recipientIds:
            effectiveAudienceType === "specific"
              ? Array.from(selectedIds)
              : null,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error || "Something went wrong. Please try again.");
        return;
      }

      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} size="md">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
            padding: "8px 0 16px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-dm-serif-text)",
              fontSize: "24px",
              fontWeight: 400,
              color: "#000000",
              margin: 0,
            }}
          >
            Message sent.
          </p>
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "15px",
              fontWeight: 300,
              color: "#808080",
              margin: 0,
            }}
          >
            Your message is on its way to{" "}
            {recipients.length === 1
              ? recipients[0].name || "1 member"
              : `${recipients.length} members`}
            .
          </p>
          <PrimaryButton
            onClick={handleClose}
            style={{ width: "100%", marginTop: "8px" }}
          >
            Done
          </PrimaryButton>
        </div>
      </Modal>
    );
  }

  if (step === "confirm") {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Confirm message"
        size="md"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Recipient summary */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              border: "2px solid #000000",
              backgroundColor: "#FAFAFA",
            }}
          >
            <div style={{ display: "flex", gap: "-8px" }}>
              {recipients.slice(0, 5).map((m, i) => (
                <div
                  key={m.id}
                  style={{ marginLeft: i === 0 ? 0 : "-8px", zIndex: i }}
                >
                  <Avatar
                    user={m}
                    size={32}
                    showBorder
                    borderColor="#FFFFFF"
                    borderWidth={2}
                  />
                </div>
              ))}
            </div>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: 400,
                color: "#000000",
                margin: 0,
              }}
            >
              {recipients.length === 1
                ? `${recipients[0].name || "1 member"}`
                : `${recipients.length} members`}
            </p>
          </div>

          {/* Subject */}
          <div>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "11px",
                fontWeight: 500,
                color: "#808080",
                margin: "0 0 4px 0",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Subject
            </p>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "15px",
                fontWeight: 400,
                color: "#000000",
                margin: 0,
              }}
            >
              {subject}
            </p>
          </div>

          {/* Body */}
          <div
            style={{
              border: "2px solid #000000",
              padding: "16px",
              backgroundColor: "#FFFFFF",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "15px",
                fontWeight: 300,
                color: "#000000",
                margin: 0,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
              }}
            >
              {body}
            </p>
          </div>

          {error && (
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "13px",
                fontWeight: 300,
                color: "#FF3333",
                margin: 0,
              }}
            >
              {error}
            </p>
          )}

          {/* Footer */}
          <div style={{ display: "flex", gap: "12px" }}>
            <SecondaryButton
              onClick={() => setStep("compose")}
              disabled={sending}
              style={{ flex: 1 }}
            >
              Back
            </SecondaryButton>
            <PrimaryButton
              onClick={handleSend}
              loading={sending}
              style={{ flex: 1 }}
            >
              Send
            </PrimaryButton>
          </div>
        </div>
      </Modal>
    );
  }

  // Compose step
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={scope === "riff" ? "Message participants" : `Message ${clubName}`}
      size="md"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Subject */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "6px",
            }}
          >
            <label
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "13px",
                fontWeight: 500,
                color: "#000000",
              }}
            >
              Subject
            </label>
            <span
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: 300,
                color: subject.length >= SUBJECT_LIMIT ? "#FF3333" : "#808080",
              }}
            >
              {subject.length}/{SUBJECT_LIMIT}
            </span>
          </div>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value.slice(0, SUBJECT_LIMIT))}
            placeholder="What's this about?"
            style={{
              width: "100%",
              border: "2px solid #000000",
              padding: "10px 12px",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: "#000000",
              outline: "none",
              boxSizing: "border-box",
              backgroundColor: "#FFFFFF",
            }}
          />
        </div>

        {/* Body */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "6px",
            }}
          >
            <label
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "13px",
                fontWeight: 500,
                color: "#000000",
              }}
            >
              Message
            </label>
            <span
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: 300,
                color: body.length >= BODY_LIMIT ? "#FF3333" : "#808080",
              }}
            >
              {body.length}/{BODY_LIMIT}
            </span>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, BODY_LIMIT))}
            placeholder="Write your message..."
            rows={5}
            style={{
              width: "100%",
              border: "2px solid #000000",
              padding: "10px 12px",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: "#000000",
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
              backgroundColor: "#FFFFFF",
              lineHeight: 1.6,
            }}
          />
        </div>

        {/* Audience toggle — club scope only */}
        {scope === "club" && (
          <div>
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "13px",
                fontWeight: 500,
                color: "#000000",
                margin: "0 0 8px 0",
              }}
            >
              Send to
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              {(["all", "specific"] as AudienceType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setAudienceType(type)}
                  style={{
                    padding: "8px 16px",
                    border: "2px solid #000000",
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "13px",
                    fontWeight: audienceType === type ? 500 : 300,
                    color: "#000000",
                    backgroundColor:
                      audienceType === type ? "#00FF66" : "#FFFFFF",
                    cursor: "pointer",
                    boxShadow:
                      audienceType === type
                        ? "3px 3px 0px 0px #000000"
                        : "none",
                  }}
                >
                  {type === "all" ? "Entire club" : "Specific members"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Member picker — specific (club) or always (riff) */}
        {(scope === "riff" || audienceType === "specific") && (
          <div
            style={{
              border: "2px solid #000000",
              maxHeight: "180px",
              overflowY: "auto",
            }}
          >
            {otherMembers.length === 0 ? (
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "14px",
                  fontWeight: 300,
                  color: "#808080",
                  margin: 0,
                  padding: "16px",
                }}
              >
                {scope === "riff"
                  ? "No participants yet."
                  : "No other members yet."}
              </p>
            ) : (
              otherMembers.map((member) => {
                const isSelected = selectedIds.has(member.id);
                return (
                  <button
                    key={member.id}
                    onClick={() => toggleMember(member.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      width: "100%",
                      padding: "10px 14px",
                      border: "none",
                      borderBottom: "1px solid #F0F0F0",
                      backgroundColor: isSelected ? "#F9FFF9" : "#FFFFFF",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <Avatar user={member} size={32} showBorder={false} />
                    <span
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "14px",
                        fontWeight: isSelected ? 400 : 300,
                        color: "#000000",
                        flex: 1,
                      }}
                    >
                      {member.name || member.username || "Unknown"}
                    </span>
                    {isSelected && (
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: "#00FF66",
                          border: "2px solid #000000",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", gap: "12px" }}>
          <SecondaryButton onClick={handleClose} style={{ flex: 1 }}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            onClick={() => setStep("confirm")}
            disabled={!canReview}
            style={{ flex: 1 }}
          >
            Review
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
