-- Database query time should be around 2 minutes

BEGIN;

-- add the new column (text array)
ALTER TABLE professors
    ADD COLUMN IF NOT EXISTS common_tags TEXT[];

-- populate from reviews -> get tags -> count -> pick top 3
UPDATE professors AS p
SET common_tags = COALESCE(
        (
            SELECT array_agg(sub.tag ORDER BY sub.cnt DESC)
            FROM (
                     SELECT u.tag
                          , COUNT(*) AS cnt
                     FROM reviews AS r
                              -- expand the tags array into rows
                              JOIN LATERAL unnest(r.tags) AS u(tag) ON TRUE
                     WHERE r.professor_id = p.professor_id
                     GROUP BY u.tag
                     ORDER BY cnt DESC
                     LIMIT 3
                 ) AS sub
        ),
        ARRAY[]::TEXT[]    -- default to empty array when no tags
    );

COMMIT;
