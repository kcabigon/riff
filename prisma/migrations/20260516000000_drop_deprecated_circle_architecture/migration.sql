-- Drop deprecated Circle architecture tables and columns
-- Order: drop columns/constraints first, then tables, then enums

-- 1. Drop deprecated columns (removes foreign key constraints automatically)
ALTER TABLE "comments" DROP COLUMN IF EXISTS "circleId";
ALTER TABLE "collections" DROP COLUMN IF EXISTS "circleId";
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "circleId";
ALTER TABLE "users" DROP COLUMN IF EXISTS "password";

-- 2. Drop deprecated tables (order matters: children before parents)
-- Handle both original and renamed table names
DROP TABLE IF EXISTS "piece_shares";
DROP TABLE IF EXISTS "piece_shares_deprecated";
DROP TABLE IF EXISTS "circle_prompts";
DROP TABLE IF EXISTS "circle_members";
DROP TABLE IF EXISTS "circle_members_deprecated";
DROP TABLE IF EXISTS "circles";
DROP TABLE IF EXISTS "circles_deprecated";

-- 3. Drop deprecated enum types
DROP TYPE IF EXISTS "CircleMemberRole";
DROP TYPE IF EXISTS "PromptVisibilityRule";
