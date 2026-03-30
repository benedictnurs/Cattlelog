BEGIN;

-- 1) Add a temp column to hold the slugified instructor_name
ALTER TABLE grades
    ADD COLUMN instructor_slug TEXT;

-- 2) Populate it by lower‑casing and replacing spaces with dashes
UPDATE grades
SET instructor_slug = LOWER(
        regexp_replace(
                TRIM(instructor_name),
                '\s+',        -- one or more whitespace
                '-',          -- replace with dash
                'g'           -- global flag
        )
                      );

-- 3) Now update professor_slug by joining on that slug
UPDATE grades g
SET professor_slug = p.slug
FROM professors p
WHERE g.instructor_slug = p.slug;

-- 4) Check how many still didn’t match
SELECT COUNT(*) AS unmatched
FROM grades
WHERE professor_slug IS NULL;

-- (you can inspect a few of those to see e.g. punctuation differences)
SELECT instructor_name, instructor_slug
FROM grades
WHERE professor_slug IS NULL
LIMIT 20;

-- 5) If you’re happy with the matches, drop the temp column
ALTER TABLE grades
    DROP COLUMN instructor_slug;

-- 6) And (re)enforce NOT NULL if you need to
COMMIT;