-- PUT THE BATCH ID HERE
-- This script is used to back out the addition of the 'review' and 'course_title' columns to the 'classes_professors' table.
UPDATE classes_professors cp
SET course_title = l.prev_course_title,
    one_review   = l.prev_one_review
FROM classes_professors_update_log l
WHERE l.batch_id = 'PUT-UPDATE-BATCH-ID'
  AND l.professor_id = cp.professor_id
  AND l.course_id    = cp.course_id;

DELETE FROM classes_professors_update_log
WHERE batch_id = 'PUT-UPDATE-BATCH-ID';

DROP TABLE IF EXISTS classes_professors_insert_log;