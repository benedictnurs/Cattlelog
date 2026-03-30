BEGIN;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS average_gpa NUMERIC(3,2);
WITH per_course AS (
    SELECT g.course_id,
           SUM(COALESCE(g.grade_distribution->>'A+','0')::int) AS a_plus,
           SUM(COALESCE(g.grade_distribution->>'A','0')::int)  AS a_cnt,
           SUM(COALESCE(g.grade_distribution->>'A-','0')::int) AS a_minus,
           SUM(COALESCE(g.grade_distribution->>'B+','0')::int) AS b_plus,
           SUM(COALESCE(g.grade_distribution->>'B','0')::int)  AS b_cnt,
           SUM(COALESCE(g.grade_distribution->>'B-','0')::int) AS b_minus,
           SUM(COALESCE(g.grade_distribution->>'C+','0')::int) AS c_plus,
           SUM(COALESCE(g.grade_distribution->>'C','0')::int)  AS c_cnt,
           SUM(COALESCE(g.grade_distribution->>'C-','0')::int) AS c_minus,
           SUM(COALESCE(g.grade_distribution->>'D+','0')::int) AS d_plus,
           SUM(COALESCE(g.grade_distribution->>'D','0')::int)  AS d_cnt,
           SUM(COALESCE(g.grade_distribution->>'D-','0')::int) AS d_minus,
           SUM(COALESCE(g.grade_distribution->>'F','0')::int)  AS f_cnt
    FROM grades g GROUP BY g.course_id
), avg_by_course AS (
    SELECT course_id,
           ROUND((
                 a_plus*4.0 + a_cnt*4.0 + a_minus*3.7 +
                 b_plus*3.3 + b_cnt*3.0 + b_minus*2.7 +
                 c_plus*2.3 + c_cnt*2.0 + c_minus*1.7 +
                 d_plus*1.3 + d_cnt*1.0 + d_minus*0.7 +
                 f_cnt*0.0
               )::numeric / NULLIF(
                 a_plus + a_cnt + a_minus +
                 b_plus + b_cnt + b_minus +
                 c_plus + c_cnt + c_minus +
                 d_plus + d_cnt + d_minus +
                 f_cnt, 0), 2) AS avg_gpa
    FROM per_course
)
UPDATE courses c SET average_gpa = a.avg_gpa FROM avg_by_course a WHERE a.course_id = c.course_id;
COMMIT;
