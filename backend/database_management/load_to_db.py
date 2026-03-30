import json
import os
import re
from typing import Dict, List, Set, Tuple

try:
    import google.generativeai as genai
except Exception:
    genai = None
from ..server.database import get_db_connection

# Use this command to run this script:
# python -m backend.database_management.load_to_db

# PROFESSOR_FILE_PATH = "backend/data_pipelines/data/sample/ucdavis_professors_reviews.sample.json"
# COURSE_JSON_FILE_PATH = "backend/data_pipelines/data/sample/class_data/ucd_classes_202510.sample.json"
# GRADES_JSON_FILE_PATH = "backend/data_pipelines/data/sample/grades.sample.json"

PROFESSOR_FILE_PATH = "backend/data_pipelines/data/ucdavis_professors_reviews.json"
COURSE_JSON_FILE_PATH = "backend/data_pipelines/data/class_data/ucd_classes_winter_2026.json"
GRADES_JSON_FILE_PATH = "backend/data_pipelines/data/grades.json"

genai_key = os.getenv("GOOGLE_API_KEY")
if genai_key and genai is not None:
    try:
        genai.configure(api_key=genai_key)
    except Exception:
        genai_key = None


def slugify(name: str) -> str:
    """Create a lowercase, dash-separated slug from a name."""
    if not name:
        return ""
    s = name.strip().lower()
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"[^a-z0-9\-]", "", s)
    s = re.sub(r"-+", "-", s)
    return s

def load_data(
    update_courses: bool = False,
    update_quarter: bool = False,
    update_professors: bool = True,
    update_reviews: bool = True,
    update_grades: bool = False,
):
    """
    Main function to load data into the DB:
      0. Update 'offered' status for courses and professors
      1. Optionally load & insert course data, generate embeddings if missing.
      2. Optionally load & insert professor data, classes, and reviews.
      3. Optionally load & insert aggregated grade data from 'grades.json'.

    Parameters:
    - update_courses: whether to load/update 'courses' table
    - update_quarter: whether to refresh current‑quarter 'offered' flags
    - update_professors: whether to load/update 'professors' table (and 'reviews', 'classes_professors')
    - update_grades: whether to load/update 'grades' table
    - update_reviews: whether to load/update 'reviews' table used with update_professors
    """

    conn = get_db_connection()
    cursor = conn.cursor()

    # -------- Post-processing helpers (embedded SQL, no external shell) -------- #
    def _run_add_one_review():
        """Ensure classes_professors.one_review exists and is populated with a sample review per (professor_id, course_id)."""
        try:
            cursor.execute(
                """
                ALTER TABLE classes_professors
                    ADD COLUMN IF NOT EXISTS one_review TEXT;

                UPDATE classes_professors
                SET one_review = COALESCE(
                        (
                            SELECT r.review
                            FROM reviews AS r
                            WHERE r.course_id = classes_professors.course_id
                              AND r.professor_id = classes_professors.professor_id
                            ORDER BY random()
                            LIMIT 1
                        ),
                        'No course-specific reviews found for this professor.'
                    )
                """
            )
        except Exception as e:
            print(f"Post-processing (add one_review) skipped or failed: {e}")

    def _run_compute_course_gpa():
        """Compute and store courses.average_gpa from grades table."""
        try:
            cursor.execute(
                """
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
                """
            )
        except Exception as e:
            print(f"Post-processing (compute average_gpa) skipped or failed: {e}")

    # normalize names and resolve canonical professor_id from duplicates table
    def _norm_name(s: str) -> str:
        return re.sub(r"\s+", " ", (s or "").strip()).lower()

    professor_name_to_id = {}
    rows = []
    try:
        cursor.execute("SELECT professor_name, professor_id FROM professor_duplicates;")
        rows = cursor.fetchall()
    except Exception:
        try:
            cursor.execute('SELECT professor_name, professor_id FROM "professor duplicates";')
            rows = cursor.fetchall()
        except Exception:
            rows = []
    for name, pid in rows:
        professor_name_to_id[_norm_name(name)] = pid

    def resolve_professor_id_by_name(name: str):
        """
        Strict resolution order:
        1) professor_duplicates mapping by normalized name
        2) exact name match (case-insensitive equality)
        3) exact slug match
        4) create new row (id = slug)
        If a duplicates mapping exists but the row doesn't, create it.
        """
        norm = _norm_name(name)
        slug = slugify(name)

        # 1. Duplicates mapping: professor_name -> canonical professor_id
        mapped = professor_name_to_id.get(norm)
        if mapped:
            # Ensure the canonical professor row exists and has a slug
            cursor.execute(
                "SELECT professor_id, slug FROM professors WHERE professor_id = %s;",
                (mapped,),
            )
            row = cursor.fetchone()
            if row:
                # Backfill slug if it was NULL
                if not row[1]:
                    cursor.execute(
                        "UPDATE professors SET slug = %s WHERE professor_id = %s AND slug IS NULL;",
                        (slug, mapped),
                    )
                return mapped
            else:
                # Create a minimal canonical row using the mapped professor_id
                cursor.execute(
                    """
                    INSERT INTO professors (
                        professor_id, professor_name, profile_url, department,
                        number_of_ratings, overall_rating, would_take_again_percentage,
                        level_of_difficulty, slug
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (professor_id) DO NOTHING
                    RETURNING professor_id;
                    """,
                    (
                        mapped,
                        name,
                        "N/A",
                        "N/A",
                        "0",
                        0.0,
                        "0%",
                        0.0,
                        slug,
                    ),
                )
                result = cursor.fetchone()
                if result:
                    print(f"Created professor from duplicates mapping: {name} -> {mapped}")
                    return result[0]
                # Even if RETURNING didn't give a row, mapped is still the canonical id
                return mapped

        # 2. Exact name match (case-insensitive)
        cursor.execute(
            "SELECT professor_id FROM professors WHERE LOWER(professor_name) = LOWER(%s);",
            (name,),
        )
        row = cursor.fetchone()
        if row:
            return row[0]

        # 3. Slug match
        cursor.execute(
            "SELECT professor_id FROM professors WHERE slug = %s;",
            (slug,),
        )
        row = cursor.fetchone()
        if row:
            return row[0]

        # 4. Create a brand-new professor with slug as id
        professor_id = slug
        cursor.execute(
            """
            INSERT INTO professors (
                professor_id, professor_name, profile_url, department,
                number_of_ratings, overall_rating, would_take_again_percentage,
                level_of_difficulty, slug
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (professor_id) DO NOTHING
            RETURNING professor_id;
            """,
            (
                professor_id,
                name,
                "N/A",
                "N/A",
                "0",
                0.0,
                "0%",
                0.0,
                slug,
            ),
        )
        result = cursor.fetchone()
        if result:
            print(f"Created new professor: {name} (slug: {slug})")
            return result[0]
        return professor_id


    # ==================== 0. Update Offered ==================== #
    if update_quarter:
        cursor.execute("UPDATE courses SET offered = FALSE;")
        cursor.execute("UPDATE classes_professors SET offered = FALSE;")

        # Load current-quarter class feed
        with open(COURSE_JSON_FILE_PATH, "r", encoding="utf-8") as course_file:
            course_json_data = json.load(course_file)

        course_entries = [entry for sublist in course_json_data for entry in sublist]

        # Collect unique course IDs and professor relations
        offered_courses = set()
        professor_course_map = {}  # (professor_id, course_id) -> title 

        for course_entry in course_entries:
            course_info = course_entry.get("course", {})
            if not course_info:
                continue

            subject_code = course_info.get("subjectCode", "")
            course_num = course_info.get("courseNum", "").lstrip("0")
            course_id = f"{subject_code}{course_num}".upper()
            title = course_info.get("title", "")

            # Track unique course IDs
            offered_courses.add(course_id)

            # Process instructors
            instructors = course_entry.get("instructor", [])
            for instructor in instructors:
                instructor_name = instructor.get("fullName", "").strip()
                # Skip empty or whitespace-only names
                if not instructor_name:
                    continue
                
                professor_id = resolve_professor_id_by_name(instructor_name)
                # professor_id will always be set now (creates if not found)
                professor_course_map[(professor_id, course_id)] = title

        # Batch update courses
        print(f"Marking {len(offered_courses)} unique courses as offered...")
        if offered_courses:
            cursor.execute(
                f"UPDATE courses SET offered = TRUE WHERE course_id IN %s;",
                (tuple(offered_courses),)
            )

        # Batch update professor-course relations
        print(f"Updating {len(professor_course_map)} professor-course relations...")
        for (professor_id, course_id), title in professor_course_map.items():
            # Only insert relation if the course exists
            cursor.execute(
                """
                INSERT INTO classes_professors (professor_id, course_id, offered)
                SELECT %s, %s, TRUE
                WHERE EXISTS (SELECT 1 FROM courses WHERE course_id = %s)
                ON CONFLICT (professor_id, course_id)
                DO UPDATE SET offered = TRUE;
                """,
                (professor_id, course_id, course_id),
            )
        
        # Commit the offered status updates
        conn.commit()
        print("Quarter update completed successfully.")

    # ==================== 1. Load & Insert Courses ==================== #
    if update_courses:
        with open(COURSE_JSON_FILE_PATH, "r", encoding="utf-8") as course_file:
            course_json_data = json.load(course_file)

        course_entries = [entry for sublist in course_json_data for entry in sublist]
        unique_course_ids = set()

        for course_entry in course_entries:
            course_info = course_entry.get("course", {})
            if not course_info:
                continue

            subject_code = course_info.get("subjectCode", "")
            course_num = course_info.get("courseNum", "").lstrip("0")
            course_id = f"{subject_code}{course_num}".upper()
            if course_id in unique_course_ids:
                continue
            unique_course_ids.add(course_id)

            title = course_info.get("title", "")
            icms_data = course_entry.get("icmsData", {})
            description = icms_data.get("newDescription", "")
            fulfillment_tags = icms_data.get("ge3", "")
            prereq = icms_data.get("prereq", "")
            units = course_info.get("unitsLow", 0)

            cursor.execute(
                """
                INSERT INTO courses (
                    course_id, course_title, description,
                    fulfillment_tags, prereq, units, offered
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (course_id) DO NOTHING;
                """,
                (course_id, title, description, fulfillment_tags, prereq, units, False),
            )

            text_to_embed = f"{course_id} {title} {description.strip()}".strip()
            if text_to_embed and genai_key and genai is not None:
                cursor.execute(
                    "SELECT embedding FROM courses WHERE course_id = %s;",
                    (course_id,),
                )
                if cursor.fetchone()[0] is None:
                    try:
                        embed_result = genai.embed_content(
                            model="models/text-embedding-004",
                            content=text_to_embed,
                            output_dimensionality=768,
                        )
                        embedding_vector = embed_result["embedding"]
                        print("Generating embedding for:", course_id)
                        cursor.execute(
                            """
                            UPDATE courses
                            SET embedding = %s
                            WHERE course_id = %s;
                            """,
                            (embedding_vector, course_id),
                        )
                    except Exception as e:
                        print(f"Embedding failed for {course_id}: {e}")

    # ==================== 2. Load & Insert Professors & Reviews ==================== #
    if update_professors:
        with open(PROFESSOR_FILE_PATH, "r", encoding="utf-8") as professor_file:
            professor_data = json.load(professor_file)

        # Determine a safe starting id for reviews in case the table lacks a sequence default
        next_review_id = None
        try:
            cursor.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM reviews;")
            row = cursor.fetchone()
            next_review_id = (row[0] if row and row[0] is not None else 1)
        except Exception:
            next_review_id = 1

        for prof in professor_data:
            professor_name = prof["professor_name"]
            norm = _norm_name(professor_name)
            provided_id = prof.get("id")  # ID from source JSON (RateMyProfessor or scraped)
            slug_val = slugify(professor_name)

            # Resolution order:
            # NOTES: professor Names should always be unique EXCEPT for Hao Chen
            # (if there are duplicate professors they should be in professor_duplicates)
            # 1. duplicates mapping (by normalized name) -> canonical id
            # 2. existing professor with matching slug
            # 3. provided_id if present (and already exists)
            # 4. create new using slug as id
            final_professor_id = None

            # 1. duplicates mapping (authoritative canonical id)
            duplicates_id = professor_name_to_id.get(norm)
            if duplicates_id:
                final_professor_id = duplicates_id

            # 2. existing slug match (only if still unresolved)
            if not final_professor_id:
                cursor.execute("SELECT professor_id FROM professors WHERE slug = %s;", (slug_val,))
                row = cursor.fetchone()
                if row and row[0]:
                    final_professor_id = row[0]

            # 3. provided id (only if still unresolved and it already exists)
            if not final_professor_id and provided_id:
                cursor.execute("SELECT 1 FROM professors WHERE professor_id = %s;", (provided_id,))
                if cursor.fetchone():
                    final_professor_id = provided_id

            # 4. create new via slug if still unresolved
            if not final_professor_id:
                final_professor_id = slug_val



            # Insert or update professor row; do NOT mutate slug with suffixes.
            cursor.execute(
                """
                INSERT INTO professors (
                    professor_id, professor_name, profile_url, department,
                    number_of_ratings, overall_rating, would_take_again_percentage,
                    level_of_difficulty, slug
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (professor_id) DO UPDATE
                SET slug = COALESCE(professors.slug, EXCLUDED.slug)
                ;
                """,
                (
                    final_professor_id,
                    professor_name,
                    prof.get("profile_url"),
                    prof.get("department"),
                    prof.get("number_of_ratings"),
                    float(prof.get("overall_rating") or 0),
                    prof.get("would_take_again_percentage"),
                    float(prof.get("level_of_difficulty") or 0),
                    slug_val,
                ),
            )
            print("Resolved/Upserted professor:", final_professor_id, professor_name)

            # Class–professor relations
            for class_code in prof.get("classes", []):
                course_id = class_code.upper()
                # Only insert relation if the course exists
                cursor.execute(
                    """
                    INSERT INTO classes_professors (professor_id, course_id, offered)
                    SELECT %s, %s, FALSE
                    WHERE EXISTS (SELECT 1 FROM courses WHERE course_id = %s)
                    ON CONFLICT (professor_id, course_id) DO NOTHING;
                    """,
                    (final_professor_id, course_id, course_id),
                )
                print("Ensured class-professor relation (if course exists):", final_professor_id, course_id)

            # Reviews
            if update_reviews:
                for review in prof.get("reviews", []):
                    tags_array = review.get("tags", [])
                    # Avoid inserting obvious duplicates on reruns
                    cursor.execute(
                        """
                        SELECT 1 FROM reviews
                        WHERE professor_id = %s AND course_id = %s AND review = %s
                        LIMIT 1;
                        """,
                        (
                            final_professor_id,
                            review.get("course"),
                            review.get("review"),
                        ),
                    )
                    exists = cursor.fetchone()
                    if not exists:
                        # Insert with explicit id to avoid sequence issues on some DB setups
                        try:
                            cursor.execute(
                                """
                                INSERT INTO reviews (
                                    id, professor_id, course_id, professor_name, quality_rating,
                                    difficulty_rating, review, tags, date, grade
                                )
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                                """,
                                (
                                    next_review_id,
                                    final_professor_id,
                                    review.get("course"),
                                    review.get("professor"),
                                    float(review.get("quality_rating") or 0),
                                    float(review.get("difficulty_rating") or 0),
                                    review.get("review"),
                                    tags_array,
                                    review.get("date"),
                                    review.get("grade"),
                                ),
                            )
                            next_review_id += 1
                        except Exception:
                            # If explicit id fails, fall back to default insert
                            cursor.execute(
                                """
                                INSERT INTO reviews (
                                    professor_id, course_id, professor_name, quality_rating,
                                    difficulty_rating, review, tags, date, grade
                                )
                                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
                                """,
                                (
                                    final_professor_id,
                                    review.get("course"),
                                    review.get("professor"),
                                    float(review.get("quality_rating") or 0),
                                    float(review.get("difficulty_rating") or 0),
                                    review.get("review"),
                                    tags_array,
                                    review.get("date"),
                                    review.get("grade"),
                                ),
                            )

        # After inserting reviews, backfill common_tags per professor from reviews
        if update_reviews:
            cursor.execute(
                """
                WITH tag_counts AS (
                    SELECT r.professor_id, unnest(r.tags) AS tag
                    FROM reviews r
                    WHERE r.tags IS NOT NULL
                ), agg AS (
                    SELECT professor_id, tag, COUNT(*) AS cnt
                    FROM tag_counts
                    GROUP BY professor_id, tag
                ), topn AS (
                    SELECT professor_id, tag, cnt,
                           ROW_NUMBER() OVER (PARTITION BY professor_id ORDER BY cnt DESC, tag ASC) AS rn
                    FROM agg
                ), packed AS (
                    SELECT professor_id, (array_agg(tag ORDER BY cnt DESC, tag ASC))[1:3] AS tags
                    FROM topn
                    WHERE rn <= 3
                    GROUP BY professor_id
                )
                UPDATE professors p
                SET common_tags = COALESCE(packed.tags, ARRAY[]::text[])
                FROM packed
                WHERE p.professor_id = packed.professor_id;
                """
            )

    # Populate one_review for class-professor relations
    _run_add_one_review()

    # ==================== 3. Load & Insert Grades ==================== #
    if update_grades and os.path.exists(GRADES_JSON_FILE_PATH):
        with open(GRADES_JSON_FILE_PATH, "r", encoding="utf-8") as gf:
            grade_data = json.load(gf)

        # Resolve / ensure professor rows for all instructors in grades,
        # using the same duplicate-aware resolver used elsewhere.
        instructor_to_professor_id: Dict[str, str] = {}
        for instructor_name in grade_data.keys():
            if not instructor_name or not instructor_name.strip():
                continue
            professor_id = resolve_professor_id_by_name(instructor_name)
            instructor_to_professor_id[instructor_name] = professor_id


        # Precompute a safe starting id for grades if the table lacks a working sequence
        next_grade_id = None
        try:
            cursor.execute("SELECT COALESCE(MAX(id), 0) + 1 FROM grades;")
            row = cursor.fetchone()
            next_grade_id = (row[0] if row and row[0] is not None else 1)
        except Exception:
            next_grade_id = 1

        # insert grade rows with professor_slug populated
        for instructor_name, info in grade_data.items():
            professor_id = instructor_to_professor_id.get(instructor_name)
            if not professor_id and instructor_name and instructor_name.strip():
                professor_id = resolve_professor_id_by_name(instructor_name)
                instructor_to_professor_id[instructor_name] = professor_id

            for cls_data in info.get("classes", []):
                course_id = (cls_data.get("course") or "").upper()
                quarter = cls_data.get("quarter")
                enrolled_str = str(cls_data.get("enrolled", "0"))
                enrolled = int(enrolled_str) if str(enrolled_str).isdigit() else 0
                grades_dict = cls_data.get("grades", {})
                # Resolve professor_slug for this grade row
                prof_slug = None
                if professor_id:
                    cursor.execute(
                        "SELECT slug FROM professors WHERE professor_id = %s;",
                        (professor_id,),
                    )
                    row = cursor.fetchone()
                    prof_slug = row[0] if row and row[0] else None
                if not prof_slug:
                    prof_slug = slugify(instructor_name)

                # Ensure a classes_professors relation exists for this professor/course
                if professor_id and course_id:
                    cursor.execute(
                        """
                        SELECT 1 FROM classes_professors
                        WHERE professor_id = %s AND course_id = %s
                        LIMIT 1;
                        """,
                        (professor_id, course_id),
                    )
                    rel_exists = cursor.fetchone()
                    if not rel_exists:
                        cursor.execute(
                            """
                            INSERT INTO classes_professors (professor_id, course_id, offered)
                            SELECT %s, %s, FALSE
                            WHERE EXISTS (SELECT 1 FROM courses WHERE course_id = %s)
                            ON CONFLICT (professor_id, course_id) DO NOTHING;
                            """,
                            (professor_id, course_id, course_id),
                        )


                # update if row exists for same instructor/course/quarter
                cursor.execute(
                    """
                    SELECT id FROM grades
                    WHERE instructor_name = %s AND course_id = %s AND quarter = %s
                    LIMIT 1;
                    """,
                    (instructor_name, course_id, quarter),
                )
                existing = cursor.fetchone()
                if existing:
                    cursor.execute(
                        """
                        UPDATE grades
                        SET enrolled = %s,
                            grade_distribution = %s::jsonb,
                            professor_slug = %s
                        WHERE id = %s;
                        """,
                        (
                            enrolled,
                            json.dumps(grades_dict),
                            prof_slug,
                            existing[0],
                        ),
                    )
                else:
                    # Insert with explicit id to avoid PK issues when sequence/default is misconfigured
                    try:
                        cursor.execute(
                            """
                            INSERT INTO grades (
                                id, instructor_name, course_id, quarter,
                                enrolled, grade_distribution, professor_slug
                            )
                            VALUES (%s, %s, %s, %s, %s, %s, %s)
                            """,
                            (
                                next_grade_id,
                                instructor_name,
                                course_id,
                                quarter,
                                enrolled,
                                json.dumps(grades_dict),
                                prof_slug,
                            ),
                        )
                        next_grade_id += 1
                    except Exception:
                        # Fallback to default if id-managed by DB
                        cursor.execute(
                            """
                            INSERT INTO grades (
                                instructor_name, course_id, quarter,
                                enrolled, grade_distribution, professor_slug
                            )
                            VALUES (%s, %s, %s, %s, %s, %s)
                            """,
                            (
                                instructor_name,
                                course_id,
                                quarter,
                                enrolled,
                                json.dumps(grades_dict),
                                prof_slug,
                            ),
                        )

        print("Grades data inserted from", GRADES_JSON_FILE_PATH)
        _run_compute_course_gpa()
    elif update_grades:
        print("Grades JSON file not found at", GRADES_JSON_FILE_PATH)

    conn.commit()
    cursor.close()
    conn.close()
    print("Data loading completed successfully.")


if __name__ == "__main__":
    load_data()