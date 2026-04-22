"use client";

import Modal from "@/components/shared/Modal";

interface MyStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: {
    pieceCount: number;
    totalWordCount: number;
  };
}

export default function MyStatsModal({
  isOpen,
  onClose,
  stats,
}: MyStatsModalProps) {
  const statItems = [
    { value: stats.pieceCount.toLocaleString(), label: "pieces written" },
    { value: stats.totalWordCount.toLocaleString(), label: "words written" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" title="My stats">
      <div style={{ display: "flex", gap: "12px" }}>
        {statItems.map((item) => (
          <div
            key={item.label}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              backgroundColor: "#FFFFFF",
              border: "2px solid #000000",
              padding: "16px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-dm-serif-text)",
                fontSize: "32px",
                fontWeight: 400,
                color: "#000000",
                lineHeight: 1,
              }}
            >
              {item.value}
            </span>
            <span
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: 300,
                color: "#808080",
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </Modal>
  );
}
