BEGIN;

ALTER TABLE classes_professors
    DROP COLUMN IF EXISTS one_review;

COMMIT;
