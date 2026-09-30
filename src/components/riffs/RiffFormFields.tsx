"use client";

import Tagline from "@/components/Tagline";

interface RiffFormFieldsProps {
  title: string;
  setTitle: (v: string) => void;
  prompt: string;
  setPrompt: (v: string) => void;
  deadline: string;
  setDeadline: (v: string) => void;
  titleRequired?: boolean;
}

const inputStyle: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans)",
  fontSize: "16px",
  fontWeight: 300,
  color: "#000000",
  backgroundColor: "#FFFFFF",
  border: "2px solid #000000",
  padding: "12px 16px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const onFocusGreen = (
  e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
) => {
  e.target.style.borderColor = "#00FF66";
};

const onBlurBlack = (
  e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
) => {
  e.target.style.borderColor = "#000000";
};

const optionalSpan = (
  <span
    style={{
      display: "inline-block",
      backgroundColor: "#FFFFFF",
      padding: "2px 8px",
      fontFamily: "var(--font-dm-sans)",
      fontSize: "12px",
      fontWeight: 300,
      color: "#9C9C9C",
    }}
  >
    (optional)
  </span>
);

export default function RiffFormFields({
  title,
  setTitle,
  prompt,
  setPrompt,
  deadline,
  setDeadline,
  titleRequired = false,
}: RiffFormFieldsProps) {
  const daysUntilDeadline = deadline
    ? Math.round(
        (new Date(deadline).getTime() - new Date().setHours(0, 0, 0, 0)) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <>
      {/* Deadline */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Tagline
            text="Deadline"
            color="#01EFFC"
            textColor="#000000"
            fontSize={16}
            width="fit"
            align="left"
          />
        </div>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          // Every riff needs a deadline — clubless and club alike, at creation
          // and on edit. Not a prop: there is no caller that wants otherwise.
          required
          style={{
            ...inputStyle,
            display: "block",
            WebkitAppearance: "none",
            appearance: "none",
          }}
          onFocus={onFocusGreen}
          onBlur={onBlurBlack}
        />
        {daysUntilDeadline !== null && (
          <span
            style={{
              display: "inline-block",
              backgroundColor: "#FFFFFF",
              padding: "2px 8px",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: "#9C9C9C",
              alignSelf: "flex-start",
            }}
          >
            {daysUntilDeadline} days from today, flexible later
          </span>
        )}
      </div>

      {/* Riff name */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Tagline
            text="Riff name"
            color="#00FF66"
            textColor="#000000"
            fontSize={16}
            width="fit"
            align="left"
          />
          {!titleRequired && optionalSpan}
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Summer Stories"
          required={titleRequired}
          style={inputStyle}
          onFocus={onFocusGreen}
          onBlur={onBlurBlack}
        />
      </div>

      {/* Prompt */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Tagline
            text="Prompt"
            color="#EECF01"
            textColor="#000000"
            fontSize={16}
            width="fit"
            align="left"
          />
          {optionalSpan}
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Let's write about..."
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
          onFocus={onFocusGreen}
          onBlur={onBlurBlack}
        />
      </div>

      {/* Scoped rather than global, matching how TextInput handles ::placeholder
          — a pseudo-element is the one thing inline styles can't reach, and the
          rule belongs next to the field it applies to.

          The browser's own clear control invites emptying a field that is always
          required, and on a club riff an empty deadline stalls the cadence sweep.
          The calendar picker indicator is deliberately untouched; that's how the
          field is meant to be used.

          Cosmetic only: the value can still be cleared by selecting its text, so
          the real guards stay the form check and the API's rejection of a null
          deadline. This just stops offering it. */}
      <style jsx>{`
        input[type="date"]::-webkit-clear-button,
        input[type="date"]::-ms-clear {
          display: none;
        }
      `}</style>
    </>
  );
}
