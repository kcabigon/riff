-- Drop original circle tables that were missed by the previous migration.
-- The prior migration only dropped the renamed *_deprecated tables,
-- but the shadow database creates tables with their original names.
DROP TABLE IF EXISTS "piece_shares";
DROP TABLE IF EXISTS "circle_members";
DROP TABLE IF EXISTS "circles";
