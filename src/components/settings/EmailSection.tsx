"use client";

import { useState } from "react";

function OnOffToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        border: "2px solid #000000",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <button
        onClick={() => onChange(true)}
        style={{
          padding: "6px 16px",
          border: "none",
          cursor: "pointer",
          backgroundColor: enabled ? "#000000" : "#FFFFFF",
          color: enabled ? "#FFFFFF" : "#000000",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "14px",
          fontWeight: 400,
          transition: "background-color 0.15s ease, color 0.15s ease",
        }}
      >
        On
      </button>
      <button
        onClick={() => onChange(false)}
        style={{
          padding: "6px 16px",
          border: "none",
          borderLeft: "2px solid #000000",
          cursor: "pointer",
          backgroundColor: !enabled ? "#000000" : "#FFFFFF",
          color: !enabled ? "#FFFFFF" : "#000000",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "14px",
          fontWeight: 400,
          transition: "background-color 0.15s ease, color 0.15s ease",
        }}
      >
        Off
      </button>
    </div>
  );
}

export default function EmailSection() {
  const [appNotifications, setAppNotifications] = useState(true);
  const [marketing, setMarketing] = useState(true);

  const rows = [
    {
      label: "App notifications",
      description:
        "Riff activity — new riffs, reveals, comments on your writing.",
      value: appNotifications,
      onChange: setAppNotifications,
    },
    {
      label: "Marketing & updates",
      description:
        "Occasional product news and announcements from the Riff team.",
      value: marketing,
      onChange: setMarketing,
    },
  ];

  return (
    <section>
      <h1
        style={{
          fontFamily: "var(--font-dm-serif-text)",
          fontSize: "32px",
          fontWeight: 400,
          color: "#000000",
          margin: "0 0 24px 0",
        }}
      >
        Your emails
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {rows.map((row, i) => (
          <div key={row.label}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "16px",
                    fontWeight: 300,
                    color: "#000000",
                    margin: 0,
                  }}
                >
                  {row.label}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "12px",
                    fontWeight: 300,
                    color: "#808080",
                    margin: 0,
                  }}
                >
                  {row.description}
                </p>
              </div>
              <OnOffToggle enabled={row.value} onChange={row.onChange} />
            </div>

            {i < rows.length - 1 && (
              <hr
                style={{
                  border: "none",
                  borderTop: "1px solid #E6E6E6",
                  margin: "16px 0 0 0",
                }}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
