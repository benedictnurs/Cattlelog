SELECT
    ROUND(
            (
                SUM(COALESCE(grade_distribution->>'A+','0')::int) * 4.0 +
                SUM(COALESCE(grade_distribution->>'A' ,'0')::int) * 4.0 +
                SUM(COALESCE(grade_distribution->>'A-','0')::int) * 3.7 +
                SUM(COALESCE(grade_distribution->>'B+','0')::int) * 3.3 +
                SUM(COALESCE(grade_distribution->>'B' ,'0')::int) * 3.0 +
                SUM(COALESCE(grade_distribution->>'B-','0')::int) * 2.7 +
                SUM(COALESCE(grade_distribution->>'C+','0')::int) * 2.3 +
                SUM(COALESCE(grade_distribution->>'C' ,'0')::int) * 2.0 +
                SUM(COALESCE(grade_distribution->>'C-','0')::int) * 1.7 +
                SUM(COALESCE(grade_distribution->>'D+','0')::int) * 1.3 +
                SUM(COALESCE(grade_distribution->>'D' ,'0')::int) * 1.0 +
                SUM(COALESCE(grade_distribution->>'D-','0')::int) * 0.7 +
                SUM(COALESCE(grade_distribution->>'F' ,'0')::int) * 0.0
                )::numeric
                /
            NULLIF(
                    SUM(
                            COALESCE(grade_distribution->>'A+','0')::int +
                            COALESCE(grade_distribution->>'A' ,'0')::int +
                            COALESCE(grade_distribution->>'A-','0')::int +
                            COALESCE(grade_distribution->>'B+','0')::int +
                            COALESCE(grade_distribution->>'B' ,'0')::int +
                            COALESCE(grade_distribution->>'B-','0')::int +
                            COALESCE(grade_distribution->>'C+','0')::int +
                            COALESCE(grade_distribution->>'C' ,'0')::int +
                            COALESCE(grade_distribution->>'C-','0')::int +
                            COALESCE(grade_distribution->>'D+','0')::int +
                            COALESCE(grade_distribution->>'D' ,'0')::int +
                            COALESCE(grade_distribution->>'D-','0')::int +
                            COALESCE(grade_distribution->>'F' ,'0')::int
                    ),
                    0
            ),
            3
    ) AS campus_avg_gpa
FROM grades;


SELECT
    SUM(COALESCE(grade_distribution->>'A+','0')::int) AS "A+",
    SUM(COALESCE(grade_distribution->>'A' ,'0')::int) AS "A",
    SUM(COALESCE(grade_distribution->>'A-','0')::int) AS "A-",
    SUM(COALESCE(grade_distribution->>'B+','0')::int) AS "B+",
    SUM(COALESCE(grade_distribution->>'B' ,'0')::int) AS "B",
    SUM(COALESCE(grade_distribution->>'B-','0')::int) AS "B-",
    SUM(COALESCE(grade_distribution->>'C+','0')::int) AS "C+",
    SUM(COALESCE(grade_distribution->>'C' ,'0')::int) AS "C",
    SUM(COALESCE(grade_distribution->>'C-','0')::int) AS "C-",
    SUM(COALESCE(grade_distribution->>'D+','0')::int) AS "D+",
    SUM(COALESCE(grade_distribution->>'D' ,'0')::int) AS "D",
    SUM(COALESCE(grade_distribution->>'D-','0')::int) AS "D-",
    SUM(COALESCE(grade_distribution->>'F' ,'0')::int) AS "F"
FROM grades;

SELECT
    quarter,
    ROUND(
            (
                SUM(COALESCE(grade_distribution->>'A+','0')::int) * 4.0 +
                SUM(COALESCE(grade_distribution->>'A' ,'0')::int) * 4.0 +
                SUM(COALESCE(grade_distribution->>'A-','0')::int) * 3.7 +
                SUM(COALESCE(grade_distribution->>'B+','0')::int) * 3.3 +
                SUM(COALESCE(grade_distribution->>'B' ,'0')::int) * 3.0 +
                SUM(COALESCE(grade_distribution->>'B-','0')::int) * 2.7 +
                SUM(COALESCE(grade_distribution->>'C+','0')::int) * 2.3 +
                SUM(COALESCE(grade_distribution->>'C' ,'0')::int) * 2.0 +
                SUM(COALESCE(grade_distribution->>'C-','0')::int) * 1.7 +
                SUM(COALESCE(grade_distribution->>'D+','0')::int) * 1.3 +
                SUM(COALESCE(grade_distribution->>'D' ,'0')::int) * 1.0 +
                SUM(COALESCE(grade_distribution->>'D-','0')::int) * 0.7 +
                SUM(COALESCE(grade_distribution->>'F' ,'0')::int) * 0.0
                )::numeric
                /
            NULLIF(
                    SUM(
                            COALESCE(grade_distribution->>'A+','0')::int +
                            COALESCE(grade_distribution->>'A' ,'0')::int +
                            COALESCE(grade_distribution->>'A-','0')::int +
                            COALESCE(grade_distribution->>'B+','0')::int +
                            COALESCE(grade_distribution->>'B' ,'0')::int +
                            COALESCE(grade_distribution->>'B-','0')::int +
                            COALESCE(grade_distribution->>'C+','0')::int +
                            COALESCE(grade_distribution->>'C' ,'0')::int +
                            COALESCE(grade_distribution->>'C-','0')::int +
                            COALESCE(grade_distribution->>'D+','0')::int +
                            COALESCE(grade_distribution->>'D' ,'0')::int +
                            COALESCE(grade_distribution->>'D-','0')::int +
                            COALESCE(grade_distribution->>'F' ,'0')::int
                    ),
                    0
            ),
            3
    ) AS avg_gpa
FROM grades
GROUP BY quarter
ORDER BY quarter;
