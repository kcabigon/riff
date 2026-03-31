"use client";

import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Image from "@tiptap/extension-image";
import ResizableImageView from "@/components/write/ResizableImageView";
import { getSharedExtensions } from "@/components/editor/extensions/sharedExtensions";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import "@/app/write/[pieceId]/editor.css";
import BackButton from "@/components/BackButton";
import IconButton from "@/components/IconButton";
import CoverImageModal from "@/components/write/CoverImageModal";
import ShareConfirmModal from "@/components/write/ShareConfirmModal";
import { convertHeicToJpeg } from "@/lib/convert-heic";
import NoiseBackground from "@/components/NoiseBackground";
import { useIsMobile } from "@/hooks/useMediaQuery";
import StickyToolbar from "@/components/write/toolbar/StickyToolbar";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useScrollDirection } from "@/hooks/useScrollDirection";

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
    subtitle: string | null;
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
  const [subtitle, setSubtitle] = useState(piece.subtitle || "");
  const [coverImage, setCoverImage] = useState<string | null>(piece.coverImage);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const isSubmitted = piece.riffs.some((r) => r.submittedAt !== null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const subtitleRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const titleSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const subtitleSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const isMobile = useIsMobile();
  useThemeColor("#FFFFFF");
  const navVisible = useScrollDirection({ threshold: 15 });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // Shared extensions (same as read page for fidelity)
      ...getSharedExtensions().filter((ext) => ext.name !== "image"),
      // Write-specific: Image with resize handles
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: null,
              renderHTML: (attributes) => {
                if (!attributes.width) return {};
                return { style: `width: ${attributes.width}` };
              },
              parseHTML: (element) => element.style.width || null,
            },
            textAlign: {
              default: "center",
              renderHTML: (attributes) => {
                return { "data-align": attributes.textAlign };
              },
              parseHTML: (element) =>
                element.getAttribute("data-align") || "center",
            },
          };
        },
        addNodeView() {
          return ReactNodeViewRenderer(ResizableImageView);
        },
      }).configure({
        inline: false,
        allowBase64: true,
      }),
      // Write-specific: placeholder + character count
      Placeholder.configure({
        placeholder: "Start typing here...",
      }),
      CharacterCount,
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
        const wc = editor.storage.characterCount.words();
        autosaveContent(html, wc, Math.max(1, Math.round(wc / 200)));
      }, 500);
    },
  });

  const autosaveContent = useCallback(
    async (content: string, wordCount: number, readLengthMin: number) => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/pieces/${piece.id}/autosave`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentContent: content,
            wordCount,
            readLengthMin,
          }),
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

  const autosaveSubtitle = useCallback(
    async (newSubtitle: string) => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/pieces/${piece.id}/autosave`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subtitle: newSubtitle }),
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
    },
    [autosaveCoverImage]
  );

  // Auto-resize title textarea
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

  // Auto-resize subtitle textarea
  useEffect(() => {
    const resizeTextarea = () => {
      if (subtitleRef.current) {
        subtitleRef.current.style.height = "24px";
        subtitleRef.current.style.height =
          subtitleRef.current.scrollHeight + "px";
      }
    };
    requestAnimationFrame(resizeTextarea);
    window.addEventListener("resize", resizeTextarea);
    return () => window.removeEventListener("resize", resizeTextarea);
  }, [subtitle]);

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

  // Debounced subtitle autosave
  useEffect(() => {
    if (subtitleSaveTimerRef.current) {
      clearTimeout(subtitleSaveTimerRef.current);
    }
    subtitleSaveTimerRef.current = setTimeout(() => {
      autosaveSubtitle(subtitle);
    }, 2000);
    return () => {
      if (subtitleSaveTimerRef.current) {
        clearTimeout(subtitleSaveTimerRef.current);
      }
    };
  }, [subtitle, autosaveSubtitle]);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    let file = event.target.files?.[0];
    if (!file || !editor) return;

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
      {/* Noise background — desktop only */}
      {!isMobile && (
        <NoiseBackground fillMode="cover" style={{ position: "fixed" }} />
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        onChange={handleImageUpload}
        style={{ display: "none" }}
      />

      {/* Top bar — fixed on mobile (with hide-on-scroll), sticky on desktop */}
      <div
        style={{
          position: isMobile ? "fixed" : "sticky",
          top: 0,
          left: 0,
          right: isMobile ? 0 : undefined,
          zIndex: 50,
          width: isMobile ? "100%" : "100%",
          maxWidth: isMobile ? "100%" : "720px",
          backgroundColor: "#FFFFFF",
          transform:
            isMobile && !navVisible ? "translateY(-100%)" : "translateY(0)",
          transition: "transform 200ms ease",
          willChange: isMobile ? "transform" : undefined,
        }}
      >
        <div
          style={{
            maxWidth: "720px",
            width: "100%",
            margin: "0 auto",
            padding: "0 24px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 0 8px",
            }}
          >
            <BackButton onClick={handleBack} />

            {/* Right side: save status + cover + share */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              {/* Save status */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    width: "6px",
                    height: "6px",
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
                    fontSize: "14px",
                    fontWeight: 400,
                    color: "#999999",
                  }}
                >
                  {saveStatus === "saved"
                    ? "Saved"
                    : saveStatus === "saving"
                      ? "Saving..."
                      : "Unsaved"}
                </span>
              </div>

              {/* Cover button */}
              <IconButton
                src="/icons/cover_photo.svg"
                label={coverImage ? "Change cover image" : "Add cover image"}
                onClick={() => setShowCoverModal(true)}
                size={24}
              />

              {/* Share button */}
              {piece.riffs.length > 0 &&
                (isSubmitted ? (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "12px",
                      fontWeight: 300,
                      color: "#000000",
                      background: "#00FF66",
                      border: "1px solid #000000",
                      borderRadius: "2px",
                      padding: "2px 8px",
                    }}
                  >
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
                  </span>
                ) : (
                  <IconButton
                    src="/icons/share.svg"
                    label="Share to riff"
                    onClick={() => setShowShareModal(true)}
                    size={24}
                  />
                ))}
            </div>
          </div>

          {/* Mobile toolbar — pinned under top bar */}
          {isMobile && (
            <div
              style={{
                borderBottom: "2px solid #000000",
                paddingBottom: "8px",
              }}
            >
              <StickyToolbar
                editor={editor}
                fileInputRef={fileInputRef}
                inline
              />
            </div>
          )}
        </div>
      </div>

      {/* Content area */}
      <div
        style={{
          width: "100%",
          maxWidth: "720px",
          padding: "0 24px",
          boxSizing: "border-box",
          background: "#FFFFFF",
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
        }}
      >
        {/* Spacer — accounts for fixed bar height on mobile */}
        <div style={{ height: isMobile ? "140px" : "24px" }} />

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
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "12px",
                  fontWeight: 400,
                  color: "#000000",
                  border: "1px solid #00FF66",
                  borderRadius: "2px",
                  padding: riff.submittedAt ? "4px 12px" : "4px 8px 4px 12px",
                }}
              >
                {riff.title || "Active Riff"}
                {!riff.submittedAt && (
                  <button
                    onClick={async () => {
                      await fetch(`/api/riffs/${riff.id}/pieces/${piece.id}`, {
                        method: "DELETE",
                      });
                      router.refresh();
                    }}
                    title="Remove from riff"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "0",
                      display: "flex",
                      alignItems: "center",
                      color: "#888888",
                      lineHeight: 1,
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M1 1L9 9M9 1L1 9"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Writing area */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingBottom: isMobile ? "48px" : "100px",
          }}
        >
          {/* Title */}
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
              color: "#000000",
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

          {/* Subtitle */}
          <textarea
            ref={subtitleRef}
            value={subtitle}
            onChange={(e) => {
              setSubtitle(e.target.value);
              setSaveStatus("unsaved");
            }}
            placeholder="Add a subtitle..."
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#666666",
              margin: 0,
              marginTop: "8px",
              border: "none",
              outline: "none",
              background: "transparent",
              textAlign: "center",
              width: "100%",
              padding: 0,
              resize: "none",
              overflow: "hidden",
              lineHeight: "1.4",
              minHeight: "24px",
              height: "24px",
              overflowWrap: "break-word",
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
              boxSizing: "border-box",
            }}
          />

          {/* Word count */}
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              color: "#999999",
              margin: "12px 0 0",
            }}
          >
            <span style={{ fontWeight: "bold" }}>{wordCount}</span> words
            {" \u2022 "}
            <span style={{ fontWeight: "bold" }}>{readLengthMin}</span> min read
          </p>

          {/* Spacer before editor */}
          <div style={{ height: "32px" }} />

          {/* Editor content */}
          <div className="write-editor" style={{ width: "100%" }}>
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* Floating toolbar — desktop only */}
      {!isMobile && (
        <StickyToolbar editor={editor} fileInputRef={fileInputRef} />
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
