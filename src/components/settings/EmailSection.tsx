"use client";

import { useEffect, useState } from "react";

function OnOffToggle({
  enabled,
  onChange,
  disabled,
}: {
  enabled: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        border: "2px solid #000000",
        overflow: "hidden",
        flexShrink: 0,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <button
        onClick={() => !disabled && onChange(true)}
        disabled={disabled}
        style={{
          padding: "6px 16px",
          border: "none",
          cursor: disabled ? "default" : "pointer",
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
        onClick={() => !disabled && onChange(false)}
        disabled={disabled}
        style={{
          padding: "6px 16px",
          border: "none",
          borderLeft: "2px solid #000000",
          cursor: disabled ? "default" : "pointer",
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/users/me/email-preferences")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.emailNotifications === "boolean") {
          setAppNotifications(data.emailNotifications);
        }
        if (typeof data.emailMarketing === "boolean") {
          setMarketing(data.emailMarketing);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleChange(
    field: "emailNotifications" | "emailMarketing",
    val: boolean
  ) {
    if (field === "emailNotifications") setAppNotifications(val);
    else setMarketing(val);

    setSaving(true);
    try {
      await fetch("/api/users/me/email-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: val }),
      });
    } catch {
      // revert on failure
      if (field === "emailNotifications") setAppNotifications(!val);
      else setMarketing(!val);
    } finally {
      setSaving(false);
    }
  }

  const rows = [
    {
      label: "App notifications",
      description:
        "Club activity — new riffs, reveals, comments on your writing.",
      value: appNotifications,
      field: "emailNotifications" as const,
    },
    {
      label: "Marketing & updates",
      description:
        "Occasional product news and announcements from the Riff team.",
      value: marketing,
      field: "emailMarketing" as const,
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
              <OnOffToggle
                enabled={row.value}
                onChange={(val) => handleChange(row.field, val)}
                disabled={loading || saving}
              />
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
