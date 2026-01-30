"use client";

import { InputHTMLAttributes } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export default function TextInput({ error, ...props }: TextInputProps) {
  return (
    <div
      style={{
        width: "100%",
      }}
    >
      <input
        {...props}
        style={{
          width: "100%",
          height: "auto",
          backgroundColor: "#FFFFFF",
          border: error ? "2px solid #FF0000" : "2px solid #000000",
          padding: "12px",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "16px",
          fontWeight: 300,
          lineHeight: "normal",
          color: error ? "#FF0000" : "#000000",
          outline: "none",
          transition: "border-color 0.2s",
          boxSizing: "border-box",
          ...props.style,
        }}
        onFocus={(e) => {
          if (!error) {
            e.target.style.borderColor = "#00FF66";
          }
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          if (!error) {
            e.target.style.borderColor = "#000000";
          }
          props.onBlur?.(e);
        }}
      />
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
        input::placeholder {
          color: #9c9c9c;
        }
      `}</style>
    </div>
  );
}
