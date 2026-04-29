"use client";

import { useState } from "react";
import DeleteAccountConfirmModal from "@/components/settings/DeleteAccountConfirmModal";

export default function DataSection() {
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/users/me/export");
      if (res.ok) {
        const contentDisposition = res.headers.get("Content-Disposition") ?? "";
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        const filename = filenameMatch?.[1] ?? "riff-export";
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // silent
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section>
      <h2
        style={{
          fontFamily: "var(--font-dm-serif-text)",
          fontSize: "24px",
          fontWeight: 400,
          color: "#000000",
          margin: "0 0 24px 0",
        }}
      >
        Your data
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Export */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
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
              Export your writing
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
              Download all your pieces as .docx files
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            style={{
              backgroundColor: "#FFFFFF",
              border: "2px solid #000000",
              padding: "12px 24px",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#000000",
              cursor: isExporting ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
              opacity: isExporting ? 0.5 : 1,
            }}
          >
            {isExporting ? "Exporting..." : "Export"}
          </button>
        </div>

        {/* Divider */}
        <hr
          style={{
            border: "none",
            borderTop: "1px solid #E6E6E6",
            margin: "8px 0",
          }}
        />

        {/* Delete Account */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
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
              Delete account
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
              Permanently delete your account and all data
            </p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            style={{
              backgroundColor: "#FFFFFF",
              border: "2px solid #DC2626",
              padding: "12px 24px",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#DC2626",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Delete
          </button>
        </div>
      </div>

      <DeleteAccountConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </section>
  );
}
