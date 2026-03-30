-- Insert any slugs from grades that are not yet in professors
BEGIN;

-- 1) Gather distinct missing slugs and a sample instructor_name
WITH missing AS (
    SELECT
        professor_slug,
        MAX(instructor_name) AS instructor_name  -- arbitrary pick
    FROM grades
    GROUP BY professor_slug
    HAVING professor_slug NOT IN (SELECT slug FROM professors)
)

-- 2) Insert new professor rows with defaults
INSERT INTO professors (
    professor_id,
    professor_name,
    profile_url,
    department,
    number_of_ratings,
    overall_rating,
    would_take_again_percentage,
    level_of_difficulty,
    slug
)
SELECT
    m.professor_slug AS professor_id,
    m.instructor_name,
    'N/A'            AS profile_url,
    'N/A'            AS department,
    '0'              AS number_of_ratings,
    0.0              AS overall_rating,
    '0%'             AS would_take_again_percentage,
    0.0              AS level_of_difficulty,
    m.professor_slug           AS slug
FROM missing m;

COMMIT;


