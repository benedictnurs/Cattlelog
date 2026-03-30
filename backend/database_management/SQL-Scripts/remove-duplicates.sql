-- This script is used to remove duplicate professors and reassign their associated data in the database.
-- This is done manually to ensure that the correct professor is retained and all references are updated.
BEGIN;

DELETE FROM classes_professors cp_old
USING classes_professors cp_new
WHERE
  cp_old.professor_id = '12345'
  AND cp_new.professor_id = '67890'
  AND cp_old.course_id    = cp_new.course_id;

-- 2) reassign all classes_professors rows
UPDATE classes_professors
SET professor_id = '67890'
WHERE professor_id = '12345';

-- 3) reassign reviews
UPDATE reviews
SET professor_id = '67890'
WHERE professor_id = '12345';

UPDATE reviews
SET professor_id = '67890'
WHERE professor_id = '12345';

-- 4) delete the orphaned professor
DELETE FROM professors
WHERE professor_id = '12345';

COMMIT;