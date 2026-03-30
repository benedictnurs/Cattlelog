BEGIN;

ALTER TABLE professors
    DROP COLUMN IF EXISTS common_tags;

COMMIT;