"use client";

import Tagline from "@/components/Tagline";
import PromptLibrary from "./PromptLibrary";

interface RiffFormFieldsProps {
  title: string;
  setTitle: (v: string) => void;
  prompt: string;
  setPrompt: (v: string) => void;
  deadline: string;
  setDeadline: (v: string) => void;
  deadlineRequired?: boolean;
  showPromptLibrary?: boolean;
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
      fontSize: "14px",
      fontWeight: 300,
      color: "#959595",
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
  deadlineRequired = false,
  showPromptLibrary = false,
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
            width={116}
            align="left"
          />
          {!deadlineRequired && optionalSpan}
        </div>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          required={deadlineRequired}
          style={inputStyle}
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
              color: "#959595",
              alignSelf: "flex-start",
            }}
          >
            {daysUntilDeadline} days from today
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
            width={124}
            align="left"
          />
          {optionalSpan}
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Summer Stories"
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
            width={96}
            align="left"
          />
          {optionalSpan}
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What should club members write about?"
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
          onFocus={onFocusGreen}
          onBlur={onBlurBlack}
        />
      </div>

      {/* Prompt library */}
      {showPromptLibrary && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            style={{
              display: "inline-block",
              backgroundColor: "#FFFFFF",
              padding: "2px 8px",
            }}
          >
            <PromptLibrary onSelect={(text) => setPrompt(text)} />
          </div>
        </div>
      )}
    </>
  );
}
