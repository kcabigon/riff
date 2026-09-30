"use client";

import Modal from "@/components/shared/Modal";
import AvatarStack from "@/components/shared/AvatarStack";
import PrimaryButton from "@/components/PrimaryButton";
import { formatDateLong, type RevealRosterUser } from "@/lib/riff-utils";

interface RevealConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isRevealing: boolean;
  deadline: string | Date | null;
  submitted: RevealRosterUser[];
  writing: RevealRosterUser[];
  notStarted: RevealRosterUser[];
}

const TEXT_STYLE = {
  fontFamily: "var(--font-dm-sans)",
  fontSize: "16px",
  fontWeight: 300,
  color: "#000000",
  margin: 0,
  lineHeight: 1.6,
} as const;

const DAY_MS = 1000 * 60 * 60 * 24;

// "The deadline is October 12, 12 days away." / "…is today." / "…was October 12."
function deadlineLine(deadline: string | Date): string {
  const date = formatDateLong(deadline);
  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const startOfDeadline = new Date(deadline).setHours(0, 0, 0, 0);
  const days = Math.round((startOfDeadline - startOfToday) / DAY_MS);
  if (days < 0) return `The deadline was ${date}.`;
  if (days === 0) return "The deadline is today.";
  return `The deadline is ${date}, ${days} ${days === 1 ? "day" : "days"} away.`;
}

// "Chris hasn't…" / "Chris and Derek haven't…" / "5 members haven't…"
function leftOutLine(users: RevealRosterUser[]): string {
  const names = users.map((u) => u.name || "Unknown");
  if (names.length > 3) {
    return `${names.length} members haven't submitted, so their pieces won't be in the reveal.`;
  }
  const list = new Intl.ListFormat("en", {
    style: "long",
    type: "conjunction",
  }).format(names);
  return names.length === 1
    ? `${list} hasn't submitted, so their piece won't be in the reveal.`
    : `${list} haven't submitted, so their pieces won't be in the reveal.`;
}

function Group({ label, users }: { label: string; users: RevealRosterUser[] }) {
  if (users.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <p
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "12px",
          fontWeight: 300,
          color: "#808080",
          margin: 0,
        }}
      >
        {label}
      </p>
      <AvatarStack
        users={users.map((u) => ({ ...u, username: null }))}
        size={32}
      />
    </div>
  );
}

export default function RevealConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isRevealing,
  deadline,
  submitted,
  writing,
  notStarted,
}: RevealConfirmModalProps) {
  const leftOut = [...writing, ...notStarted];
  const pieceCount = submitted.length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reveal pieces?" size="sm">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {deadline && <p style={TEXT_STYLE}>{deadlineLine(deadline)}</p>}

        <Group label="Submitted" users={submitted} />
        <Group label="Still writing" users={writing} />
        <Group label="Haven't started" users={notStarted} />

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <p style={TEXT_STYLE}>
            Once revealed, everyone can read and comment.
          </p>
          {leftOut.length > 0 && (
            <p style={{ ...TEXT_STYLE, color: "#DC2626" }}>
              {leftOutLine(leftOut)}
            </p>
          )}
        </div>

        <PrimaryButton onClick={onConfirm} loading={isRevealing}>
          {isRevealing
            ? "Revealing..."
            : `Reveal ${pieceCount} ${pieceCount === 1 ? "piece" : "pieces"}`}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
