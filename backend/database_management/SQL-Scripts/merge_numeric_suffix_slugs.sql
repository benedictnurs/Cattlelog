BEGIN;

-- 1) Build mapping between suffixed professors and their canonical base-slug professors
CREATE TEMP TABLE professor_slug_pairs AS
WITH suffixed AS (
    SELECT p.professor_id AS duplicate_id,
           p.slug          AS suffixed_slug,
           regexp_replace(p.slug, '-[0-9]+$', '') AS base_slug
    FROM professors p
    WHERE p.slug ~ '-[0-9]+$'
    AND p.slug <> 'hao-chen-1' 
),
paired AS (
    SELECT s.duplicate_id,
           s.suffixed_slug,
           b.professor_id AS canonical_id
    FROM suffixed s
    JOIN professors b
      ON b.slug = s.base_slug
)
SELECT *
FROM paired;

-- Optional but good for performance if the tables are large
CREATE INDEX ON professor_slug_pairs(duplicate_id);
CREATE INDEX ON professor_slug_pairs(canonical_id);

-- 2) Repoint reviews.professor_id from duplicate -> canonical
UPDATE reviews r
SET professor_id = p.canonical_id
FROM professor_slug_pairs p
WHERE r.professor_id = p.duplicate_id;

-- 3) Repoint classes_professors.professor_id, handling unique (professor_id, course_id)

-- 3a) If moving a duplicate row would collide with an existing canonical (professor_id, course_id),
--     drop the duplicate row first so the UPDATE won’t violate the unique constraint.
DELETE FROM classes_professors cp
USING professor_slug_pairs p,
      classes_professors canonical
WHERE cp.professor_id = p.duplicate_id
  AND canonical.professor_id = p.canonical_id
  AND canonical.course_id    = cp.course_id;

-- 3b) Now safely update remaining rows to point to the canonical professor_id
UPDATE classes_professors cp
SET professor_id = p.canonical_id
FROM professor_slug_pairs p
WHERE cp.professor_id = p.duplicate_id;

-- 4) Delete the suffixed professor rows now that their references are moved
DELETE FROM professors pr
USING professor_slug_pairs p
WHERE pr.professor_id = p.duplicate_id
  AND NOT EXISTS (SELECT 1 FROM classes_professors cp WHERE cp.professor_id = p.duplicate_id)
  AND NOT EXISTS (SELECT 1 FROM reviews r           WHERE r.professor_id  = p.duplicate_id);

COMMIT;
