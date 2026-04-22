# Kyle — Action Items

_Updated 2026-04-21. Things blocking the team or waiting on you specifically._

---

## 1. Review & merge PR #72 — club page DB query optimization

**PR**: `perf/club-page-db-queries` → develop  
**Author**: Jarric  
**What it does**: Cuts the club page from 5 sequential queries to 4 queries across 2 round trips by merging the membership check into the club query and parallelizing the rest with `Promise.all`. Before: 3 sequential round trips. After: 2.

**Your specific flag**: Line 106 has a non-null assertion (`!`) that's intentional — TypeScript can't infer that `club.members` always contains the current user if `club` is non-null, but it's guaranteed by the Prisma filter. Jarric flagged it for your eyes.

---

## 2. Add `Jam` and `JamRead` models to schema

The Jams front-end UI (PR #73) is merged and waiting on a backend. You need to add these two models to `prisma/schema.prisma` and create the migration.

**Suggested schema:**

```prisma
model Jam {
  id        String   @id @default(cuid())
  userId    String
  content   String                    // "What are you into" — short headline
  note      String   @db.Text         // "Why" — up to 250 words
  url       String?                   // Optional link
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  reads     JamRead[]
}

model JamRead {
  id     String   @id @default(cuid())
  jamId  String
  userId String
  readAt DateTime @default(now())

  jam    Jam      @relation(fields: [jamId], references: [id], onDelete: Cascade)
  user   User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([jamId, userId])
}
```

**Also add to `User` model:**
```prisma
jams     Jam[]
jamReads JamRead[]
```

**After schema**: Team will wire up `POST /api/jams`, `GET /api/users/[id]/jams`, and connect the profile page server component.

---

## 3. [Suggestion — please vet] Fix Supabase connection pool — switch to Transaction mode

**Context**: Intermittent `MaxClientsInSessionMode: max clients reached` errors have been showing up (seen on the read page, possibly elsewhere). This is a pattern consistent with PgBouncer running in Session mode — it holds a dedicated connection per client, and serverless functions spinning up in parallel can exhaust the pool. **Please verify this matches what you're seeing in the Supabase dashboard before making any changes.**

**Suggested fix** (2 minutes in Supabase dashboard + env var update):
1. In Supabase project settings → Database → Connection Pooling → switch mode to **Transaction**
2. Update `DATABASE_URL` in all environments (local `.env.development`, Vercel staging + prod) to use port **6543** instead of 5432, and append `?pgbouncer=true&connection_limit=1`
3. No code changes needed — Riff doesn't use interactive Prisma transactions, so the switch should be safe

---

## 4. Set `CRON_SECRET` in Vercel project settings

Required for the daily comment digest cron (`/api/cron/daily-comment-notifications`) from PR #59 to work in production. Derek flagged this in the PR notes.
