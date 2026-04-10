"use client";

import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react";
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
import IconButton from "@/components/IconButton";
import { convertHeicToJpeg } from "@/lib/convert-heic";
import NoiseBackground from "@/components/NoiseBackground";
import { useIsMobile } from "@/hooks/useMediaQuery";
import StickyToolbar from "@/components/write/toolbar/StickyToolbar";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import EmbedModal from "@/components/write/EmbedModal";
import LinkPopover from "@/components/write/LinkPopover";
import WhatsNextModal, {
  type WhatsNextTrigger,
} from "@/components/shared/WhatsNextModal";

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
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [showSpotifyModal, setShowSpotifyModal] = useState(false);
  const [whatsNextTrigger, setWhatsNextTrigger] =
    useState<WhatsNextTrigger | null>(null);
  const [isSubmitHovered, setIsSubmitHovered] = useState(false);
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

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {},
    extensions: [
      // Shared extensions (same as read page for fidelity), minus Image and Link (overridden below)
      ...getSharedExtensions().filter(
        (ext) => ext.name !== "image" && ext.name !== "link"
      ),
      // Write-specific: Link renders as <span> so browser can't navigate
      Link.extend({
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

    try {
      file = await convertHeicToJpeg(file);
    } catch {
      alert("Could not process HEIC file. Please try converting it first.");
      return;
    }

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
                  <IconButton
                    src="/icons/cover_photo.svg"
                    label={
                      coverImage ? "Change cover image" : "Add cover image"
                    }
                    onClick={() => {
                      if (coverImage) {
                        setShowSubmitModal(true);
                      } else {
                        setShowCoverModal(true);
                      }
                    }}
                    size={24}
                  />
                ) : (
                  <button
                    onMouseEnter={() => setIsSubmitHovered(true)}
                    onMouseLeave={() => setIsSubmitHovered(false)}
                    onClick={() => {
                      if (coverImage) {
                        setShowSubmitModal(true);
                      } else {
                        setShowCoverModal(true);
                      }
                    }}
                    style={{
                      backgroundColor: isSubmitHovered ? "#00FF66" : "#FFFFFF",
                      border: "2px solid #000000",
                      boxShadow: isSubmitHovered
                        ? "8px 8px 0px 0px #000000"
                        : "8px 8px 0px 0px #01EFFC",
                      padding: isMobile ? "8px 24px" : "12px 48px",
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: isMobile ? "12px" : "16px",
                      fontWeight: 300,
                      color: "#000000",
                      cursor: "pointer",
                      whiteSpace: "nowrap" as const,
                    }}
                  >
                    Submit piece
                  </button>
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
          onOpenYoutubeModal={() => setShowYoutubeModal(true)}
          onOpenSpotifyModal={() => setShowSpotifyModal(true)}
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

      <EmbedModal
        isOpen={showYoutubeModal}
        onClose={() => setShowYoutubeModal(false)}
        title="Add YouTube video"
        placeholder="https://youtube.com/watch?v=..."
        onConfirm={(url) => {
          editor.chain().focus().setYoutubeVideo({ src: url }).run();
        }}
      />

      <EmbedModal
        isOpen={showSpotifyModal}
        onClose={() => setShowSpotifyModal(false)}
        title="Add Spotify track"
        placeholder="https://open.spotify.com/track/..."
        onConfirm={(url) => {
          editor.commands.setSpotifyEmbed({ src: url });
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
            setWhatsNextTrigger(
              isAdmin ? "host_submitted" : "member_submitted"
            );
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
            router.refresh();
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
