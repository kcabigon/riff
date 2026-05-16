-- Drop EmailQueue table and related constraints
-- Reverting email batching infrastructure (not supported on Vercel Hobby tier)

DROP TABLE IF EXISTS "email_queue";
