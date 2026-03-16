"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Modal from "@/components/shared/Modal";

export default function DataSection() {
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/users/me/export");
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "riff-export.json";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // silent
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== "DELETE") return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/users/me", { method: "DELETE" });
      if (res.ok) {
        signOut({ callbackUrl: "/" });
      }
    } catch {
      // silent
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section>
      <h2
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "20px",
          fontWeight: 300,
          color: "#000000",
          margin: "0 0 24px 0",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Your Data
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
                fontSize: "14px",
                fontWeight: 300,
                color: "#808080",
                margin: 0,
              }}
            >
              Download all your pieces as a JSON file
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #000000",
              padding: "8px 24px",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: "#000000",
              cursor: isExporting ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {isExporting ? "Exporting..." : "Export"}
          </button>
        </div>

        {/* Divider */}
        <hr style={{ border: "none", borderTop: "1px solid #E6E6E6", margin: "8px 0" }} />

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
                fontSize: "14px",
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
              border: "1px solid #FF4444",
              padding: "8px 24px",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: "#FF4444",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteConfirm("");
        }}
        title="Delete your account?"
        size="sm"
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#000000",
            margin: "0 0 16px 0",
            lineHeight: 1.5,
          }}
        >
          This will permanently delete your account, all your pieces, and all
          your data. This cannot be undone.
        </p>

        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#808080",
            margin: "0 0 12px 0",
          }}
        >
          Type <strong>DELETE</strong> to confirm:
        </p>

        <input
          type="text"
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#000000",
            border: "2px solid #000000",
            padding: "12px 16px",
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
            marginBottom: "16px",
          }}
        />

        <button
          onClick={handleDelete}
          disabled={deleteConfirm !== "DELETE" || isDeleting}
          style={{
            backgroundColor:
              deleteConfirm !== "DELETE" || isDeleting ? "#E6E6E6" : "#FF4444",
            border: "2px solid #000000",
            padding: "12px 48px",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: deleteConfirm !== "DELETE" || isDeleting ? "#000000" : "#FFFFFF",
            cursor:
              deleteConfirm !== "DELETE" || isDeleting ? "not-allowed" : "pointer",
            transition: "none",
            width: "100%",
          }}
        >
          {isDeleting ? "Deleting..." : "Delete my account"}
        </button>
      </Modal>
    </section>
  );
}
