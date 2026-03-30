-- Database query time should be almost instant

BEGIN;

-- add the new column
ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS average_gpa NUMERIC(3,2);

-- compute & fill average_gpa
UPDATE courses AS c
SET average_gpa = sub.avg_gpa
FROM (
         -- aggregate across all grade rows per course
         SELECT
             course_id,
             -- weighted avg: sum(count * weight) / sum(count)
             CASE
                 WHEN SUM(cnt) = 0 THEN NULL
                 ELSE ROUND(SUM(cnt * weight)::NUMERIC / SUM(cnt), 2)
                 END AS avg_gpa
         FROM (
                  SELECT
                      g.course_id,
                      (value::INT) AS cnt,
                      -- map grade string -> numeric weight
                      CASE key
                          WHEN 'A+' THEN 4.0 WHEN 'A'  THEN 4.0 WHEN 'A-' THEN 3.7
                          WHEN 'B+' THEN 3.3 WHEN 'B'  THEN 3.0 WHEN 'B-' THEN 2.7
                          WHEN 'C+' THEN 2.3 WHEN 'C'  THEN 2.0 WHEN 'C-' THEN 1.7
                          WHEN 'D+' THEN 1.3 WHEN 'D'  THEN 1.0 WHEN 'D-' THEN 0.7
                          WHEN 'F'  THEN 0.0
                          ELSE NULL
                          END AS weight
                  FROM grades AS g
                           CROSS JOIN LATERAL jsonb_each_text(g.grade_distribution)
              ) AS unnested
         WHERE weight IS NOT NULL
         GROUP BY course_id
     ) AS sub
WHERE sub.course_id = c.course_id;

COMMIT;
