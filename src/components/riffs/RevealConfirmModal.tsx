"use client";

import Modal from "@/components/shared/Modal";
import AvatarStack from "@/components/shared/AvatarStack";
import PrimaryButton from "@/components/PrimaryButton";
import type { RevealRosterUser } from "@/lib/riff-utils";

interface RevealConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isRevealing: boolean;
  submitted: RevealRosterUser[];
  writing: RevealRosterUser[];
  notStarted: RevealRosterUser[];
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
  submitted,
  writing,
  notStarted,
}: RevealConfirmModalProps) {
  const pieceCount = submitted.length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reveal pieces?" size="sm">
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <Group label="Submitted" users={submitted} />
        <Group label="Still writing" users={writing} />
        <Group label="Haven't started" users={notStarted} />

        <PrimaryButton onClick={onConfirm} loading={isRevealing}>
          {isRevealing
            ? "Revealing..."
            : `Reveal ${pieceCount} ${pieceCount === 1 ? "piece" : "pieces"}`}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
