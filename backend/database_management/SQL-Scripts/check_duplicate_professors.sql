-- 1) Names with more than one professor_id in professors
SELECT LOWER(professor_name) AS name_key,
       array_agg(professor_id ORDER BY professor_id) AS professor_ids,
       COUNT(*) AS cnt
FROM professors
GROUP BY LOWER(professor_name)
HAVING COUNT(*) > 1
ORDER BY cnt DESC, name_key ASC;

-- 2) Rows whose name is in professor_duplicates but professor_id != canonical
SELECT d.professor_name,
       d.professor_id AS canonical_id,
       p.professor_id AS current_id
FROM professor_duplicates d
JOIN professors p ON LOWER(p.professor_name) = LOWER(d.professor_name)
WHERE p.professor_id <> d.professor_id
ORDER BY d.professor_name;

-- 3) professor_duplicates entries with no matching row in professors (by name)
SELECT d.professor_name, d.professor_id AS canonical_id
FROM professor_duplicates d
LEFT JOIN professors p ON LOWER(p.professor_name) = LOWER(d.professor_name)
WHERE p.professor_id IS NULL
ORDER BY d.professor_name;

-- 4) Slug collisions (same slug used by multiple professor_ids)
SELECT slug, array_agg(professor_id ORDER BY professor_id) AS ids, COUNT(*) AS cnt
FROM professors
WHERE slug IS NOT NULL AND slug <> ''
GROUP BY slug
HAVING COUNT(*) > 1
ORDER BY cnt DESC, slug ASC;
