BEGIN;
ALTER TABLE classes_professors
    ADD COLUMN IF NOT EXISTS one_review TEXT;

UPDATE classes_professors
SET one_review = COALESCE(
        (
            SELECT r.review
            FROM reviews AS r
            WHERE
                r.course_id = classes_professors.course_id
              AND r.professor_id = classes_professors.professor_id
            ORDER BY random()
            LIMIT 1
        ),
        'No course-specific reviews found for this professor.'
    )
WHERE one_review IS NULL;

COMMIT;
