-- This SQL script adds reviews and course titles to the classes_professors table
CREATE TABLE IF NOT EXISTS classes_professors_update_log (
                                                             batch_id         uuid        NOT NULL,
                                                             professor_id     varchar(50) NOT NULL,
                                                             course_id        varchar(20) NOT NULL,
                                                             prev_course_title text,
                                                             prev_one_review   text,
                                                             new_course_title  text,
                                                             new_one_review    text,
                                                             updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS classes_professors_update_log_batch_id_idx
    ON classes_professors_update_log (batch_id);


DO $$
    DECLARE v_batch uuid := gen_random_uuid();
    BEGIN
        WITH targets AS (
            SELECT
                cp.professor_id,
                cp.course_id,
                cp.course_title AS prev_course_title,
                cp.one_review   AS prev_one_review,
                c.course_title  AS desired_title,
                (
                    SELECT r.review
                    FROM reviews r
                    WHERE r.professor_id = cp.professor_id
                      AND r.course_id    = cp.course_id
                      AND r.review IS NOT NULL
                      AND length(trim(r.review)) > 0
                    ORDER BY random()
                    LIMIT 1
                ) AS desired_review
            FROM classes_professors cp
                     LEFT JOIN courses c ON c.course_id = cp.course_id

            WHERE cp.course_title IS NULL OR cp.one_review IS NULL
        ),
             upd AS (
                 UPDATE classes_professors cp
                     SET course_title = COALESCE(t.desired_title, cp.course_title),
                         one_review   = COALESCE(t.desired_review,
                                                 'No course-specific reviews found for this professor.')
                     FROM targets t
                     WHERE cp.professor_id = t.professor_id
                         AND cp.course_id    = t.course_id
                     RETURNING cp.professor_id, cp.course_id
             )
        INSERT INTO classes_professors_update_log (
            batch_id, professor_id, course_id,
            prev_course_title, prev_one_review,
            new_course_title, new_one_review
        )
        SELECT v_batch, t.professor_id, t.course_id,
               t.prev_course_title, t.prev_one_review,
               COALESCE(t.desired_title, t.prev_course_title),
               COALESCE(t.desired_review, 'No course-specific reviews found for this professor.')
        FROM targets t;

        RAISE NOTICE 'update_batch_id=%', v_batch;
    END $$;
