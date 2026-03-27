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
import { convertHeicToJpeg } from "@/lib/convert-heic";

interface RiffConnection {
  id: string;
  title: string | null;
  prompt: string | null;
  deadline: string | null;
  clubId: string;
  clubName: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const titleSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

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

  // Helper to render a toolbar button
  const ToolbarButton = ({
    isActive,
    onClick,
    title: btnTitle,
    children,
  }: {
    isActive?: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      style={{
        width: "32px",
        height: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "6px",
        border: "0.5px solid transparent",
        background: isActive ? "#e5e7eb" : "transparent",
        cursor: "pointer",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.border = "0.5px solid #ffffff";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.border = "0.5px solid transparent";
      }}
      title={btnTitle}
    >
      {children}
    </button>
  );

  const TextLabel = ({
    text,
    bold,
    italic,
    underline,
    strikethrough,
  }: {
    text: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
  }) => (
    <span
      style={{
        fontFamily: "var(--font-playfair), serif",
        fontSize: "14px",
        fontWeight: bold ? "bold" : "normal",
        fontStyle: italic ? "italic" : "normal",
        textDecoration: underline
          ? "underline"
          : strikethrough
            ? "line-through"
            : "none",
        color: "#fff",
      }}
    >
      {text}
    </span>
  );

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
          <button
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
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 1V11M1 6H11"
                stroke="#000000"
                strokeWidth="1"
                strokeLinecap="round"
              />
            </svg>
            Share
          </button>
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
                {riff.title || "Untitled"}
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
            <div className="write-editor" style={{ flex: 1 }}>
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* Toolbar at bottom of canvas */}
          <div
            style={{
              height: "48px",
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              className="write-toolbar-container"
              style={{
                display: "flex",
                gap: "8px",
                height: "32px",
                alignItems: "center",
                overflowX: "auto",
                overflowY: "hidden",
                width: "100%",
              }}
            >
              {/* Bold */}
              <ToolbarButton
                isActive={editor.isActive("bold")}
                onClick={() => editor.chain().focus().toggleBold().run()}
                title="Bold"
              >
                <TextLabel text="B" bold />
              </ToolbarButton>

              {/* Italic */}
              <ToolbarButton
                isActive={editor.isActive("italic")}
                onClick={() => editor.chain().focus().toggleItalic().run()}
                title="Italic"
              >
                <TextLabel text="I" italic />
              </ToolbarButton>

              {/* Underline */}
              <ToolbarButton
                isActive={editor.isActive("underline")}
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                title="Underline"
              >
                <TextLabel text="U" underline />
              </ToolbarButton>

              {/* Strikethrough */}
              <ToolbarButton
                isActive={editor.isActive("strike")}
                onClick={() => editor.chain().focus().toggleStrike().run()}
                title="Strikethrough"
              >
                <TextLabel text="S" strikethrough />
              </ToolbarButton>

              {/* H1 */}
              <ToolbarButton
                isActive={editor.isActive("heading", { level: 1 })}
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
                title="Heading 1"
              >
                <TextLabel text="H1" />
              </ToolbarButton>

              {/* H2 */}
              <ToolbarButton
                isActive={editor.isActive("heading", { level: 2 })}
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                title="Heading 2"
              >
                <TextLabel text="H2" />
              </ToolbarButton>

              {/* H3 */}
              <ToolbarButton
                isActive={editor.isActive("heading", { level: 3 })}
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
                title="Heading 3"
              >
                <TextLabel text="H3" />
              </ToolbarButton>

              {/* Bullet List */}
              <ToolbarButton
                isActive={editor.isActive("bulletList")}
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                title="Bullet List"
              >
                <TextLabel text={"\u2022"} />
              </ToolbarButton>

              {/* Numbered List */}
              <ToolbarButton
                isActive={editor.isActive("orderedList")}
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                title="Numbered List"
              >
                <TextLabel text="1." />
              </ToolbarButton>

              {/* Align Left */}
              <ToolbarButton
                isActive={editor.isActive({ textAlign: "left" })}
                onClick={() =>
                  editor.chain().focus().setTextAlign("left").run()
                }
                title="Align Left"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 19h18v-2H3v2zm0-4h12v-2H3v2zm0-6v2h18V9H3zm0-4v2h12V5H3z"
                    fill="#fff"
                  />
                </svg>
              </ToolbarButton>

              {/* Align Center */}
              <ToolbarButton
                isActive={editor.isActive({ textAlign: "center" })}
                onClick={() =>
                  editor.chain().focus().setTextAlign("center").run()
                }
                title="Align Center"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 19h18v-2H3v2zm4-4h10v-2H7v2zM3 9v2h18V9H3zm4-4v2h10V5H7z"
                    fill="#fff"
                  />
                </svg>
              </ToolbarButton>

              {/* Align Right */}
              <ToolbarButton
                isActive={editor.isActive({ textAlign: "right" })}
                onClick={() =>
                  editor.chain().focus().setTextAlign("right").run()
                }
                title="Align Right"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 19h18v-2H3v2zm6-4h12v-2H9v2zM3 9v2h18V9H3zm6-4v2h12V5H9z"
                    fill="#fff"
                  />
                </svg>
              </ToolbarButton>

              {/* Link */}
              <ToolbarButton
                isActive={editor.isActive("link")}
                onClick={() => {
                  const url = window.prompt("Enter URL:");
                  if (url) {
                    editor.chain().focus().setLink({ href: url }).run();
                  }
                }}
                title="Link"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"
                    fill="#fff"
                  />
                </svg>
              </ToolbarButton>

              {/* Image */}
              <ToolbarButton
                onClick={() => fileInputRef.current?.click()}
                title="Image"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
                    fill="#fff"
                  />
                </svg>
              </ToolbarButton>

              {/* YouTube */}
              <ToolbarButton
                onClick={() => {
                  const url = window.prompt("Enter YouTube URL:");
                  if (url) {
                    editor.chain().focus().setYoutubeVideo({ src: url }).run();
                  }
                }}
                title="YouTube"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"
                    fill="#fff"
                  />
                </svg>
              </ToolbarButton>

              {/* Spotify */}
              <ToolbarButton
                onClick={() => {
                  const url = window.prompt("Enter Spotify URL:");
                  if (url) {
                    editor.commands.setSpotifyEmbed({ src: url });
                  }
                }}
                title="Spotify"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.73 14.4c-.15.25-.42.35-.68.25-1.87-1.15-4.22-1.41-6.99-.77-.27.06-.54-.09-.6-.36-.06-.27.09-.54.36-.6 3.04-.7 5.67-.4 7.73.89.26.15.35.42.18.59zm.97-2.16c-.19.3-.58.4-.88.21-2.14-1.32-5.41-1.7-7.95-.93-.32.1-.66-.08-.76-.4-.1-.32.08-.66.4-.76 2.91-.88 6.55-.45 8.97 1.06.3.19.4.58.22.82zm.08-2.24c-2.57-1.53-6.81-1.67-9.26-.92-.39.12-.8-.11-.92-.5-.12-.39.11-.8.5-.92 2.81-.86 7.51-.7 10.51 1.06.36.21.48.68.27 1.04-.21.36-.68.48-1.1.24z"
                    fill="#fff"
                  />
                </svg>
              </ToolbarButton>
            </div>
          </div>
        </div>
      </div>

      <CoverImageModal
        isOpen={showCoverModal}
        onClose={() => setShowCoverModal(false)}
        onSelect={handleCoverImageSelect}
        pieceContent={editor.getHTML()}
        currentCoverImage={coverImage}
      />
    </div>
  );
}
