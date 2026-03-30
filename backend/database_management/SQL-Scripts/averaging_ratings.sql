BEGIN;

WITH stats AS (
    SELECT
        professor_id,
        ROUND(CAST(AVG(quality_rating)    AS numeric), 1) AS avg_quality,
        ROUND(CAST(AVG(difficulty_rating) AS numeric), 1) AS avg_difficulty,
        COUNT(*)                                       AS reviews_count
    FROM reviews
    GROUP BY professor_id
)
UPDATE professors p
SET
    overall_rating     = s.avg_quality,
    level_of_difficulty = s.avg_difficulty,
    number_of_ratings  = s.reviews_count
FROM stats s
WHERE p.professor_id = s.professor_id;

COMMIT;