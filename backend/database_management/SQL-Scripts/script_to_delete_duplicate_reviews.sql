-- build the same keep_ids list
-- just to check what would be deleted
CREATE TEMP TABLE keep_ids AS
SELECT MIN(id) AS id
FROM reviews
WHERE review <> 'No Comments'
GROUP BY
  professor_id,
  course_id,
  professor_name,
  quality_rating,
  difficulty_rating,
  review;

INSERT INTO keep_ids (id)
SELECT id
FROM reviews
WHERE review = 'No Comments';

-- see what would be deleted
SELECT r.*
FROM reviews r
LEFT JOIN keep_ids k
  ON r.id = k.id
WHERE k.id IS NULL
ORDER BY r.professor_id, r.course_id;

-- if you just want a count:
SELECT COUNT(*) AS rows_to_delete
FROM reviews r
LEFT JOIN keep_ids k
  ON r.id = k.id
WHERE k.id IS NULL;


-- build keep list
-- actual deletion of duplicates
BEGIN;
CREATE TEMP TABLE keep_ids AS
SELECT MIN(id) AS id
FROM reviews
WHERE review <> 'No Comments'
GROUP BY
  professor_id,
  course_id,
  professor_name,
  quality_rating,
  difficulty_rating,
  review;

INSERT INTO keep_ids (id)
SELECT id FROM reviews WHERE review = 'No Comments';

CREATE INDEX ON keep_ids (id);

-- delete everything except keep_ids
BEGIN;
DELETE FROM reviews r
WHERE NOT EXISTS (
  SELECT 1 FROM keep_ids k WHERE k.id = r.id
);
COMMIT;