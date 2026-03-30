CREATE TABLE professor_duplicates (
                                          professor_id   VARCHAR    PRIMARY KEY
                                              REFERENCES professors(professor_id),
                                          professor_name TEXT       NOT NULL
);


INSERT INTO professor_duplicates (professor_id, professor_name)
VALUES
    ('871199', 'Hao Chen'),
    ('1842882', 'Hao Chen')
;


-- 1) How big is the table?
SELECT COUNT(*) AS total_reviews
FROM reviews;

-- 2) How many exact‐duplicate groups?
SELECT
    COUNT(*) AS dup_groups
FROM (
         SELECT
             COUNT(*)
         FROM reviews
         GROUP BY
             professor_id,
             course_id,
             professor_name,
             quality_rating,
             difficulty_rating,
             review
         HAVING COUNT(*) > 1
     ) t;
