"use client";

import { ReactNode, useState } from "react";
import { useDraftCreation } from "@/hooks/useDraftCreation";
import DraftChoiceModal from "./DraftChoiceModal";

interface DraftChoiceTriggerProps {
  riffId: string;
  // Whether the caller has any standalone draft to attach. When false, this
  // renders as a plain single-click "New draft" trigger — no modal at all —
  // identical to the old behavior. The choice only shows up when there's an
  // actual choice to make.
  hasStandaloneDrafts: boolean;
  // Render-prop rather than a pre-built element, so this component can wire
  // up the right onClick depending on which branch it's in: a real handler
  // in the single-click case, or "open the modal" in the choice case.
  renderTrigger: (onClick: () => void) => ReactNode;
  // Stops the click from bubbling past this component — needed when the
  // trigger sits inside a card that has its own navigate-on-click handler
  // (RiffEventCard).
  stopPropagation?: boolean;
}

export default function DraftChoiceTrigger({
  riffId,
  hasStandaloneDrafts,
  renderTrigger,
  stopPropagation = false,
}: DraftChoiceTriggerProps) {
  const { createDraft } = useDraftCreation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const wrapperProps = stopPropagation
    ? { onClick: (e: React.MouseEvent) => e.stopPropagation() }
    : {};

  if (!hasStandaloneDrafts) {
    return (
      <div {...wrapperProps}>{renderTrigger(() => createDraft(riffId))}</div>
    );
  }

  return (
    <div {...wrapperProps}>
      {renderTrigger(() => setIsModalOpen(true))}
      <DraftChoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        riffId={riffId}
      />
    </div>
  );
}
