"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { getSharedExtensions } from "@/components/editor/extensions/sharedExtensions";
import { useRouter } from "next/navigation";
import "@/app/write/[pieceId]/editor.css";
import BackButton from "@/components/BackButton";
import CTAButton from "@/components/CTAButton";
import NoiseBackground from "@/components/NoiseBackground";
import TutorialCoverImageModal from "@/components/tutorial/TutorialCoverImageModal";
import TutorialSubmitConfirmModal from "@/components/tutorial/TutorialSubmitConfirmModal";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { TUTORIAL_PIECE, TUTORIAL_EDITOR_CONTENT } from "@/lib/tutorial";

interface TutorialWritePageProps {
  clubId: string;
}

export default function TutorialWritePage({ clubId }: TutorialWritePageProps) {
  const router = useRouter();
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const isMobile = useIsMobile();
  const navVisible = useScrollDirection({ threshold: 15 });
  useThemeColor("#FFFFFF");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: getSharedExtensions(),
    content: TUTORIAL_EDITOR_CONTENT,
    editable: false,
  });

  if (!editor) return null;

  const readLengthMin = Math.max(1, Math.round(TUTORIAL_PIECE.wordCount / 200));

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
      {!isMobile && (
        <NoiseBackground fillMode="cover" style={{ position: "fixed" }} />
      )}

      {/* Top bar */}
      <div
        style={{
          position: isMobile ? "fixed" : "sticky",
          top: 0,
          left: 0,
          right: isMobile ? 0 : undefined,
          zIndex: 50,
          width: "100%",
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
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <BackButton
                onClick={() => router.push(`/tutorial/riff?clubId=${clubId}`)}
              />
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#955CB5",
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
                  Saved
                </span>
              </div>
            </div>

            <CTAButton
              onClick={() => setShowCoverModal(true)}
              accentColor="#955CB5"
              style={{
                padding: isMobile ? "8px 24px" : "10px 32px",
                fontSize: "12px",
                boxShadow: "4px 4px 0px 0px #955CB5",
              }}
            >
              Submit
            </CTAButton>
          </div>
        </div>
      </div>

      <TutorialCoverImageModal
        isOpen={showCoverModal}
        onClose={() => setShowCoverModal(false)}
        onSave={() => {
          setShowCoverModal(false);
          setShowConfirmModal(true);
        }}
      />
      <TutorialSubmitConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() =>
          router.push(`/tutorial/riff?step=submitted&clubId=${clubId}`)
        }
      />

      {/* Content */}
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
        <div style={{ height: isMobile ? "80px" : "24px" }} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingBottom: isMobile ? "48px" : "100px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: "32px",
              fontWeight: "bold",
              color: "#000000",
              textAlign: "center",
              width: "100%",
              lineHeight: "1.2",
            }}
          >
            {TUTORIAL_PIECE.title}
          </div>

          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              color: "#999999",
              margin: "12px 0 0",
            }}
          >
            <span style={{ fontWeight: "bold" }}>
              {TUTORIAL_PIECE.wordCount}
            </span>{" "}
            words{" • "}
            <span style={{ fontWeight: "bold" }}>{readLengthMin}</span> min read
          </p>

          <div style={{ height: "32px" }} />

          <div
            className="write-editor"
            style={{ width: "100%", position: "relative" }}
          >
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}
