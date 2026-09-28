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
  buildReadingReminderEmail,
  buildMemberJoinedEmail,
  buildParticipantJoinedEmail,
  buildCoHostAssignedEmail,
  buildHostTransferredEmail,
  buildPieceSharedEmail,
  buildPieceInviteAcceptedEmail,
  buildCommentNotificationEmail,
} from "@/lib/resend";
import { getBaseUrl } from "@/lib/env";

// Sample data for the /dev/emails preview page, taken from the Midnight Howlers
// club on the dev database so the previews read like real mail. Names, titles
// and word counts only — no addresses, no writing. Dates are computed relative
// to now so countdowns always look current.

const CLUB = "Midnight Howlers";
const HOST = "Johnny Thrills";
const MEMBER = "Rivy Bobby";
const WRITER = "Jarric Ramos";
const RIFF_TITLE = "Summer Stories";
const VOLUME = 6;
const PROMPT =
  "In Derek's last piece he mentioned wormhole songs. Let's all write about this, songs that transport you to a different time and place.";

// Made up for the preview — the real email uses the opening of the piece.
// Written as the editor stores it, heading and formatting included, so the
// preview exercises what the excerpt keeps and what it flattens.
const SAMPLE_CONTENT = [
  "<h2>Chapter 1</h2>",
  "<p>We left before sunrise with a cooler, two boards, and a map nobody could read. By the time we crossed the border the radio had given up on English, and so had we.</p>",
  "<p>Somewhere past Ensenada the road turned to washboard and the truck started making a sound my dad swore was <em>normal</em>. It was <strong>not</strong> normal.</p>",
  "<p>We found that out forty miles later, parked on the shoulder with the hood up,<br>eating warm tortillas while a man named Chuy explained the problem with his hands. He fixed it with a coat hanger. It held for the rest of the trip, and, as far as I know, for the rest of that truck's life.</p>",
  '<img src="https://example.com/photo.jpg">',
  "<p>Twenty-five years later I still think about that coat hanger.</p>",
].join("");

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
              riffName: `Volume ${VOLUME}: ${RIFF_TITLE}`,
              pieces: [
                { title: "Mt. Whitney", authorName: WRITER, readLengthMin: 2 },
                {
                  title: "366 Days of Summer",
                  authorName: HOST,
                  readLengthMin: 2,
                },
                {
                  title: "We'll Always Have Mammoth",
                  authorName: MEMBER,
                  readLengthMin: 9,
                },
              ],
            }),
        },
        {
          label: "Open riff",
          build: () =>
            buildRiffRevealedEmail({
              clubName: null,
              riffUrl,
              riffName: RIFF_TITLE,
              pieces: [
                { title: "Mt. Whitney", authorName: WRITER, readLengthMin: 2 },
                {
                  title: "366 Days of Summer",
                  authorName: HOST,
                  readLengthMin: 2,
                },
                {
                  title: "We'll Always Have Mammoth",
                  authorName: MEMBER,
                  readLengthMin: 9,
                },
              ],
            }),
        },
        {
          label: "Only writer this round",
          build: () =>
            buildRiffRevealedEmail({
              clubName: CLUB,
              riffUrl,
              riffName: `Volume ${VOLUME}: ${RIFF_TITLE}`,
              pieces: [],
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
              actorName: "Rivy",
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
              actorName: "Rivy",
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
      name: "Riff reminders",
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
      id: "reading-reminders",
      name: "Reading reminders",
      trigger:
        "Cron: 5 and 10 days after a reveal, to every member (participants, for an open riff) with pieces left to read — writers and non-writers alike.",
      variants: [
        {
          label: "First nudge, several unread",
          build: () =>
            buildReadingReminderEmail({
              clubName: CLUB,
              riffName: `Volume ${VOLUME}: ${RIFF_TITLE}`,
              nudge: "first",
              pieces: [
                { title: "Mt. Whitney", authorName: WRITER, readLengthMin: 2 },
                {
                  title: "366 Days of Summer",
                  authorName: HOST,
                  readLengthMin: 2,
                },
                {
                  title: "We'll Always Have Mammoth",
                  authorName: MEMBER,
                  readLengthMin: 9,
                },
              ],
              riffUrl,
            }),
        },
        {
          label: "Second nudge, one left",
          build: () =>
            buildReadingReminderEmail({
              clubName: CLUB,
              riffName: `Volume ${VOLUME}: ${RIFF_TITLE}`,
              nudge: "second",
              pieces: [
                {
                  title: "We'll Always Have Mammoth",
                  authorName: MEMBER,
                  readLengthMin: 9,
                },
              ],
              riffUrl,
            }),
        },
        {
          label: "Open riff",
          build: () =>
            buildReadingReminderEmail({
              clubName: null,
              riffName: RIFF_TITLE,
              nudge: "first",
              pieces: [
                { title: "Mt. Whitney", authorName: WRITER, readLengthMin: 2 },
                {
                  title: "We'll Always Have Mammoth",
                  authorName: MEMBER,
                  readLengthMin: 9,
                },
              ],
              riffUrl,
            }),
        },
        {
          label: "Big riff, list capped",
          build: () =>
            buildReadingReminderEmail({
              clubName: CLUB,
              riffName: "Volume 9",
              nudge: "first",
              pieces: [
                { title: "Mt. Whitney", authorName: WRITER, readLengthMin: 2 },
                {
                  title: "366 Days of Summer",
                  authorName: HOST,
                  readLengthMin: 2,
                },
                { title: "Wild Days", authorName: WRITER, readLengthMin: 2 },
                { title: "Whoa, Dusty", authorName: HOST, readLengthMin: 3 },
                { title: "Boat Life", authorName: WRITER, readLengthMin: 2 },
                {
                  title: "Bass Lake Commune Trip",
                  authorName: HOST,
                  readLengthMin: 2,
                },
                {
                  title: "We'll Always Have Mammoth",
                  authorName: MEMBER,
                  readLengthMin: 9,
                },
              ],
              riffUrl,
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
              coHostName: "Jay",
              adminName: "Johnny",
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
              oldHostName: "Johnny",
              newHostName: "Jay",
              clubName: CLUB,
              clubUrl,
              recipient: "newHost",
            }),
        },
        {
          label: "To the old host",
          build: () =>
            buildHostTransferredEmail({
              oldHostName: "Johnny",
              newHostName: "Jay",
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
          label: "With cover and subtitle",
          build: () =>
            buildPieceSharedEmail({
              actorName: "Jarric",
              authorName: WRITER,
              pieceTitle: "Someday, Somewhere in Baja",
              subtitle: "25 Years of Baja",
              // The piece's real cover on the dev database.
              coverImage:
                "https://wmqlbbtgexpsxzwwurpi.supabase.co/storage/v1/object/public/images/75eee551-a1e5-49fd-ace3-b3f2ae6a7ae6.jpg",
              content: SAMPLE_CONTENT,
              readLengthMin: 10,
              pieceUrl: `${base}/read/preview`,
            }),
        },
        {
          label: "No cover, titled Untitled",
          build: () =>
            buildPieceSharedEmail({
              actorName: "Jarric",
              authorName: WRITER,
              pieceTitle: "Untitled",
              content: SAMPLE_CONTENT,
              readLengthMin: 3,
              pieceUrl: `${base}/read/preview`,
            }),
        },
      ],
    },
    {
      id: "piece-invite-accepted",
      name: "Piece invite accepted",
      trigger:
        "Someone accepts an invite sent through a piece's link and becomes the author's friend. The author only, and only for a new friendship.",
      variants: [
        {
          label: "Titled piece",
          build: () =>
            buildPieceInviteAcceptedEmail({
              accepterName: "Rivy",
              pieceTitle: "Mt. Whitney",
              friendsUrl: `${base}/home`,
            }),
        },
        {
          label: "Titled Untitled",
          build: () =>
            buildPieceInviteAcceptedEmail({
              accepterName: "Rivy",
              pieceTitle: "Untitled",
              friendsUrl: `${base}/home`,
            }),
        },
      ],
    },
    {
      id: "comment-digest",
      name: "Comment digest",
      trigger:
        "Daily cron: new comments on your piece, or replies in a thread you're in. One email per piece.",
      variants: [
        {
          label: "Comments",
          build: () =>
            buildCommentNotificationEmail({
              pieceTitle: "Mt. Whitney",
              commentCount: 3,
              replyCount: 0,
              actorNames: ["Rivy", "Johnny"],
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
              actorNames: ["Johnny"],
              pieceUrl: `${base}/read/preview`,
            }),
        },
        {
          label: "Both, many people",
          build: () =>
            buildCommentNotificationEmail({
              pieceTitle: "Mt. Whitney",
              commentCount: 4,
              replyCount: 1,
              actorNames: ["Rivy", "Johnny", "Jay", "Kyle"],
              pieceUrl: `${base}/read/preview`,
            }),
        },
      ],
    },
  ];
}
