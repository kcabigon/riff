"use client";

import { useRef, useState, FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import TextInput from "@/components/TextInput";
import Tagline from "@/components/Tagline";
import PrimaryButton from "@/components/PrimaryButton";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import ImageUploadFlow from "@/components/shared/ImageUploadFlow";
import type { ImageUploadFlowHandle } from "@/components/shared/ImageUploadFlow";
import HeroCardOverlay from "@/components/shared/HeroCardOverlay";
import OverlayStepHeader from "@/components/shared/OverlayStepHeader";
import FormErrorText from "@/components/shared/FormErrorText";
import CadenceOptionList from "./CadenceOptionList";
import {
  CREATION_CADENCE_OPTIONS,
  DEFAULT_CADENCE,
  CadenceValue,
  getCadenceDays,
} from "@/lib/cadence";
import {
  createAndActivateRiff,
  toEndOfDay,
  toLocalDateInputValue,
} from "@/lib/riff-utils";
import { CLUB_NAME_MAX, DESCRIPTION_MAX } from "@/lib/constants";

const TOTAL_STEPS = 3;

interface CreateClubOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (clubId: string) => void;
}

export default function CreateClubOverlay({
  isOpen,
  onClose,
  onCreated,
}: CreateClubOverlayProps) {
  const [step, setStep] = useState(1);
  const [clubName, setClubName] = useState("");
  const [description, setDescription] = useState("");
  const [cadence, setCadence] = useState<CadenceValue>(DEFAULT_CADENCE);
  const [bannerImage, setBannerImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const uploadFlowRef = useRef<ImageUploadFlowHandle>(null);

  const reset = () => {
    setStep(1);
    setClubName("");
    setDescription("");
    setCadence(DEFAULT_CADENCE);
    setBannerImage("");
    setLoading(false);
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => s - 1);
      return;
    }
    handleClose();
  };

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const finalClubName = clubName.trim() || "Write Club";

    // If the user has an unsaved crop, save it first
    let finalBannerImage = bannerImage;
    if (uploadFlowRef.current?.hasPendingCrop()) {
      const url = await uploadFlowRef.current.saveCrop();
      if (!url) {
        // Crop/upload failed — don't submit the form
        setLoading(false);
        return;
      }
      finalBannerImage = url;
    }

    try {
      const response = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: finalClubName,
          description: description.trim() || null,
          bannerImage: finalBannerImage || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create club");
      }

      const data = await response.json();
      const clubId = data.club.id;

      // Set as the user's last active club — onboarding is already complete
      // by the time anyone reaches club creation, whether via signup or Home.
      await fetch("/api/onboarding/complete", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId: clubId }),
      });

      // The first riff is real, not mocked — a new club should never land
      // the host on an empty page. Deadline is seeded directly from the
      // chosen cadence's day count (no Cadence field needed for this one-off
      // creation; only the *next* riff after this one needs the schema).
      // Best-effort: club creation itself already succeeded, so a hiccup
      // here shouldn't block the host from reaching their new club.
      try {
        const cadenceDays = getCadenceDays(cadence);
        if (cadenceDays) {
          const deadlineDate = new Date();
          deadlineDate.setDate(deadlineDate.getDate() + cadenceDays);
          const deadline = toEndOfDay(toLocalDateInputValue(deadlineDate));

          let result = await createAndActivateRiff(
            `/api/clubs/${clubId}/riffs`,
            { deadline }
          );
          if (!result.ok) {
            result = await createAndActivateRiff(`/api/clubs/${clubId}/riffs`, {
              deadline,
            });
          }
          if (!result.ok) {
            console.error(
              "Failed to create first riff for new club after retry"
            );
          }
        }
      } catch (riffErr) {
        console.error("Error creating first riff for new club:", riffErr);
      }

      const createdClubId = clubId;
      reset();
      onCreated(createdClubId);
    } catch (err) {
      console.error("Error creating club:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <HeroCardOverlay
      isOpen={isOpen}
      onClose={handleClose}
      ariaLabel="Create a club"
      word="writeclub"
      cardOverlap={{ desktop: 420, mobile: 200 }}
    >
      <OverlayStepHeader
        heading={step === 1 ? "We write on repeat." : undefined}
        onBack={step > 1 ? handleBack : undefined}
      />

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
              <Tagline
                text="Who we are..."
                color="#C01582"
                width={116}
                textColor="#FFFFFF"
                fontSize={16}
              />
              <TextInput
                type="text"
                name="clubName"
                placeholder="Dead Poets Society"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                autoFocus
                maxLength={CLUB_NAME_MAX}
                error={clubName.length >= CLUB_NAME_MAX ? " " : undefined}
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
                text="What we're about..."
                color="#955CB5"
                width={156}
                textColor="#FFFFFF"
                fontSize={16}
              />
              <TextInput
                multiline
                rows={3}
                name="description"
                placeholder="We don't read and write poetry because it's cute. We read and write poetry because..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={DESCRIPTION_MAX}
                error={description.length >= DESCRIPTION_MAX ? " " : undefined}
              />
            </div>

            <PrimaryButton type="submit">Cool, what&apos;s next?</PrimaryButton>
            <OnboardingProgress currentStep={1} totalSteps={TOTAL_STEPS} />
          </motion.form>
        )}

        {step === 2 && (
          <motion.form
            key="step-2"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onSubmit={(e) => {
              e.preventDefault();
              setStep(3);
            }}
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            <Tagline
              text="How often we riff..."
              color="#EECF01"
              width={162}
              textColor="#000000"
              fontSize={16}
            />

            <CadenceOptionList
              value={cadence}
              options={CREATION_CADENCE_OPTIONS}
              onSelect={setCadence}
            />

            <span
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: 300,
                color: "#9C9C9C",
                textAlign: "center",
              }}
            >
              Riffs run on repeat. You can adjust this later.
            </span>
            <PrimaryButton type="submit">Almost there...</PrimaryButton>
            <OnboardingProgress currentStep={2} totalSteps={TOTAL_STEPS} />
          </motion.form>
        )}

        {step === 3 && (
          <motion.form
            key="step-3"
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
                gap: "16px",
              }}
            >
              <Tagline
                text="This is our vibe..."
                color="#01EFFC"
                textColor="#000000"
                width={156}
                fontSize={16}
              />
              <ImageUploadFlow
                ref={uploadFlowRef}
                onSelect={(url) => setBannerImage(url)}
                currentImage={bannerImage || null}
                aspectRatio={3 / 1}
                removeLabel="Remove photo"
                hideSaveButton
              />
            </div>

            <FormErrorText message={error} />

            <PrimaryButton type="submit" loading={loading} disabled={loading}>
              Create your club
            </PrimaryButton>
            <OnboardingProgress currentStep={3} totalSteps={TOTAL_STEPS} />
          </motion.form>
        )}
      </AnimatePresence>
    </HeroCardOverlay>
  );
}
