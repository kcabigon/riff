"use client";

interface TemplatePickerProps {
  active: boolean;
  onToggle: () => void;
}

// Single toggle — prefills the riff name/prompt with one generic,
// creative-freedom prompt, or clears them back out. Replaces the old
// multi-template cycler: topics put riffs in a box, so there's only one
// option now, not a menu of them.
export default function TemplatePicker({
  active,
  onToggle,
}: TemplatePickerProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        fontFamily: "var(--font-dm-sans)",
        fontSize: "14px",
        fontWeight: 300,
        color: "#000000",
      }}
    >
      {active ? "Clear ✕" : "Quick start 💡"}
    </button>
  );
}
