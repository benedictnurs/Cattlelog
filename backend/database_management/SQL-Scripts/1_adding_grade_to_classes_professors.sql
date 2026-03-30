-- This SQL script adds a new rows for grades into the classes_professors table

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS classes_professors_insert_log (
                                                             batch_id     uuid        NOT NULL,
                                                             professor_id varchar(50) NOT NULL,
                                                             course_id    varchar(20) NOT NULL,
                                                             inserted_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS classes_professors_insert_log_batch_id_idx
    ON classes_professors_insert_log (batch_id);


DO $$
    DECLARE
        v_batch uuid := gen_random_uuid();
    BEGIN
        WITH candidates AS (
            SELECT DISTINCT p.professor_id, g.course_id
            FROM grades g
                     JOIN professors p
                          ON trim(lower(p.professor_name)) = trim(lower(g.instructor_name))
            WHERE NOT EXISTS (
                SELECT 1 FROM professor_duplicates d
                WHERE trim(lower(d.professor_name)) = trim(lower(g.instructor_name))
            )
              AND g.course_id IS NOT NULL
        ),
             ins AS (
                 INSERT INTO classes_professors (professor_id, course_id, offered)
                     SELECT c.professor_id, c.course_id, FALSE
                     FROM candidates c
                     ON CONFLICT (professor_id, course_id) DO NOTHING
                     RETURNING professor_id, course_id
             )
        INSERT INTO classes_professors_insert_log (batch_id, professor_id, course_id)
        SELECT v_batch, professor_id, course_id
        FROM ins;

        RAISE NOTICE 'batch_id=%', v_batch;
    END $$;

