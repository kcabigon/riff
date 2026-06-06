"use client";

import {
  useEditor,
  EditorContent,
  ReactNodeViewRenderer,
  Editor,
} from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import ResizableImageView from "@/components/write/ResizableImageView";
import { getSharedExtensions } from "@/components/editor/extensions/sharedExtensions";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import "@/app/write/[pieceId]/editor.css";
import BackButton from "@/components/BackButton";
import CoverImageModal from "@/components/write/CoverImageModal";
import SubmitConfirmModal from "@/components/write/SubmitConfirmModal";
import { convertHeicToJpeg, isHeicFile } from "@/lib/convert-heic";
import NoiseBackground from "@/components/NoiseBackground";
import { useIsMobile } from "@/hooks/useMediaQuery";
import StickyToolbar from "@/components/write/toolbar/StickyToolbar";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import EmbedModal from "@/components/write/EmbedModal";
import MediaEmbedModal from "@/components/write/MediaEmbedModal";
import LinkPopover from "@/components/write/LinkPopover";
import WhatsNextModal, {
  type WhatsNextTrigger,
} from "@/components/shared/WhatsNextModal";
import { canShowWhatsNext } from "@/lib/whatsNextGuard";
import CTAButton from "@/components/CTAButton";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

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
  isAdmin?: boolean;
  hostFirstName?: string | null;
}

export default function WritePage({
  piece,
  isAdmin = false,
  hostFirstName,
}: WritePageProps) {
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">(
    "saved"
  );
  const [title, setTitle] = useState(piece.title || "Untitled");
  const [subtitle, setSubtitle] = useState(piece.subtitle || "");
  const [coverImage, setCoverImage] = useState<string | null>(piece.coverImage);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const linkSelectionRef = useRef<{ from: number; to: number } | null>(null);
  const [mediaEmbed, setMediaEmbed] = useState<{
    type: "youtube" | "spotify";
    prefilledUrl?: string;
  } | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const imageErrorTimerRef = useRef<NodeJS.Timeout | null>(null);
  const showImageError = useCallback((msg: string) => {
    if (imageErrorTimerRef.current) clearTimeout(imageErrorTimerRef.current);
    setImageError(msg);
    imageErrorTimerRef.current = setTimeout(() => setImageError(null), 4000);
  }, []);
  const editorRef = useRef<Editor | null>(null);
  const [whatsNextTrigger, setWhatsNextTrigger] =
    useState<WhatsNextTrigger | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(
    piece.riffs.some((r) => r.submittedAt !== null)
  );
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

  const handleImagePaste = useCallback(async (rawFile: File) => {
    setImageError(null);

    let file = rawFile;
    if (isHeicFile(rawFile)) {
      try {
        file = await convertHeicToJpeg(rawFile);
      } catch {
        showImageError("Could not process HEIC file — try a different format");
        return;
      }
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      showImageError(
        "Unsupported file type — use JPEG, PNG, GIF, WebP, or HEIC"
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showImageError("File too large — max 10MB");
      return;
    }

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.url) {
        showImageError("Upload failed — try again");
        return;
      }
      editorRef.current?.chain().focus().setImage({ src: data.url }).run();
    } catch {
      showImageError("Upload failed — try again");
    } finally {
      setIsUploadingImage(false);
    }
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      transformPastedHTML(html) {
        return html.replace(/<img[^>]*>/gi, "");
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of Array.from(items)) {
            if (item.type.startsWith("image/")) {
              const file = item.getAsFile();
              if (!file) continue;
              handleImagePaste(file);
              return true;
            }
          }
        }

        const text = event.clipboardData?.getData("text/plain")?.trim();
        if (text) {
          const isSpotify =
            /open\.spotify\.com\/(track|album|playlist|episode|show)\//.test(
              text
            );
          if (isSpotify) {
            setMediaEmbed({ type: "spotify", prefilledUrl: text });
            return true;
          }
        }

        return false;
      },
    },
    extensions: [
      // Shared extensions (same as read page for fidelity), minus Image and Link (overridden below)
      ...getSharedExtensions().filter(
        (ext) => ext.name !== "image" && ext.name !== "link"
      ),
      // Write-specific: Link renders as <span> so tapping/clicking never navigates — the
      // LinkPopover handles edit/remove/open instead. parseHTML recognizes the saved
      // <span data-link> format so links survive page reload.
      Link.extend({
        parseHTML() {
          return [
            ...(this.parent?.() ?? []),
            {
              tag: "span[data-link]",
              getAttrs: (node) => ({
                href: (node as HTMLElement).getAttribute("data-link"),
              }),
            },
          ];
        },
        renderHTML({ HTMLAttributes }) {
          return [
            "span",
            {
              ...HTMLAttributes,
              "data-link": HTMLAttributes.href,
              href: undefined,
              style: "cursor: text;",
            },
            0,
          ];
        },
      }).configure({ openOnClick: false }),
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
        allowBase64: false,
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

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

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

    setImageError(null);

    if (isHeicFile(file)) {
      try {
        file = await convertHeicToJpeg(file);
      } catch {
        showImageError("Could not process HEIC file — try a different format");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      showImageError(
        "Unsupported file type — use JPEG, PNG, GIF, WebP, or HEIC"
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showImageError("File too large — max 10MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploadingImage(true);
    try {
      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.url) {
        showImageError("Upload failed — " + (data.error || "try again"));
        return;
      }
      editor.chain().focus().setImage({ src: data.url }).run();
    } catch {
      showImageError("Upload failed — try again");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleBack = () => {
    if (piece.riffs.length > 0) {
      router.push(`/riffs/${piece.riffs[0].id}`);
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
            {/* Left side: back button + save status */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <BackButton onClick={handleBack} />
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
                        ? "#00FF66"
                        : saveStatus === "saving"
                          ? "#EECF01"
                          : "#808080",
                    animation:
                      saveStatus === "saving"
                        ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                        : "none",
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "12px",
                    fontWeight: 300,
                    color: "#808080",
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

            {/* Right side: CTA */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              {/* Submit CTA / cover icon */}
              {piece.riffs.length > 0 &&
                (isSubmitted ? (
                  <button
                    onClick={() => {
                      if (coverImage) {
                        setShowSubmitModal(true);
                      } else {
                        setShowCoverModal(true);
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#F5F5F5";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#FFFFFF";
                    }}
                    style={{
                      padding: isMobile ? "6px 10px" : "8px 16px",
                      fontSize: isMobile ? "11px" : "12px",
                      fontFamily: "var(--font-dm-sans)",
                      fontWeight: 300,
                      color: "#000000",
                      backgroundColor: "#FFFFFF",
                      border: "2px solid #000000",
                      boxShadow: "none",
                      cursor: "pointer",
                    }}
                  >
                    Cover
                  </button>
                ) : (
                  <CTAButton
                    onClick={() => {
                      if (coverImage) {
                        setShowSubmitModal(true);
                      } else {
                        setShowCoverModal(true);
                      }
                    }}
                    style={{
                      padding: isMobile ? "8px 24px" : "10px 32px",
                      fontSize: "12px",
                      boxShadow: "4px 4px 0px 0px #00FF66",
                    }}
                  >
                    Submit
                  </CTAButton>
                ))}
            </div>
          </div>

          {/* Mobile toolbar — pinned under top bar */}
          {isMobile && (
            <div
              style={{
                borderBottom: "2px solid #000000",
                paddingTop: "8px",
                paddingBottom: "8px",
              }}
            >
              <StickyToolbar
                editor={editor}
                fileInputRef={fileInputRef}
                inline
                onOpenLinkModal={() => {
                  linkSelectionRef.current = {
                    from: editor.state.selection.from,
                    to: editor.state.selection.to,
                  };
                  setShowLinkModal(true);
                }}
                onOpenYoutubeModal={() => setMediaEmbed({ type: "youtube" })}
                onOpenSpotifyModal={() => setMediaEmbed({ type: "spotify" })}
              />
            </div>
          )}
        </div>
      </div>

      {/* Image paste status toast */}
      {(isUploadingImage || imageError) && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 60,
            backgroundColor: "#FFFFFF",
            border: "2px solid #000000",
            boxShadow: "4px 4px 0px 0px #000000",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            whiteSpace: "nowrap",
          }}
        >
          {isUploadingImage ? (
            <>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#EECF01",
                  animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "12px",
                  fontWeight: 300,
                  color: "#000",
                }}
              >
                Uploading image...
              </span>
            </>
          ) : (
            <>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#DC2626",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "12px",
                  fontWeight: 300,
                  color: "#DC2626",
                }}
              >
                {imageError}
              </span>
              <button
                onClick={() => setImageError(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0 0 0 4px",
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  color: "#808080",
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </>
          )}
        </div>
      )}

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

        {/* Writing area */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingBottom: isMobile ? "48px" : "400px",
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
          <div
            className="write-editor"
            style={{ width: "100%", position: "relative" }}
          >
            <EditorContent editor={editor} />
            <LinkPopover editor={editor} />
          </div>
        </div>
      </div>

      {/* Floating toolbar — desktop only */}
      {!isMobile && (
        <StickyToolbar
          editor={editor}
          fileInputRef={fileInputRef}
          onOpenLinkModal={() => {
            linkSelectionRef.current = {
              from: editor.state.selection.from,
              to: editor.state.selection.to,
            };
            setShowLinkModal(true);
          }}
          onOpenYoutubeModal={() => setMediaEmbed({ type: "youtube" })}
          onOpenSpotifyModal={() => setMediaEmbed({ type: "spotify" })}
        />
      )}

      <EmbedModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        title="Add link"
        placeholder="https://..."
        showDisplayText={
          linkSelectionRef.current
            ? linkSelectionRef.current.from === linkSelectionRef.current.to
            : true
        }
        onConfirm={(url, displayText) => {
          const sel = linkSelectionRef.current;
          if (sel && sel.from !== sel.to) {
            editor
              .chain()
              .focus()
              .setTextSelection(sel)
              .setLink({ href: url })
              .run();
          } else {
            editor
              .chain()
              .focus()
              .insertContent(`<a href="${url}">${displayText}</a>`)
              .run();
          }
        }}
      />

      <MediaEmbedModal
        isOpen={!!mediaEmbed}
        type={mediaEmbed?.type ?? "youtube"}
        prefilledUrl={mediaEmbed?.prefilledUrl}
        onClose={() => setMediaEmbed(null)}
        onEmbed={(url) => {
          if (mediaEmbed?.type === "youtube") {
            editor.chain().focus().setYoutubeVideo({ src: url }).run();
          } else {
            editor.commands.setSpotifyEmbed({ src: url });
          }
        }}
      />

      <CoverImageModal
        isOpen={showCoverModal}
        onClose={() => setShowCoverModal(false)}
        onSelect={(url) => {
          handleCoverImageSelect(url);
          setShowCoverModal(false);
          setShowSubmitModal(true);
        }}
        onSkip={() => {
          setShowCoverModal(false);
          setShowSubmitModal(true);
        }}
        pieceContent={editor.getHTML()}
        currentCoverImage={coverImage}
      />
      {piece.riffs.length > 0 && (
        <SubmitConfirmModal
          isOpen={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          onConfirm={async () => {
            const riff = piece.riffs[0];
            await fetch(`/api/riffs/${riff.id}/pieces/${piece.id}`, {
              method: "PATCH",
            });
            setIsSubmitted(true);
            setShowSubmitModal(false);
            const submitTrigger = isAdmin
              ? "host_submitted"
              : "member_submitted";
            if (canShowWhatsNext(submitTrigger)) {
              setWhatsNextTrigger(submitTrigger);
            } else {
              router.push(`/riffs/${riff.id}`);
            }
          }}
          submitDisabled={isSubmitted}
          onCoverAction={() => {
            if (coverImage) {
              setCoverImage(null);
              autosaveCoverImage(null);
            }
            setShowSubmitModal(false);
            setShowCoverModal(true);
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

      {/* What's Next Modal */}
      {whatsNextTrigger && (
        <WhatsNextModal
          isOpen={true}
          onClose={() => {
            setWhatsNextTrigger(null);
            router.push(`/riffs/${piece.riffs[0]?.id ?? ""}`);
          }}
          trigger={whatsNextTrigger}
          hostFirstName={hostFirstName}
          onCTAClick={() => {
            setWhatsNextTrigger(null);
            router.push(`/riffs/${piece.riffs[0]?.id ?? ""}`);
          }}
        />
      )}
    </div>
  );
}
