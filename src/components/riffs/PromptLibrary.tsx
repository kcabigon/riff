"use client";

import { useState } from "react";
import {
  PROMPT_SUGGESTIONS,
  PROMPT_CATEGORIES,
  PromptSuggestion,
} from "@/lib/prompt-suggestions";

interface PromptLibraryProps {
  onSelect: (text: string) => void;
}

export default function PromptLibrary({ onSelect }: PromptLibraryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>(
    PROMPT_CATEGORIES[0]
  );

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "14px",
          fontWeight: 300,
          color: "#808080",
          padding: 0,
          textDecoration: "underline",
        }}
      >
        Need inspiration?
      </button>
    );
  }

  const filtered = PROMPT_SUGGESTIONS.filter(
    (p) => p.category === activeCategory
  );

  return (
    <div
      style={{
        border: "1px solid #E6E6E6",
        padding: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#808080",
            margin: 0,
          }}
        >
          Tap a prompt to use it
        </p>
        <button
          onClick={() => setIsExpanded(false)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "16px",
            color: "#808080",
            padding: "2px",
            lineHeight: 1,
          }}
          aria-label="Close prompt library"
        >
          &times;
        </button>
      </div>

      {/* Category tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "12px",
          flexWrap: "wrap",
        }}
      >
        {PROMPT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              background: activeCategory === cat ? "#000000" : "transparent",
              color: activeCategory === cat ? "#FFFFFF" : "#000000",
              border: "1px solid #000000",
              padding: "4px 12px",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              fontWeight: 300,
              cursor: "pointer",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Prompt list */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          maxHeight: "200px",
          overflowY: "auto",
        }}
      >
        {filtered.map((prompt: PromptSuggestion) => (
          <button
            key={prompt.id}
            onClick={() => onSelect(prompt.text)}
            style={{
              background: "none",
              border: "1px solid #E6E6E6",
              padding: "10px 12px",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: "#000000",
              cursor: "pointer",
              textAlign: "left",
              lineHeight: 1.5,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#00FF66";
              e.currentTarget.style.backgroundColor = "#F9FFF9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#E6E6E6";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            {prompt.text}
          </button>
        ))}
      </div>
    </div>
  );
}
