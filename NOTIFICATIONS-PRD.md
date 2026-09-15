# Riff — Notifications PRD

**Status**: Draft for review
**Author**: Chris
**Last updated**: August 3, 2026
**Scope**: All outbound notifications — email today, push later. Covers taxonomy, architecture, preferences, copy system, Riff Recapped, metrics, and rollout.

---

## 1. Thesis

**Riff is a re-engagement product wearing an essay platform's clothes.**

Every core action in Riff happens on a delay from the trigger. A riff opens today and closes in a month. Pieces reveal on Tuesday and get read on Saturday. You leave a comment Monday, the author sees it Thursday. Nothing about this loop is session-bound — which means **the notification is where the product actually happens.** The app is where it gets consumed.

The current build treats notifications as plumbing bolted onto features. That's backwards. Notifications are the product surface with the widest reach: every member of every club touches them, including the ones who never open the app. A club dies not because the app is bad but because nobody was reminded that four people are waiting on their essay.

Three loops carry the whole product, and only one of them is even partially instrumented today:

| Loop | What has to happen | Notification state today |
|---|---|---|
| **Write** | Join riff → start draft → submit before deadline | Partially covered (PR #209) |
| **Read** | Reveal → read your friends' pieces → comment | **Almost nothing** |
| **Return** | Comments land on your piece → you come back → riff wraps → next riff | Weak (one daily digest) |

The Read loop is the gap that matters most. A revealed riff with zero reads is a dead riff, and right now the only thing telling you to go read your friends' work is a single "pieces revealed" email sent once, on day zero, that gets buried by Wednesday.

**This PRD's bet**: build the notification layer as a first-class system — one registry, one delivery ledger, real preferences, a digest engine, channel-agnostic from day one — then fill it with the ~25 notifications the product is missing. Email first, because email is the only channel we have. Push later, on the exact same rails.

---

## 2. Where we are today

### 2.1 What exists

**12 email types**, all in `src/lib/resend.ts` (727 lines):

| Email | Trigger | Fires |
|---|---|---|
| Sign-in magic link | Auth | Instant |
| Onboarding welcome | First sign-up | Instant |
| Riff created | Host creates riff | Instant, all club members |
| Riff revealed | Host reveals | Instant, all participants |
| Member joined club | New member | Instant, host |
| Piece submitted to riff | Someone submits | Instant, participants |
| Deadline changed | Host edits deadline | Instant, participants |
| All pieces submitted | Last submission lands | Instant, host |
| Co-host assigned | Role change | Instant |
| Host transferred | Role change | Instant |
| Comment digest | Daily cron 13:00 UTC | Daily, piece author |
| *(magic link variant)* | Auth | Instant |

**In flight — PR #209** (`feature/engagement-reminders`) adds the first recurring nudges: deadline approaching (tiered cadence), remember-to-write, join-riff nudge. This is the right instinct and should merge as-is; it's also the PR that surfaces every architectural gap below.

**Supporting infrastructure**:
- `emailShell()` / `emailButton()` — shared brutalist HTML shell, table-based, inline styles. Genuinely good; keep it.
- `Notification` model + bell/panel, polls every 30s. 20 enum types declared, **8 of which are never written** (`RIFF_STARTED`, `RIFF_DEADLINE_APPROACHING`, `RIFF_COMPLETED`, `COMMENT_REPLY`, `RIFF_INVITATION`, `COLLECTION_INVITE`, `PIECE_ADDED_TO_COLLECTION`, plus legacy).
- `User.emailNotifications` / `User.emailMarketing` — two booleans.
- `batchNotificationsEnabled()` — bulk preference check.
- One Vercel cron (`daily-comment-notifications`), plus a second added by #209.
- `/account` → `EmailSection.tsx` — On/Off toggles for the two booleans.

### 2.2 What's structurally broken

These aren't nitpicks. Each one hard-caps how many notifications we can ship before the system collapses.

| # | Problem | Why it blocks scale |
|---|---|---|
| 1 | **No delivery ledger.** PR #209 tracks repeat-sends by writing `Notification` rows with `isRead: true` so they stay invisible in the bell. | Clever hack, wrong home. Conflates in-app notifications with delivery records. No way to answer "did we send this?", "did they open it?", "how many emails did this user get this week?" Every new recurring notification reinvents its own idempotency. |
| 2 | **Preferences are one nuclear boolean.** `emailNotifications` on/off. | At 12 emails it's survivable. At 40 it guarantees mass unsubscribe: one annoying nudge and the user kills their magic-link-adjacent notifications too. Users need to turn off *the thing that annoyed them*, not everything. |
| 3 | **No frequency cap.** | With #209 merged, a participant in two active riffs who also got comments can receive 5+ emails in a day. That's the single fastest way to train people to ignore us. |
| 4 | **No bundling / digest engine.** Every notification is its own email. | Most of what's proposed in §3 should never be a standalone email. Without a digest, "more notifications" and "more inbox spam" are the same project. |
| 5 | **No channel abstraction.** Send functions call Resend directly. | Push means rewriting every call site. Do it once, now, while there are 12. |
| 6 | **Unsubscribe requires login.** Footer links to `/account`. | Gmail/Yahoo bulk-sender rules want one-click `List-Unsubscribe`. Login-gated unsubscribe → people hit "report spam" instead, which poisons deliverability for magic links. **This is the one item that can break auth.** |
| 7 | **HTML-only, no plaintext part, no preheader.** | Spam-filter penalty, and inbox previews currently show scraped markup instead of a hook line. |
| 8 | **No timezone on `User`.** Cron runs 13:00 UTC. | 6am for some users, 11pm for others. Send-time is one of the highest-leverage variables in email and we can't touch it. |
| 9 | **No `lastSeenAt` on `User`.** | Dormancy and win-back notifications are simply not computable today. |
| 10 | **No comment-read tracking.** | "Go read the comments people left on your piece" — the notification Chris explicitly asked for — cannot be built correctly. Today's digest sends "3 new comments in 24h" whether or not the author already read them. |
| 11 | **Zero metrics.** No opens, clicks, or downstream-action attribution. | We can't tell which notifications work, so we can't cut the ones that don't. At 40 types, that's fatal. |
| 12 | **Copy is inline in template functions.** | Variant rotation (#209 does this well) is per-notification bespoke. No shared voice layer, no way to A/B. |

---

## 3. The notification catalog

Every notification Riff should send, organized by loop. `✅` exists · `🚧` in PR #209 · `🆕` new.

Legend for **Channel**: `E` email · `P` push (future) · `A` in-app bell.
Legend for **Delivery**: `Instant` · `Digest` (rolled into a daily/weekly bundle) · `Recurring` (cron, cadenced).

### 3.1 Account & onboarding

| # | Notification | Recipient | Trigger | Delivery | Status |
|---|---|---|---|---|---|
| A1 | Magic link | User | Sign-in request | Instant, E only, **never suppressible** | ✅ |
| A2 | Welcome | New user | Sign-up | Instant | ✅ |
| A3 | **Onboarding stalled** | User | `onboardingCompleted: false` + 24h since `onboardingStep` set | Recurring (2 sends, then stop) | 🆕 |
| A4 | **No club yet** | User | Onboarded, zero `ClubMember` rows, 2 days | Recurring (day 2, 7, 14) | 🆕 |
| A5 | **Your club is empty** | Host | Club created, <2 members, 2 days | Recurring (day 2, 5, 12) | 🆕 |
| A6 | **Club has members but no riff** | Host | ≥2 members, zero riffs, 3 days | Recurring (day 3, 7, 14) | 🆕 |

A5 and A6 are the highest-ROI notifications in this entire document and the easiest to overlook. A host who never starts a riff produces a club of zero engaged users. One email unblocks all of them.

### 3.2 Club social

| # | Notification | Recipient | Trigger | Delivery | Status |
|---|---|---|---|---|---|
| B1 | Member joined your club | Host | Join | Instant | ✅ |
| B2 | Club invitation | Invitee | Invite created | Instant | ✅ (in-app; email path needs audit) |
| B3 | Co-host assigned / host transferred | Affected user | Role change | Instant | ✅ |
| B4 | **New member intro** | All members | Someone joins | Digest (daily) | 🆕 |

### 3.3 Riff kickoff — the Write loop, opening

| # | Notification | Recipient | Trigger | Delivery | Status |
|---|---|---|---|---|---|
| C1 | Riff created | Club members | Host creates | Instant | ✅ |
| C2 | **Riff started** | Club members | DRAFT → ACTIVE | Instant | 🆕 (enum exists, unwired) |
| C3 | Join riff nudge | Non-joined members | 3d after creation, +7d cadence | Recurring | 🚧 |
| C4 | Deadline changed | Participants | Host edits | Instant | ✅ |
| C5 | **Your club is filling up** | Non-joined members | ≥50% of club joined, you haven't | Digest | 🆕 |

C5 is social proof, and it's a materially stronger nudge than C3's generic "come join." Named people beat abstract deadlines: *"Sarah, Dev, and 3 others are writing for Vol. 4."*

### 3.4 Writing window — the Write loop, middle

| # | Notification | Recipient | Trigger | Delivery | Status |
|---|---|---|---|---|---|
| D1 | Remember to write | Joined, zero pieces | 3d after joining, +7d | Recurring | 🚧 |
| D2 | Deadline approaching | Joined, unsubmitted | Tiered: 7d / 3d / 2d cadence | Recurring | 🚧 |
| D3 | Piece submitted | Participants | Someone submits | Digest (daily) | ✅ *(currently instant — should become digest)* |
| D4 | All pieces submitted | Host | Last submission | Instant | ✅ |
| D5 | **Draft going cold** | Author | Draft has content, no `updatedAt` change in 4d, deadline >2d out | Recurring | 🆕 |
| D6 | **Deadline today** | Unsubmitted participants | Deadline within 24h | Instant, 1x, **bypasses digest** | 🆕 |
| D7 | **You missed it** | Unsubmitted participants | Deadline passed, not yet revealed | Instant, 1x | 🆕 |

D5 is a real and distinct case from D1. "Never started" and "started, stuck at 400 words, avoiding it" need completely different copy. D5 should reference their actual draft — title and word count — because specificity is what makes it feel like the product noticed.

D7 is delicate. Framed wrong it's a scolding email that loses the user. Framed right it's the on-ramp to the next volume: *"Vol. 4 closed without you. Vol. 5 opens soon — want in?"*

### 3.5 Reveal & reading — **the Read loop, the biggest gap**

| # | Notification | Recipient | Trigger | Delivery | Status |
|---|---|---|---|---|---|
| E1 | Pieces revealed | Participants | Host reveals | Instant | ✅ |
| E2 | **Go read your friends' pieces** | Participants with unread pieces | Day 2, 4, 7, 11 post-reveal | Recurring | 🆕 |
| E3 | **One piece left** | Read all but 1 | Any time ≥24h after reveal | Instant, 1x | 🆕 |
| E4 | **You finished the riff** | Read all pieces | On last read | Instant, 1x | 🆕 |
| E5 | **Someone read your piece** | Author | First read only | Instant, 1x | 🆕 |
| E6 | **Your piece is waiting for readers** | Author | 0 reads, 4d post-reveal | Instant, 1x | 🆕 ⚠️ |

**E2 is the single most important new notification in this document.** It's what Chris named first, and it's the difference between a club that reads each other and a club where everyone submits into a void.

The design that makes E2 work is personalization. Not "3 pieces are waiting" — instead: cover images, real titles, real author names, real read-times, and only the ones *you specifically* haven't opened:

> **Three pieces you haven't read yet**
> — *The Lighthouse Keeper's Daughter* by Maya · 6 min
> — *Notes on Leaving* by Dev · 4 min
> — *Untitled (draft 7)* by Sarah · 11 min
> **[Start reading]**

Every element there is already in the database: `PieceRead` tells us what's unread, `Piece.coverImage`, `Piece.readLengthMin`, `Piece.title`, author. Zero schema work. This is buildable today.

E3 and E4 exploit completion psychology — the same mechanic as a progress ring at 4/5. Cheap to build, disproportionately effective.

E6 is flagged ⚠️ because "nobody has read your work" is a genuinely painful sentence to receive. Two options: (a) don't send it to the author at all, and instead escalate E2 to the *readers* of that specific piece, or (b) send it framed as reciprocity — *"Readers tend to come back to writers who read them. Two pieces are waiting on you."* **Recommendation: (a).** Never tell someone they were ignored. Fix it by nudging the people who can un-ignore them.

### 3.6 Comments & feedback — the Return loop

| # | Notification | Recipient | Trigger | Delivery | Status |
|---|---|---|---|---|---|
| F1 | Comment digest on your piece | Author | Daily cron | Digest | ✅ |
| F2 | **First comment on your piece** | Author | First comment ever | Instant, **bypasses digest** | 🆕 |
| F3 | **Unread comments waiting** | Author | Comments exist unseen by author, 2d | Recurring | 🆕 † |
| F4 | **Reply to your comment** | Comment author | Reply created | Digest | 🆕 (enum exists) |
| F5 | **New comment in a thread you're in** | Thread participants | Comment on a piece you commented on | Digest | 🆕 |
| F6 | **You read it — say something** | Reader | Read a piece, left no comment, 2d later | Recurring, 1x per piece | 🆕 |
| F7 | **Reciprocity nudge** | User | X commented on your piece; you haven't commented on X's | Digest | 🆕 |

† F3 requires schema work (see §5). It is precisely the "reminders to go read the comments people left on your piece" ask, and it is meaningfully different from F1: F1 fires on *comment recency*, F3 fires on *author unawareness*. F1 sends once and never follows up; if you missed it, those comments are gone forever. F3 keeps asking until you've actually seen them. **F3 is the correct long-term implementation and F1 should eventually fold into it.**

F2 deserves to break the digest rule. First comment on your first piece is the highest-emotion moment in the entire product — the moment someone learns that strangers read their writing and responded to it. That should hit their phone in 60 seconds, not tomorrow at 8am.

F7 is the strongest social mechanic available to us and costs one join query. *"Maya left 4 comments on your piece. She hasn't heard from you on hers."* Guilt is a feature.

### 3.7 Riff Recapped — see §6 for full spec

| # | Notification | Recipient | Trigger | Delivery | Status |
|---|---|---|---|---|---|
| G1 | Riff completed | Participants | REVEALED → COMPLETED | Instant | 🆕 (enum exists) |
| G2 | **Riff Recapped** | Participants | Riff completes | Instant, 1x, individually personalized | 🆕 ⭐ |
| G3 | **Club Recapped** | Club members | Quarterly / annually | Scheduled | 🆕 ⭐ |

### 3.8 Lifecycle & dormancy

| # | Notification | Recipient | Trigger | Delivery | Status |
|---|---|---|---|---|---|
| H1 | **Club's gone quiet** | Host | No ACTIVE riff for 14d | Recurring (14d, 30d) | 🆕 |
| H2 | **Here's what you missed** | User | No session in 30d, club active | Recurring, 1x/30d, max 3 | 🆕 |
| H3 | **Win-back** | User | 90d dormant | 1x, then stop forever | 🆕 |

H1 is the club-level analogue of A6 and just as important. Clubs don't die from conflict, they die from nobody starting Vol. 5.

### 3.9 Jams & public sharing

| # | Notification | Recipient | Trigger | Delivery | Status |
|---|---|---|---|---|---|
| I1 | **New jams from your club** | Club members | Unread jams exist | Digest (weekly) | 🆕 |
| I2 | **Your public piece is getting read** | Author | Public share hits 5/25/100 reads | Instant, milestone-gated | 🆕 |

I2 is a growth loop, not a retention loop: it teaches authors that sharing publicly produces a visible reward, which produces more public shares, which produces new users.

### 3.10 Catalog summary

**~41 notifications total**: 12 shipped, 3 in PR #209, **26 new**. Of the 26, **19 need no schema change** and can be built on the existing data model.

---

## 4. Architecture

The catalog above is unmanageable with today's code. Twelve hand-rolled send functions works; forty-one does not. Six components make it tractable.

### 4.1 Notification registry (`src/lib/notifications/catalog.ts`)

One declaration per notification, one source of truth. Everything downstream — preferences UI, digest builder, frequency caps, metrics dashboard, push payloads — reads from this.

```ts
export const NOTIFICATIONS = {
  UNREAD_PIECES_IN_RIFF: {
    key: "UNREAD_PIECES_IN_RIFF",
    category: "READING",           // → maps to a user preference toggle
    channels: ["email", "push", "inApp"],
    delivery: "digest",            // "instant" | "digest" | "recurring"
    priority: 60,                  // tiebreak when frequency-capped
    capClass: "nudge",             // "transactional" (exempt) | "social" | "nudge"
    defaultEnabled: true,
    cadence: { firstAfterDays: 2, repeatEveryDays: 3, maxSends: 4 },
    copy: {
      subject: [/* variants */],
      preheader: [/* variants */],
      pushTitle: "...",            // declared now, used when push ships
      pushBody: "...",
    },
    deepLink: (ctx) => `/riffs/${ctx.riffId}`,
  },
  // ...40 more
} as const;
```

Declaring `pushTitle`/`pushBody` now, before push exists, is deliberate: it costs nothing and it means shipping push is a delivery-layer change rather than a 41-notification copy project.

### 4.2 Delivery ledger (`NotificationDelivery`)

Replaces the `Notification`-as-send-log pattern from PR #209. One row per attempted delivery.

Gives us, in one table: idempotency (unique `dedupeKey`), cadence math ("when did we last send them this?"), frequency capping ("how many nudges this week?"), and metrics (opens/clicks via Resend webhooks).

Existing `Notification` goes back to meaning exactly one thing: **a row in the in-app bell.**

### 4.3 Preferences (`NotificationPreference`)

Not 41 toggles. **7 categories**, each with a cadence choice:

| Category | Covers | Default | Suppressible |
|---|---|---|---|
| `ACCOUNT` | Magic link, security | Instant | **No** |
| `YOUR_WRITING` | Deadlines, draft nudges, remember-to-write | Instant | Yes |
| `FEEDBACK` | Comments, replies on your work | Instant | Yes |
| `YOUR_CLUB` | Members joining, riffs starting, others submitting | Daily digest | Yes |
| `READING` | Unread pieces, comment nudges, jams | Daily digest | Yes |
| `RECAPS` | Riff/club recaps, milestones | Instant | Yes |
| `MARKETING` | Product news | Instant | Yes |

Per-category cadence: **Instant / Daily / Weekly / Off**. Plus the existing master switch, kept as an override.

The insight: users don't want granular control, they want *escape from the specific thing that annoyed them*. Seven categories is enough resolution to stop someone nuking their whole notification profile over one bad nudge — and few enough that the settings page stays a screen, not a spreadsheet.

Keep `User.emailNotifications` and `User.emailMarketing` as-is and backfill from them, so nothing breaks mid-migration.

### 4.4 Digest engine

The bet that makes "way more notifications" compatible with "not spam."

- Notifications marked `delivery: "digest"` enqueue instead of sending.
- One daily cron per timezone bucket assembles each user's pending items into **one email**, ordered by priority, with the highest-priority item's CTA as the primary button.
- Weekly-cadence users get a Sunday roll-up.
- `delivery: "instant"` bypasses the digest entirely. That list is short and should stay short: **A1 magic link, A2 welcome, B2 club invitation, C1/C2 riff created/started, E1 pieces revealed, D6 deadline today, F2 first comment, G2 recap.** Everything else waits for the bundle.

One good digest beats six mediocre emails, and it's the difference between a user who skims Riff every morning and a user who filters us to a folder.

### 4.5 Frequency caps

Applied after the digest is assembled, before send:

- `transactional` (magic link, invitations, deadline-day): **uncapped**.
- `social` (someone did something involving you): max 1/day.
- `nudge` (we want you to do something): max 1/day, **max 3/week**.
- Never more than 2 total emails to one user in 24h, excluding transactional.
- When multiple qualify, highest `priority` wins; losers stay queued for tomorrow rather than being dropped.

### 4.6 Channel abstraction

```ts
await deliver({ userId, key: "UNREAD_PIECES_IN_RIFF", context: { riffId }, });
```

`deliver()` resolves prefs → checks caps → checks ledger for dupes → fans out to enabled channels → writes ledger rows. Call sites never touch Resend, and they never change again when push arrives.

**Push path, when we get there**: web push (VAPID) first since it's free and works on installed PWAs including iOS 16.4+; APNs/FCM when there's a native app. Same registry, same categories, same ledger — only a new adapter behind `deliver()`.

### 4.7 Email delivery hygiene

Unglamorous, non-optional, and cheap:

- **One-click unsubscribe**: signed token route + `List-Unsubscribe` and `List-Unsubscribe-Post` headers. Highest priority item in Phase 1 — bad unsubscribe UX drives spam reports, and spam reports break magic-link deliverability, which breaks *login*.
- **Plaintext alternative** on every send.
- **Preheader text** per notification (currently inbox previews leak markup).
- **Resend webhooks** → `NotificationDelivery` for opens/clicks/bounces/complaints.
- **Subdomain split**: transactional (`auth.letsriff.app`) separate from bulk (`mail.letsriff.app`), so a bad nudge campaign can never take down magic links.
- **Suppression list** honoring hard bounces and complaints.

---

## 5. Schema changes

All of this needs Kyle's sign-off before any migration (per `CLAUDE.md`). Grouped by which phase needs them.

**Phase 1 — foundation**
```prisma
model User {
  timezone   String?    // IANA, captured at onboarding via Intl API
  lastSeenAt DateTime?  // dormancy detection — not derivable today
}

model NotificationPreference {
  id       String
  userId   String
  category NotificationCategory
  cadence  NotificationCadence  // INSTANT | DAILY | WEEKLY | OFF
  emailEnabled Boolean @default(true)
  pushEnabled  Boolean @default(true)
  @@unique([userId, category])
}

model NotificationDelivery {
  id           String
  userId       String
  key          String          // registry key
  channel      String          // "email" | "push" | "inApp"
  dedupeKey    String          // e.g. "UNREAD_PIECES:riff123:send2"
  capClass     String
  riffId       String?
  pieceId      String?
  commentId    String?
  sentAt       DateTime
  providerId   String?         // Resend message id
  openedAt     DateTime?
  clickedAt    DateTime?
  status       String
  @@unique([dedupeKey])
  @@index([userId, sentAt])
  @@index([key, sentAt])
}
```

**Phase 2 — the Read loop**
```prisma
model Piece {
  commentsLastSeenAt DateTime?  // author's last visit to their own comments → unlocks F3
}
```
One column, and it's the cheapest possible way to unlock F3. A full `CommentRead` join table would be more precise but isn't worth it until per-comment read state has a UI to drive it.

**Phase 3 — recap**
```prisma
model RiffRecap {
  riffId      String @unique
  stats       Json      // computed superlatives, cached
  generatedAt DateTime
}
```
Recap stats are expensive aggregations across pieces, reads, and comments. Compute once on riff completion, cache, serve from cache forever — the underlying riff is immutable by then.

---

## 6. Riff Recapped ⭐

The Spotify Wrapped moment, and the most distinctive thing in this document. Not a retention tactic — a **reason the club exists**. It's what turns "we all wrote essays" into "we did something together."

### 6.1 Shape

**Email teases, page delivers.** The email is a short, gorgeous hook with 2–3 headline numbers and one button. The payoff lives at `/riffs/[id]/recap` — full-screen, scroll-driven, brutalist, shareable. That's the Wrapped pattern, and it works because the page is shareable in a way an email never is.

### 6.2 Content — all computable from existing data

**Your riff**
- Words you wrote · your piece's read count · comments you received
- Days from joining to submitting
- How many of your clubmates' pieces you read (with a nudge if <100%)

**The club's riff**
- Total words across all pieces · pieces submitted · comments left · reads logged
- Date range, volume number, the prompt itself

**Superlatives** — each one a named person, which is what makes them fun:

| Award | Computed from |
|---|---|
| Longest piece | `max(Piece.wordCount)` |
| Most read | `count(PieceRead)` per piece |
| Most discussed | `count(Comment)` per piece |
| Most generous reader | `count(PieceRead)` per user |
| Most generous commenter | `count(Comment)` per user |
| First one in | `min(PieceRiff.submittedAt)` |
| Down to the wire | `submittedAt` closest to `deadline` |
| The night owl | latest-hour `submittedAt` |

**"The line that landed"** ⭐ — the single most Riff-specific thing we could possibly ship. `Comment.selectedText` already stores the exact passage people highlighted. Surface the most-commented-on passage in the whole riff as a pull quote:

> *"He had never once considered that the lighthouse might be lonely too."*
> — Maya, *The Lighthouse Keeper's Daughter* · 6 people highlighted this

No other writing platform can do this, because no other platform anchors comments to selected text the way Riff does. This is the screenshot people send to their friends.

**Your reading list** — pieces from this riff you never opened, with covers. The recap doubles as the last, most graceful E2.

### 6.3 Club Recapped (G3)

Quarterly or annual, club-wide: volumes completed, total words, participation streaks, your most-read piece of the year, who you read most, who read you most, the club's line of the year. Bigger production; do it after G2 proves out.

---

## 7. Copy & voice

PR #209 already set the bar correctly: **movie/song reference as the subject hook, plain and specific body, one clear CTA.** ("Great Scott — Vol. 4 closes in 5 days.") Keep it, and formalize it.

Rules:
1. **Multiple variants per notification, rotated by send number.** A repeat nudge must never repeat the same joke — that's what makes recurring email feel automated.
2. **The hook is playful; the body is specific.** Real names, real titles, real numbers, real dates. Specificity is what proves a human system noticed you.
3. **One CTA.** Never two buttons.
4. **Never guilt about ability, only about reciprocity.** "You haven't written yet" is fine. "Nobody read your piece" is not.
5. **Preheader is a second hook, not a truncated subject.**
6. **Subjects under 45 characters** — mobile truncation, and they're the future push titles.
7. **Escalating urgency, never escalating pressure.** #209's tiered deadline copy is the model.

Copy lives in the registry, not in template functions, so variants and future A/B tests are data changes.

---

## 8. Metrics

Per notification key, tracked in `NotificationDelivery`:

- Sent · delivered · bounced
- **Open rate** (directional only — Apple Mail Privacy Protection inflates it)
- **Click rate** — the real engagement signal
- **⭐ Action rate**: did the recipient perform the target action within 48h? Submitted a piece, read a piece, left a comment. This is the only metric that matters, and it's why the ledger stores `riffId`/`pieceId` — attribution needs the context.
- Unsubscribe rate per key, and category-level opt-out rate

**Kill criteria**: any notification with <5% action rate or >0.5% unsubscribe rate after 200 sends gets cut or rewritten. Shipping 26 new notifications is only defensible if we're equally willing to delete the ones that don't earn their place.

**North-star metrics** the whole system is optimizing:
1. Riff completion rate (% of joiners who submit)
2. **Read-through rate (% of revealed pieces actually read)** — the number the Read loop exists to move
3. Comments per piece
4. Club survival rate (% of clubs that start a second volume)

---

## 9. Rollout

Sequenced so unglamorous foundation lands before volume, and so nothing collides with the 5 open PRs.

### Phase 0 — unblock (now)
Merge **PR #209** as-is. Don't hold three good notifications hostage to this document. Note in the PR that its `Notification`-as-log pattern migrates to the ledger in Phase 1.

⚠️ **Merge-order hazard**: PRs #209 and #174 both modify `src/lib/resend.ts`. Phase 1 refactors that file substantially. Land both PRs before starting Phase 1, or expect painful conflicts.

### Phase 1 — foundation (no new user-facing notifications)
Registry · ledger · preference model + 7-category settings UI · timezone + `lastSeenAt` · digest engine · frequency caps · `deliver()` abstraction · one-click unsubscribe + `List-Unsubscribe` · plaintext + preheaders · Resend webhooks. Migrate all 15 existing/in-flight emails onto the new rails.

Ships zero visible features and makes everything after it possible. If we skip it, Phase 2 lands 7 more standalone emails on a system with no cap and one unsubscribe button, and users will make us regret it.

### Phase 2 — the Read loop ⭐ (the point of all this)
**E2** unread pieces · **E3** one piece left · **E4** riff finished · **E5** first read · **F2** first comment · **F3** unread comments · **F4** replies · **F6** read-but-silent · **F7** reciprocity. Plus `Piece.commentsLastSeenAt`.

This is what Chris actually asked for and it's where the product changes.

### Phase 3 — Riff Recapped ⭐
Recap page · `RiffRecap` caching · G1 riff completed · G2 recap email · "the line that landed" · share affordances.

### Phase 4 — lifecycle & hosts
A3–A6 onboarding and host activation · H1 dormant club · H2/H3 win-back · C5 social proof · D5 cold draft · D6 deadline day · D7 missed it · B4 · D3 → digest.

### Phase 5 — push
Web push (VAPID) behind the same registry. Service worker, permission prompt timed to a high-intent moment (right after a first comment lands, never on first load), push toggles in the existing 7 categories.

### Phase 6 — Club Recapped
Annual/quarterly club recap. I2 public-read milestones. I1 jam digest. A/B testing on copy variants.

---

## 10. Open decisions

Needs answers before Phase 1 starts:

1. **Kyle's sign-off on the schema** — 2 new models + 3 columns. Migration coordination per `CLAUDE.md`.
2. **Digest-default or instant-default?** This PRD proposes digest-default for `YOUR_CLUB` and `READING`, instant for `FEEDBACK`. Defaults matter more than the toggles.
3. **E6** — accept the recommendation to never tell an author they went unread?
4. **React Email or keep hand-rolled HTML?** Current `emailShell` is good and battle-tested. React Email is a better authoring experience at 41 templates but is a real migration. Recommendation: keep `emailShell`, extract copy to the registry, revisit at Phase 4.
5. **Send-time**: fixed 8am local, or learn per-user open times later?
6. **Resend volume/pricing** at ~10x current send volume.
7. **Does D3 (piece submitted) become a digest?** It's currently instant and in an active club it's the noisiest email we send.

---

## Appendix — files this touches

| File | Role |
|---|---|
| `src/lib/resend.ts` | 727 lines, 12 send fns → becomes renderer + shell only |
| `src/lib/notifications.ts` | 81 lines, in-app only → grows into `notifications/` module |
| `src/lib/engagement-reminders.ts` | PR #209 — first recurring engine, migrates to registry |
| `src/app/api/cron/daily-comment-notifications/route.ts` | Folds into unified digest cron |
| `src/app/api/cron/engagement-reminders/route.ts` | PR #209 — folds into unified cron |
| `src/app/api/users/me/email-preferences/route.ts` | Extends to category prefs |
| `src/components/account/EmailSection.tsx` | 2 toggles → 7 categories with cadence |
| `prisma/schema.prisma` | 2 models, 3 columns, 2 enums |
| `vercel.json` | Cron consolidation |
