"use client";

import Image from "next/image";

interface TemplatePickerProps {
  /** 0 = Custom (blank), 1..N = template slot. */
  activeIndex: number;
  count: number;
  onNext: () => void;
}

// Visual pattern ported from the create-riff-modal template picker: a
// static "Templates" label on Custom, swapping to a dot indicator once
// browsing has started; the arrow always advances (wraps back to Custom).
export default function TemplatePicker({
  activeIndex,
  count,
  onNext,
}: TemplatePickerProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      {activeIndex === 0 ? (
        <span
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#000000",
          }}
        >
          Templates
        </span>
      ) : (
        <div style={{ display: "flex", gap: "6px" }}>
          {Array.from({ length: count }).map((_, index) => (
            <div
              // eslint-disable-next-line react/no-array-index-key -- static list; length and order are stable
              key={index}
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor:
                  index === activeIndex - 1 ? "#808080" : "#E6E6E6",
              }}
            />
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={onNext}
        aria-label="Try another riff idea"
        style={{
          width: "20px",
          height: "20px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Image
          src="/icons/back_arrow.svg"
          alt=""
          width={20}
          height={20}
          style={{ display: "block", transform: "scaleX(-1)" }}
        />
      </button>
    </div>
  );
}
