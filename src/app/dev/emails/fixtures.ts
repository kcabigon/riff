import {
  type BuiltEmail,
  buildSignInEmail,
  buildOnboardingEmail,
  buildRiffCreatedEmail,
  buildRiffRevealedEmail,
  buildDeadlineChangedEmail,
  buildRiffGracePeriodEmail,
  buildPieceSubmittedEmail,
  buildClubPausedEmail,
  buildRiffReminderEmail,
  buildMemberJoinedEmail,
  buildParticipantJoinedEmail,
  buildCoHostAssignedEmail,
  buildHostTransferredEmail,
  buildPieceSharedEmail,
  buildCommentNotificationEmail,
} from "@/lib/resend";
import { getBaseUrl } from "@/lib/env";

// Sample data for the /dev/emails preview page, taken from the Midnight Howlers
// club on the dev database so the previews read like real mail. Names, titles
// and word counts only — no addresses, no writing. Dates are computed relative
// to now so countdowns always look current.

const CLUB = "Midnight Howlers";
const HOST = "Johnny Thrills";
const CO_HOST = "Jay Dogg";
const MEMBER = "Rivy Bobby";
const WRITER = "Jarric Ramos";
const RIFF_TITLE = "Summer Stories";
const VOLUME = 6;
const PROMPT =
  "In Derek's last piece he mentioned wormhole songs. Let's all write about this, songs that transport you to a different time and place.";

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export interface EmailVariant {
  label: string;
  build: () => BuiltEmail;
}

export interface EmailPreview {
  id: string;
  name: string;
  trigger: string;
  variants: EmailVariant[];
}

export function getEmailPreviews(): EmailPreview[] {
  const base = getBaseUrl();
  const clubUrl = `${base}/clubs/preview`;
  const riffUrl = `${base}/riffs/preview`;
  const magicLink = `${base}/api/auth/callback/resend?token=preview`;

  return [
    {
      id: "sign-in",
      name: "Sign in",
      trigger: "A returning user asks for a login link.",
      variants: [
        { label: "Default", build: () => buildSignInEmail(magicLink) },
      ],
    },
    {
      id: "welcome",
      name: "Welcome",
      trigger:
        "A new user (or one who never finished onboarding) asks for a login link.",
      variants: [
        { label: "Default", build: () => buildOnboardingEmail(magicLink) },
      ],
    },
    {
      id: "riff-created",
      name: "New riff",
      trigger:
        "A riff opens — started by a host, or by the cadence cron. Every member except whoever started it.",
      variants: [
        {
          label: "Title and prompt",
          build: () =>
            buildRiffCreatedEmail({
              clubName: CLUB,
              riffUrl: clubUrl,
              riffName: RIFF_TITLE,
              prompt: PROMPT,
              deadline: daysFromNow(14),
            }),
        },
        {
          label: "No title or prompt (every scheduled riff)",
          build: () =>
            buildRiffCreatedEmail({
              clubName: CLUB,
              riffUrl: clubUrl,
              riffName: `Volume ${VOLUME + 1}`,
              deadline: daysFromNow(7),
            }),
        },
      ],
    },
    {
      id: "riff-revealed",
      name: "Riff revealed",
      trigger:
        "A host reveals, or the cron reveals at the deadline. Every member (participants, for an open riff).",
      variants: [
        {
          label: "Club riff",
          build: () =>
            buildRiffRevealedEmail({
              clubName: CLUB,
              riffUrl,
              riffTitle: RIFF_TITLE,
              volumeNumber: VOLUME,
              pieceCount: 3,
            }),
        },
        {
          label: "Open riff",
          build: () =>
            buildRiffRevealedEmail({
              clubName: null,
              riffUrl,
              riffTitle: RIFF_TITLE,
              volumeNumber: null,
              pieceCount: 3,
            }),
        },
      ],
    },
    {
      id: "deadline-changed",
      name: "Deadline changed",
      trigger:
        "A host edits a riff's deadline. Members (participants, for an open riff).",
      variants: [
        {
          label: "Pushed back a week",
          build: () =>
            buildDeadlineChangedEmail({
              clubName: CLUB,
              riffName: RIFF_TITLE,
              riffUrl: clubUrl,
              previousDeadline: daysFromNow(3),
              newDeadline: daysFromNow(10),
            }),
        },
        {
          label: "Pulled in",
          build: () =>
            buildDeadlineChangedEmail({
              clubName: CLUB,
              riffName: `Volume ${VOLUME + 1}`,
              riffUrl: clubUrl,
              previousDeadline: daysFromNow(10),
              newDeadline: daysFromNow(8),
            }),
        },
        {
          label: "Open riff",
          build: () =>
            buildDeadlineChangedEmail({
              clubName: null,
              riffName: RIFF_TITLE,
              riffUrl,
              previousDeadline: daysFromNow(3),
              newDeadline: daysFromNow(10),
            }),
        },
      ],
    },
    {
      id: "grace-week",
      name: "Grace week",
      trigger:
        "Cron: a deadline passes with nothing submitted, so it adds one week. Every member.",
      variants: [
        {
          label: "Default",
          build: () =>
            buildRiffGracePeriodEmail({
              clubName: CLUB,
              riffUrl: clubUrl,
              newDeadline: daysFromNow(7),
            }),
        },
      ],
    },
    {
      id: "piece-submitted",
      name: "Piece submitted",
      trigger:
        "Someone submits a piece. Every member except the writer (participants, for an open riff).",
      variants: [
        {
          label: "Club riff",
          build: () =>
            buildPieceSubmittedEmail({
              actorName: MEMBER,
              riffName: RIFF_TITLE,
              clubName: CLUB,
              riffUrl: clubUrl,
              submittedCount: 2,
              writerCount: 4,
              pieceTitle: "We'll Always Have Mammoth",
              deadline: daysFromNow(3),
            }),
        },
        {
          label: "Open riff, untitled piece",
          build: () =>
            buildPieceSubmittedEmail({
              actorName: MEMBER,
              riffName: RIFF_TITLE,
              clubName: null,
              riffUrl,
              submittedCount: 1,
              writerCount: 3,
              pieceTitle: null,
              deadline: daysFromNow(1),
            }),
        },
      ],
    },
    {
      id: "club-paused",
      name: "Club paused",
      trigger: "Cron: the grace week passes with nothing submitted. Host only.",
      variants: [
        {
          label: "Weekly club",
          build: () =>
            buildClubPausedEmail({
              clubName: CLUB,
              clubUrl,
              riffName: `Volume ${VOLUME + 1}`,
            }),
        },
      ],
    },
    {
      id: "reminders",
      name: "Reminders",
      trigger:
        "Cron: at the halfway point and the day before the deadline. Every member who hasn't submitted (participants, for an open riff).",
      variants: [
        {
          label: "Halfway, started",
          build: () =>
            buildRiffReminderEmail({
              clubName: CLUB,
              riffName: RIFF_TITLE,
              riffUrl: clubUrl,
              deadline: daysFromNow(4),
              milestone: "halfway",
              draft: {
                url: `${base}/write/preview`,
                title: "Mt. Whitney",
                wordCount: 362,
              },
            }),
        },
        {
          label: "Halfway, not started",
          build: () =>
            buildRiffReminderEmail({
              clubName: CLUB,
              riffName: RIFF_TITLE,
              riffUrl: clubUrl,
              deadline: daysFromNow(4),
              milestone: "halfway",
              draft: null,
            }),
        },
        {
          label: "Last call, started",
          build: () =>
            buildRiffReminderEmail({
              clubName: CLUB,
              riffName: RIFF_TITLE,
              riffUrl: clubUrl,
              deadline: daysFromNow(1),
              milestone: "final",
              draft: {
                url: `${base}/write/preview`,
                title: "Mt. Whitney",
                wordCount: 362,
              },
            }),
        },
        {
          label: "Last call, not started",
          build: () =>
            buildRiffReminderEmail({
              clubName: CLUB,
              riffName: `Volume ${VOLUME + 1}`,
              riffUrl: clubUrl,
              deadline: daysFromNow(1),
              milestone: "final",
              draft: null,
            }),
        },
        {
          label: "Empty draft attached",
          build: () =>
            buildRiffReminderEmail({
              clubName: CLUB,
              riffName: RIFF_TITLE,
              riffUrl: clubUrl,
              deadline: daysFromNow(4),
              milestone: "halfway",
              draft: {
                url: `${base}/write/preview`,
                title: "Untitled",
                wordCount: 0,
              },
            }),
        },
      ],
    },
    {
      id: "member-joined",
      name: "Member joined",
      trigger: "Someone joins a club. Every other member.",
      variants: [
        {
          label: "Default",
          build: () =>
            buildMemberJoinedEmail({
              newMemberFullName: MEMBER,
              newMemberFirstName: "Rivy",
              clubName: CLUB,
              clubUrl,
              memberCount: 4,
            }),
        },
      ],
    },
    {
      id: "participant-joined",
      name: "Participant joined",
      trigger:
        "Someone joins an open riff (by link, attaching a draft, or starting one). The riff's creator only.",
      variants: [
        {
          label: "Default",
          build: () =>
            buildParticipantJoinedEmail({
              newParticipantFullName: MEMBER,
              riffName: RIFF_TITLE,
              riffUrl,
              participantCount: 3,
            }),
        },
      ],
    },
    {
      id: "co-host",
      name: "Co-host assigned",
      trigger: "A host makes someone co-host. The new co-host.",
      variants: [
        {
          label: "Default",
          build: () =>
            buildCoHostAssignedEmail({
              coHostName: CO_HOST,
              adminName: HOST,
              clubName: CLUB,
              clubUrl,
            }),
        },
      ],
    },
    {
      id: "host-transferred",
      name: "Host transferred",
      trigger:
        "A host hands the club to someone else. The old and new hosts, each with their own version.",
      variants: [
        {
          label: "To the new host",
          build: () =>
            buildHostTransferredEmail({
              oldHostName: HOST,
              newHostName: CO_HOST,
              clubName: CLUB,
              clubUrl,
              recipient: "newHost",
            }),
        },
        {
          label: "To the old host",
          build: () =>
            buildHostTransferredEmail({
              oldHostName: HOST,
              newHostName: CO_HOST,
              clubName: CLUB,
              clubUrl,
              recipient: "oldHost",
            }),
        },
      ],
    },
    {
      id: "piece-shared",
      name: "Piece shared",
      trigger:
        "An author sends a piece to specific friends from the Share modal.",
      variants: [
        {
          label: "Default",
          build: () =>
            buildPieceSharedEmail({
              actorName: WRITER,
              pieceTitle: "Someday, Somewhere in Baja",
              pieceUrl: `${base}/read/preview`,
            }),
        },
      ],
    },
    {
      id: "comment-digest",
      name: "Comment digest",
      trigger:
        "Daily cron: new comments on your piece, or replies in a thread you're in.",
      variants: [
        {
          label: "Comments",
          build: () =>
            buildCommentNotificationEmail({
              pieceTitle: "Mt. Whitney",
              commentCount: 3,
              replyCount: 0,
              pieceUrl: `${base}/read/preview`,
            }),
        },
        {
          label: "Replies",
          build: () =>
            buildCommentNotificationEmail({
              pieceTitle: "We'll Always Have Mammoth",
              commentCount: 0,
              replyCount: 2,
              pieceUrl: `${base}/read/preview`,
            }),
        },
        {
          label: "Both",
          build: () =>
            buildCommentNotificationEmail({
              pieceTitle: "Mt. Whitney",
              commentCount: 2,
              replyCount: 1,
              pieceUrl: `${base}/read/preview`,
            }),
        },
      ],
    },
  ];
}
