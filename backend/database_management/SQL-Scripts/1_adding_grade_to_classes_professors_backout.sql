-- PUT THE BATCH ID HERE
-- This script is used to back out the addition of the 'grade' column to the 'classes_professors' table.

SELECT cp.*
FROM classes_professors cp
         JOIN classes_professors_insert_log l
              ON l.professor_id = cp.professor_id
                  AND l.course_id    = cp.course_id
WHERE l.batch_id = 'PUT-BATCH-ID-HERE';

DELETE FROM classes_professors cp
    USING classes_professors_insert_log l
WHERE l.batch_id     = 'PUT-BATCH-ID-HERE'
  AND l.professor_id = cp.professor_id
  AND l.course_id    = cp.course_id;

DROP TABLE IF EXISTS classes_professors_insert_log;