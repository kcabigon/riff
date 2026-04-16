"use client";

import { useState } from "react";
import Modal from "@/components/shared/Modal";
import Avatar from "@/components/shared/Avatar";
import TextInput from "@/components/TextInput";
import PrimaryButton from "@/components/PrimaryButton";

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

const cancelButtonStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontFamily: "var(--font-dm-sans)",
  fontSize: "14px",
  fontWeight: 300,
  color: "#808080",
  padding: "4px",
  textDecoration: "underline",
};

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
            <div style={{ display: "flex" }}>
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
                color: "#DC2626",
                margin: 0,
              }}
            >
              {error}
            </p>
          )}

          {/* Footer */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <PrimaryButton
              onClick={handleSend}
              loading={sending}
              style={{ width: "100%" }}
            >
              Send
            </PrimaryButton>
            <button
              onClick={() => setStep("compose")}
              disabled={sending}
              style={cancelButtonStyle}
            >
              Back
            </button>
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
              alignItems: "baseline",
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
                color: subject.length >= SUBJECT_LIMIT ? "#DC2626" : "#808080",
              }}
            >
              {subject.length}/{SUBJECT_LIMIT}
            </span>
          </div>
          <TextInput
            value={subject}
            onChange={(e) =>
              setSubject(
                (e as React.ChangeEvent<HTMLInputElement>).target.value.slice(
                  0,
                  SUBJECT_LIMIT
                )
              )
            }
            placeholder="What's this about?"
          />
        </div>

        {/* Body */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
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
                color: body.length >= BODY_LIMIT ? "#DC2626" : "#808080",
              }}
            >
              {body.length}/{BODY_LIMIT}
            </span>
          </div>
          <TextInput
            multiline
            rows={5}
            value={body}
            onChange={(e) =>
              setBody(
                (
                  e as React.ChangeEvent<HTMLTextAreaElement>
                ).target.value.slice(0, BODY_LIMIT)
              )
            }
            placeholder="Write your message..."
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
              {(["all", "specific"] as AudienceType[]).map((type) => {
                const isActive = audienceType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setAudienceType(type)}
                    style={{
                      padding: "8px 16px",
                      border: isActive
                        ? "2px solid #000000"
                        : "2px solid #E6E6E6",
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "13px",
                      fontWeight: isActive ? 500 : 300,
                      color: "#000000",
                      backgroundColor: isActive ? "#00FF66" : "#FFFFFF",
                      cursor: "pointer",
                      boxShadow: isActive ? "4px 4px 0px 0px #000000" : "none",
                    }}
                  >
                    {type === "all" ? "Entire club" : "Specific members"}
                  </button>
                );
              })}
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
                      borderBottom: "1px solid #E6E6E6",
                      backgroundColor: isSelected ? "#F5F5F5" : "#FFFFFF",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <Avatar user={member} size={32} showBorder={false} />
                    <span
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "14px",
                        fontWeight: isSelected ? 500 : 300,
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <PrimaryButton
            onClick={() => setStep("confirm")}
            disabled={!canReview}
            style={{ width: "100%" }}
          >
            Review &amp; Send
          </PrimaryButton>
          <button onClick={handleClose} style={cancelButtonStyle}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
