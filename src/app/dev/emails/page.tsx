import { notFound } from "next/navigation";
import { getEmailPreviews } from "./fixtures";
import EmailPreviewClient, { type PreviewGroup } from "./EmailPreviewClient";

/**
 * Dev-only email preview. Renders every transactional email with sample data,
 * exactly as its send function would build it — nothing is sent and the
 * database is never touched. Every deployed environment runs with
 * NODE_ENV=production (see vercel.json), so this only exists locally.
 *
 * Emails are built here on the server (they're plain strings) and handed to a
 * small client component that handles browsing.
 */

// Sidebar grouping and order. Anything in fixtures but missing here lands in a
// trailing "Other" group, so a new email can't silently vanish from the page.
const GROUPS: Array<{ label: string; color: string; ids: string[] }> = [
  { label: "Account", color: "#01EFFC", ids: ["sign-in", "welcome"] },
  {
    label: "Riffs",
    color: "#00FF66",
    ids: [
      "riff-created",
      "deadline-changed",
      "piece-submitted",
      "grace-week",
      "club-paused",
      "riff-revealed",
    ],
  },
  {
    label: "Reminders",
    color: "#EECF01",
    ids: ["reminders", "reading-reminders"],
  },
  {
    label: "Club & friends",
    color: "#C01582",
    ids: [
      "member-joined",
      "participant-joined",
      "co-host",
      "host-transferred",
      "piece-invite-accepted",
    ],
  },
  {
    label: "Pieces & comments",
    color: "#955CB5",
    ids: ["piece-shared", "comment-digest"],
  },
];

export default async function EmailPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; v?: string; w?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const params = await searchParams;
  const previews = getEmailPreviews().map((p) => ({
    id: p.id,
    name: p.name,
    trigger: p.trigger,
    variants: p.variants.map((v) => ({ label: v.label, ...v.build() })),
  }));

  const grouped = new Set(GROUPS.flatMap((g) => g.ids));
  const groups: PreviewGroup[] = GROUPS.map((g) => ({
    label: g.label,
    color: g.color,
    emails: g.ids
      .map((id) => previews.find((p) => p.id === id))
      .filter((p): p is (typeof previews)[number] => Boolean(p)),
  }));
  const ungrouped = previews.filter((p) => !grouped.has(p.id));
  if (ungrouped.length > 0) {
    groups.push({ label: "Other", color: "#FF6B35", emails: ungrouped });
  }

  return (
    <EmailPreviewClient
      groups={groups}
      initialEmail={params.email}
      initialVariant={Number(params.v) || 0}
      initialWidth={params.w === "mobile" ? "mobile" : "desktop"}
    />
  );
}
