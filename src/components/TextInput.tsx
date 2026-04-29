"use client";

import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface BaseTextInputProps {
  error?: string;
  multiline?: boolean;
  rows?: number;
}

type TextInputProps = BaseTextInputProps &
  (
    | ({ multiline?: false } & InputHTMLAttributes<HTMLInputElement>)
    | ({ multiline: true } & TextareaHTMLAttributes<HTMLTextAreaElement>)
  );

export default function TextInput({
  error,
  multiline = false,
  rows = 3,
  ...props
}: TextInputProps) {
  const isDisabled = props.disabled;
  const commonStyles = {
    width: "100%",
    backgroundColor: isDisabled ? "#E6E6E6" : "#FFFFFF",
    border: error
      ? "2px solid #FF0000"
      : isDisabled
        ? "2px solid #9C9C9C"
        : "2px solid #000000",
    padding: "12px",
    fontFamily: "var(--font-dm-sans)",
    fontSize: "16px",
    fontWeight: 300,
    lineHeight: multiline ? "1.5" : "normal",
    color: error ? "#FF0000" : isDisabled ? "#9C9C9C" : "#000000",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box" as const,
    cursor: isDisabled ? "not-allowed" : "auto",
  };

  const handleFocus = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!error && !isDisabled) {
      e.target.style.borderColor = "#00FF66";
    }
    if ("onFocus" in props && props.onFocus) {
      props.onFocus(e as any);
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!error && !isDisabled) {
      e.target.style.borderColor = "#000000";
    }
    if ("onBlur" in props && props.onBlur) {
      props.onBlur(e as any);
    }
  };

  return (
    <div
      style={{
        width: "100%",
      }}
    >
      {multiline ? (
        <textarea
          {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          rows={rows}
          style={{
            ...commonStyles,
            height: "auto",
            resize: "vertical" as const,
            minHeight: `${rows * 1.5 + 2}em`,
            ...(props.style || {}),
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      ) : (
        <input
          {...(props as InputHTMLAttributes<HTMLInputElement>)}
          style={{
            ...commonStyles,
            height: "auto",
            ...(props.style || {}),
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      )}
      {error && (
        <p
          style={{
            marginTop: "8px",
            fontSize: "14px",
            fontFamily: "var(--font-dm-sans)",
            fontWeight: 300,
            color: "#FF0000",
            lineHeight: "normal",
          }}
        >
          {error}
        </p>
      )}
      <style jsx>{`
        input::placeholder,
        textarea::placeholder {
          color: #9c9c9c;
        }
      `}</style>
    </div>
  );
}
