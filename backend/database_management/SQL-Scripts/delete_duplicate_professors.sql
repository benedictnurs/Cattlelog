BEGIN;

-- 1) Build mapping from "duplicate" professor_ids to the canonical numeric professor_id
--    for each LOWER(professor_name), EXCEPT "hao chen".

CREATE TEMP TABLE prof_merge_map AS
WITH base AS (
    SELECT
        p.professor_id,
        p.slug,
        LOWER(BTRIM(p.professor_name)) AS name_key
    FROM professors p
    WHERE LOWER(BTRIM(p.professor_name)) <> 'hao chen' -- skip Hao Chen
),
numeric AS (
    -- Only rows whose professor_id is all digits are eligible as canonical
    SELECT *
    FROM base
    WHERE professor_id ~ '^[0-9]+$'
),
canonical AS (
    -- Pick one canonical numeric professor per name_key (smallest numeric id)
    SELECT DISTINCT ON (name_key)
           name_key,
           professor_id AS canonical_id,
           slug        AS canonical_slug
    FROM numeric
    ORDER BY name_key, professor_id::bigint
)
SELECT
    d.professor_id AS duplicate_id,
    d.slug         AS duplicate_slug,
    c.canonical_id,
    c.canonical_slug
FROM base d
JOIN canonical c USING (name_key)
WHERE d.professor_id <> c.canonical_id;

-- Optional indexes for performance
CREATE INDEX ON prof_merge_map(duplicate_id);
CREATE INDEX ON prof_merge_map(canonical_id);
CREATE INDEX ON prof_merge_map(duplicate_slug);

-- 2) classes_professors:
--    Delete rows that would become duplicates after we switch to canonical_id.
DELETE FROM classes_professors cp
USING prof_merge_map m,
      classes_professors existing
WHERE cp.professor_id = m.duplicate_id
  AND existing.professor_id = m.canonical_id
  AND existing.course_id    = cp.course_id;

-- 3) Now safely update remaining rows to the canonical professor_id.
UPDATE classes_professors cp
SET professor_id = m.canonical_id
FROM prof_merge_map m
WHERE cp.professor_id = m.duplicate_id;

-- 4) grades:
--    Update slug from the duplicate professor’s slug to the canonical professor’s slug.
UPDATE grades g
SET slug = m.canonical_slug
FROM prof_merge_map m
WHERE g.slug = m.duplicate_slug;

-- 5) Delete the duplicate professor rows.
DELETE FROM professors p
USING prof_merge_map m
WHERE p.professor_id = m.duplicate_id;

COMMIT;
