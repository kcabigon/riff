"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { noiseTileStyle } from "@/components/NoiseBackground";
import TextInput from "@/components/TextInput";
import Tagline from "@/components/Tagline";
import BackButton from "@/components/BackButton";
import PrimaryButton from "@/components/PrimaryButton";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import ShareLinkOptions from "@/components/shared/ShareLinkOptions";
import BrushWordHero from "@/components/shared/BrushWordHero";
import TemplatePicker from "./TemplatePicker";
import { RIFF_TEMPLATES } from "@/lib/riff-templates";
import { toEndOfDay } from "@/lib/riff-utils";

const TOTAL_STEPS = 3;
// Slot 0 is the blank "Custom" state; slots 1..N are RIFF_TEMPLATES.
const TEMPLATE_SLOT_COUNT = RIFF_TEMPLATES.length + 1;

function getDefaultDeadline() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split("T")[0];
}

export default function CreateRiffClient() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [deadline, setDeadline] = useState(getDefaultDeadline);
  const [templateIndex, setTemplateIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdRiffId, setCreatedRiffId] = useState<string | null>(null);

  const daysUntilDeadline = deadline
    ? Math.round(
        (new Date(deadline).getTime() - new Date().setHours(0, 0, 0, 0)) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const goToNextTemplate = () => {
    const wrapped = (templateIndex + 1) % TEMPLATE_SLOT_COUNT;
    setTemplateIndex(wrapped);

    if (wrapped === 0) {
      setTitle("");
      setPrompt("");
      return;
    }

    const template = RIFF_TEMPLATES[wrapped - 1];
    setTitle(template.title);
    setPrompt(template.prompt);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => s - 1);
      return;
    }
    const from = sessionStorage.getItem("pendingRiffFrom") ?? "/home";
    sessionStorage.removeItem("pendingRiffFrom");
    router.push(from);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const createRes = await fetch("/api/riffs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Let's riff",
          prompt: prompt.trim() || null,
          deadline: toEndOfDay(deadline),
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        setError(data.error || "Failed to create riff");
        setLoading(false);
        return;
      }

      const { riff } = await createRes.json();

      const activateRes = await fetch(`/api/riffs/${riff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });

      if (!activateRes.ok) {
        setError("Riff created but failed to activate. Please try again.");
        setLoading(false);
        return;
      }

      sessionStorage.removeItem("pendingRiffFrom");
      setCreatedRiffId(riff.id);
      setLoading(false);
      setStep(3);
    } catch (err) {
      console.error("Error creating riff:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleDone = () => {
    if (createdRiffId) router.push(`/riffs/${createdRiffId}`);
  };

  const joinUrl = createdRiffId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/riffs/${createdRiffId}/join`
    : "";

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "100vh",
        ...noiseTileStyle,
      }}
    >
      {/* Hero — renders once for the whole flow, same technique as the
          create-club onboarding page; only the card below swaps per step. */}
      <div
        className="crhero-hero"
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "64px 24px 96px",
        }}
      >
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "840px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <BrushWordHero word="riff" className="crhero-frame" />

          <div
            className="crhero-card"
            style={{
              position: "relative",
              zIndex: 1,
              width: "100%",
              maxWidth: "560px",
              backgroundColor: "#FFFFFF",
              border: "2px solid #000000",
              boxShadow: "8px 8px 0px 0px #000000",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              textAlign: "left",
            }}
          >
            {step < 3 && (
              <div style={{ width: "100%", display: "flex" }}>
                <BackButton onClick={handleBack} />
              </div>
            )}

            <AnimatePresence mode="wait" initial={false}>
              {step === 1 && (
                <motion.form
                  key="step-1"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    setStep(2);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                      }}
                    >
                      <Tagline
                        text="Riff name"
                        color="#00FF66"
                        width={94}
                        textColor="#000000"
                        fontSize={16}
                      />
                      <TemplatePicker
                        activeIndex={templateIndex}
                        count={RIFF_TEMPLATES.length}
                        onNext={goToNextTemplate}
                      />
                    </div>
                    <TextInput
                      type="text"
                      name="title"
                      placeholder="Let's riff"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      autoFocus
                      maxLength={200}
                    />
                  </div>

                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <Tagline
                      text="Prompt"
                      color="#EECF01"
                      width={76}
                      textColor="#000000"
                      fontSize={16}
                    />
                    <TextInput
                      multiline
                      rows={3}
                      name="prompt"
                      placeholder="Let's write about..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                  </div>

                  {error && <p style={errorStyle}>{error}</p>}

                  <PrimaryButton type="submit">
                    Cool, what&apos;s next?
                  </PrimaryButton>
                  <OnboardingProgress
                    currentStep={1}
                    totalSteps={TOTAL_STEPS}
                  />
                </motion.form>
              )}

              {step === 2 && (
                <motion.form
                  key="step-2"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  onSubmit={handleCreate}
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <Tagline
                      text="Deadline"
                      color="#01EFFC"
                      width={86}
                      textColor="#000000"
                      fontSize={16}
                    />
                    <p
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "16px",
                        fontWeight: 300,
                        color: "#000000",
                        textAlign: "left",
                        margin: "0 0 8px 0",
                      }}
                    >
                      Writers have until this date to submit. You can reveal
                      early or move the date later.
                    </p>
                    <TextInput
                      type="date"
                      name="deadline"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      required
                    />
                    {daysUntilDeadline !== null && (
                      <span style={helperTextStyle}>
                        {daysUntilDeadline} days from today
                      </span>
                    )}
                  </div>

                  {error && <p style={errorStyle}>{error}</p>}

                  <PrimaryButton
                    type="submit"
                    loading={loading}
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Invite friends"}
                  </PrimaryButton>
                  <OnboardingProgress
                    currentStep={2}
                    totalSteps={TOTAL_STEPS}
                  />
                </motion.form>
              )}

              {step === 3 && createdRiffId && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                  }}
                >
                  <Tagline
                    text="Invite friends"
                    color="#C01582"
                    width={136}
                    textColor="#FFFFFF"
                    fontSize={16}
                  />

                  <ShareLinkOptions url={joinUrl} shareText="Let's riff!" />

                  <PrimaryButton onClick={handleDone}>Done</PrimaryButton>
                  <OnboardingProgress
                    currentStep={3}
                    totalSteps={TOTAL_STEPS}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <style>{`
        .crhero-frame {
          margin: 0;
        }
        .crhero-card {
          margin-top: -460px;
        }
        @media (max-width: 767px) {
          .crhero-hero {
            padding: 48px 24px 64px !important;
          }
          .crhero-card {
            margin-top: -240px;
          }
        }
      `}</style>
    </div>
  );
}

const errorStyle: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans)",
  fontSize: "14px",
  fontWeight: 300,
  color: "#DC2626",
  margin: 0,
  textAlign: "center",
};

const helperTextStyle: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#FFFFFF",
  padding: "2px 8px",
  fontFamily: "var(--font-dm-sans)",
  fontSize: "14px",
  fontWeight: 300,
  color: "#9C9C9C",
  alignSelf: "flex-start",
};
