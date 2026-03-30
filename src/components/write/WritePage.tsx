"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import ResizableImage from "tiptap-extension-resize-image";
import Youtube from "@tiptap/extension-youtube";
import { Spotify } from "@/components/editor/extensions/Spotify";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import "@/app/write/[pieceId]/editor.css";
import NoiseBackground from "@/components/NoiseBackground";
import BackButton from "@/components/BackButton";
import CoverImageModal from "@/components/write/CoverImageModal";
import ShareConfirmModal from "@/components/write/ShareConfirmModal";
import { convertHeicToJpeg } from "@/lib/convert-heic";
import { useIsMobile } from "@/hooks/useMediaQuery";
import DesktopBubbleToolbar from "@/components/write/toolbar/DesktopBubbleToolbar";
import DesktopFloatingInsert from "@/components/write/toolbar/DesktopFloatingInsert";
import MobileBottomToolbar from "@/components/write/toolbar/MobileBottomToolbar";

interface RiffConnection {
  id: string;
  title: string | null;
  prompt: string | null;
  deadline: string | null;
  clubId: string;
  clubName: string;
  submittedAt: string | null;
}

interface WritePageProps {
  piece: {
    id: string;
    title: string;
    currentContent: string;
    coverImage: string | null;
    riffs: RiffConnection[];
  };
}

export default function WritePage({ piece }: WritePageProps) {
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">(
    "saved"
  );
  const [title, setTitle] = useState(piece.title || "Untitled");
  const [coverImage, setCoverImage] = useState<string | null>(piece.coverImage);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const isSubmitted = piece.riffs.some((r) => r.submittedAt !== null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const titleSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const isMobile = useIsMobile();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: "Start typing here...",
      }),
      CharacterCount,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      ResizableImage.configure({ inline: true, allowBase64: true }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        inline: false,
        HTMLAttributes: { class: "youtube-video" },
      }),
      Spotify.configure({
        HTMLAttributes: { style: "border-radius:12px" },
      }),
    ],
    content: piece.currentContent || "",
    editable: true,
    onUpdate: ({ editor }) => {
      setSaveStatus("unsaved");

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        const html = editor.getHTML();
        autosaveContent(html);
      }, 500);
    },
  });

  const autosaveContent = useCallback(
    async (content: string) => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/pieces/${piece.id}/autosave`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentContent: content }),
        });
        if (res.ok) {
          setSaveStatus("saved");
        } else {
          setSaveStatus("unsaved");
        }
      } catch {
        setSaveStatus("unsaved");
      }
    },
    [piece.id]
  );

  const autosaveTitle = useCallback(
    async (newTitle: string) => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/pieces/${piece.id}/autosave`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTitle }),
        });
        if (res.ok) {
          setSaveStatus("saved");
        } else {
          setSaveStatus("unsaved");
        }
      } catch {
        setSaveStatus("unsaved");
      }
    },
    [piece.id]
  );

  const autosaveCoverImage = useCallback(
    async (newCoverImage: string | null) => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/pieces/${piece.id}/autosave`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coverImage: newCoverImage ?? "" }),
        });
        if (res.ok) {
          setSaveStatus("saved");
        } else {
          setSaveStatus("unsaved");
        }
      } catch {
        setSaveStatus("unsaved");
      }
    },
    [piece.id]
  );

  const handleCoverImageSelect = useCallback(
    (url: string) => {
      const value = url || null;
      setCoverImage(value);
      autosaveCoverImage(value);
      setShowCoverModal(false);
    },
    [autosaveCoverImage]
  );

  // Auto-resize textarea
  useEffect(() => {
    const resizeTextarea = () => {
      if (titleRef.current) {
        titleRef.current.style.height = "38px";
        titleRef.current.style.height = titleRef.current.scrollHeight + "px";
      }
    };
    requestAnimationFrame(resizeTextarea);
    window.addEventListener("resize", resizeTextarea);
    return () => window.removeEventListener("resize", resizeTextarea);
  }, [title]);

  // Debounced title autosave
  useEffect(() => {
    if (titleSaveTimerRef.current) {
      clearTimeout(titleSaveTimerRef.current);
    }
    titleSaveTimerRef.current = setTimeout(() => {
      autosaveTitle(title);
    }, 2000);
    return () => {
      if (titleSaveTimerRef.current) {
        clearTimeout(titleSaveTimerRef.current);
      }
    };
  }, [title, autosaveTitle]);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    let file = event.target.files?.[0];
    if (!file || !editor) return;

    // Convert HEIC/HEIF to JPEG client-side before uploading
    file = await convertHeicToJpeg(file);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.url) {
        alert("Failed to upload image: " + (data.error || "Unknown error"));
        return;
      }
      editor.chain().focus().setImage({ src: data.url }).run();
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleBack = () => {
    if (piece.riffs.length > 0) {
      router.push(`/clubs/${piece.riffs[0].clubId}`);
    } else {
      router.back();
    }
  };

  if (!editor) {
    return null;
  }

  const wordCount = editor.storage.characterCount.words();
  const readLengthMin = Math.max(1, Math.round(wordCount / 200));

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
      }}
    >
      <NoiseBackground fillMode="cover" />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        onChange={handleImageUpload}
        style={{ display: "none" }}
      />

      {/* Content area */}
      <div
        style={{
          width: "100%",
          maxWidth: "1000px",
          padding: "32px 24px 0",
          boxSizing: "border-box",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Back frame: back arrow + save status */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: "53px",
            marginBottom: "16px",
          }}
        >
          {/* Back arrow */}
          <BackButton onClick={handleBack} />

          {/* Save status */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background:
                  saveStatus === "saved"
                    ? "#22c55e"
                    : saveStatus === "saving"
                      ? "#eab308"
                      : "#9ca3af",
                animation:
                  saveStatus === "saving"
                    ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                    : "none",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 400,
                color: "#000000",
              }}
            >
              {saveStatus === "saved"
                ? "Saved"
                : saveStatus === "saving"
                  ? "Saving..."
                  : "Unsaved"}
            </span>
          </div>
        </div>

        {/* Cover image + Share CTAs */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <button
            onClick={() => setShowCoverModal(true)}
            style={{
              background: "#FFFFFF",
              border: "1px dashed #000000",
              borderRadius: "0",
              padding: "4px 12px",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              fontWeight: 300,
              color: "#000000",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {coverImage ? (
              <>
                <img
                  src={coverImage}
                  alt=""
                  style={{
                    width: "24px",
                    height: "16px",
                    objectFit: "cover",
                    borderRadius: "2px",
                  }}
                />
                Change cover
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M6 1V11M1 6H11"
                    stroke="#000000"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                </svg>
                Cover image
              </>
            )}
          </button>
          {piece.riffs.length > 0 && (
            <button
              onClick={isSubmitted ? undefined : () => setShowShareModal(true)}
              style={{
                background: isSubmitted ? "#00FF66" : "#FFFFFF",
                border: isSubmitted
                  ? "1px solid #000000"
                  : "1px dashed #000000",
                borderRadius: "0",
                padding: "4px 12px",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: 300,
                color: "#000000",
                cursor: isSubmitted ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {isSubmitted ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6L5 9L10 3"
                      stroke="#000000"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Shared
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M6 1V11M1 6H11"
                      stroke="#000000"
                      strokeWidth="1"
                      strokeLinecap="round"
                    />
                  </svg>
                  Share
                </>
              )}
            </button>
          )}
        </div>

        {/* Riff pills */}
        {piece.riffs.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "16px",
              flexWrap: "wrap",
            }}
          >
            {piece.riffs.map((riff) => (
              <span
                key={riff.id}
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "12px",
                  fontWeight: 400,
                  color: "#000000",
                  border: "1px solid #00FF66",
                  borderRadius: "2px",
                  padding: "4px 12px",
                }}
              >
                {riff.title || "Active Riff"}
              </span>
            ))}
          </div>
        )}

        {/* Black canvas */}
        <div
          style={{
            background: "#000000",
            border: "2px solid #FFFFFF",
            boxShadow: "12px 12px 0px 0px #000000",
            display: "flex",
            flexDirection: "column",
            minHeight: "calc(100vh - 220px)",
            marginBottom: "32px",
          }}
        >
          {/* Canvas content area */}
          <div
            style={{
              flex: 1,
              padding: "56px 32px 32px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Title */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                marginBottom: "32px",
              }}
            >
              <textarea
                ref={titleRef}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setSaveStatus("unsaved");
                }}
                placeholder="Untitled piece"
                style={{
                  fontFamily: "var(--font-playfair), serif",
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#ffffff",
                  margin: 0,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  textAlign: "center",
                  width: "100%",
                  padding: 0,
                  resize: "none",
                  overflow: "hidden",
                  lineHeight: "1.2",
                  minHeight: "38px",
                  height: "38px",
                  overflowWrap: "break-word",
                  wordBreak: "break-word",
                  whiteSpace: "pre-wrap",
                  boxSizing: "border-box",
                }}
              />
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  color: "#bbbbbb",
                  margin: 0,
                }}
              >
                <span style={{ fontWeight: "bold" }}>{wordCount}</span> words
                {" \u2022 "}
                <span style={{ fontWeight: "bold" }}>{readLengthMin}</span> min
                read
              </p>
            </div>

            {/* Editor content */}
            <div
              className="write-editor"
              style={{ flex: 1, paddingBottom: isMobile ? "64px" : undefined }}
            >
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: floating toolbar on selection + insert menu on empty lines */}
      {!isMobile && <DesktopBubbleToolbar editor={editor} />}
      {!isMobile && (
        <DesktopFloatingInsert editor={editor} fileInputRef={fileInputRef} />
      )}

      {/* Mobile: sticky bottom bar with all buttons */}
      {isMobile && (
        <MobileBottomToolbar editor={editor} fileInputRef={fileInputRef} />
      )}

      <CoverImageModal
        isOpen={showCoverModal}
        onClose={() => setShowCoverModal(false)}
        onSelect={handleCoverImageSelect}
        pieceContent={editor.getHTML()}
        currentCoverImage={coverImage}
      />
      {piece.riffs.length > 0 && (
        <ShareConfirmModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          onConfirm={async () => {
            const riff = piece.riffs[0];
            await fetch(`/api/riffs/${riff.id}/pieces/${piece.id}`, {
              method: "PATCH",
            });
          }}
          piece={{
            id: piece.id,
            title,
            coverImage,
            currentContent: editor?.getHTML() ?? piece.currentContent,
          }}
          riff={piece.riffs[0]}
        />
      )}
    </div>
  );
}
