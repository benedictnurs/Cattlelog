# Database Schema Creation

This document describes `create_tables.py`, which initializes the database schema for the UC Davis course recommendation system.

## Usage

Run the script to create all required tables:

```bash
python -m demo.backend.database_management.create_tables
```

## Tables Created

### Professors
- Stores instructor metadata from RateMyProfessors.  
- `Slug` is generated through lowercasing all letters of the `professor_name` and replacing all non-letters with dashes (-)  
- `professor_name` should also be unique minus a single case: there are two professors named Hao Chen, one in the Computer Science department and another in the Statistics department

| Column                        | Type    | Constraints             | Description                        |
| ----------------------------- | ------- | ----------------------- | ---------------------------------- |
| `professor_id`                | `TEXT`  | PK                      | Unique identifier (slug or RMP ID) |
| `professor_name`              | `TEXT`  | NOT NULL                | Full name                          |
| `profile_url`                 | `TEXT`  |                         | RateMyProfessors profile link      |
| `department`                  | `TEXT`  |                         | Department name                    |
| `number_of_ratings`           | `TEXT`  |                         | Total count of RMP ratings         |
| `overall_rating`              | `FLOAT` |                         | RMP overall score (e.g. 3.9)       |
| `would_take_again_percentage` | `TEXT`  |                         | Percentage string (e.g. `75%`)     |
| `level_of_difficulty`         | `FLOAT` |                         | RMP difficulty score               |
| `slug`                        | `TEXT`  | UNIQUE, INDEX, NOT NULL | URL‑friendly unique identifier     |

### Courses
- Stores course catalog information plus an embedding vector for semantic search
- Data from schedule builder API
- Special columns: `embedding` (vector), `offered` (boolean)

| Column             | Type                     | Constraints   | Description                               |
| ------------------ | ------------------------ | ------------- | ----------------------------------------- |
| `course_id`        | `TEXT(20)`               | PK            | Unique course code (e.g. ECS150)          |
| `course_title`     | `TEXT`                   |               | Official course title                     |
| `units`            | `INTEGER`                |               | Credit units                              |
| `description`      | `TEXT`                   |               | Course description                        |
| `fulfillment_tags` | `TEXT`                   |               | Comma‑separated GE/major requirement tags |
| `prereq`           | `TEXT`                   |               | Prerequisite text                         |
| `offered`          | `BOOLEAN`                | DEFAULT FALSE | Whether currently offered                 |
| `embedding`        | `VECTOR(768)` (pgvector) |               | Semantic embedding for search             |


### Classes_Professors
- Many-to-many relationship table linking professors to courses they teach
- Tracks which professors are currently teaching which courses
- course_title and one_review are used to reduce joins in all_courses, a big endpoint

| Column         | Type      | Constraints                       | Description                           |
| -------------- | --------- | --------------------------------- | ------------------------------------- |
| `professor_id` | `TEXT`    | PK, FK → professors.professor\_id | Instructor teaching this course       |
| `course_id`    | `TEXT`    | PK, FK → courses.course\_id       | Course being taught                   |
| `course_title` | `TEXT`    |                                   | Cached course title                   |
| `offered`      | `BOOLEAN` | DEFAULT FALSE                     | Teaching status for current quarter   |
| `one_review`   | `TEXT`    |                                   | Random review from reviews table      |

### Reviews
- Stores student reviews of courses and professors

| Column              | Type     | Constraints                   | Description                     |
| ------------------- | -------- | ----------------------------- | ------------------------------- |
| `id`                | `SERIAL` | PK                            | Unique review identifier        |
| `professor_id`      | `TEXT`   | FK → professors.professor\_id | Reviewed instructor             |
| `course_id`         | `TEXT`   | FK → courses.course\_id       | Reviewed course                 |
| `professor_name`    | `TEXT`   |                               | Snapshot of name at review time |
| `quality_rating`    | `FLOAT`  |                               | RMP‑style quality score         |
| `difficulty_rating` | `FLOAT`  |                               | RMP‑style difficulty score      |
| `review`            | `TEXT`   |                               | Free‑form review text           |
| `tags`              | `TEXT[]` |                               | Array of review tags            |
| `date`              | `TEXT`   |                               | Submission date (ISO string)    |
| `grade`             | `TEXT`   |                               | Grade received (e.g. `A`)       |

### Grades
- Stores historical grade distributions
- Uses JSONB column for grade distribution (e.g., {"A": 25, "B+": 10})


| Column               | Type      | Constraints                           | Description                         |
| -------------------- | --------- | ------------------------------------- | ----------------------------------- |
| `id`                 | `SERIAL`  | PK                                    | Unique identifier                   |
| `instructor_name`    | `TEXT`    |                                       | Name snapshot at time of data entry |
| `professor_slug`     | `TEXT`    | FK → professors.slug, INDEX, NOT NULL | Link to canonical professor record  |
| `course_id`          | `TEXT`    | FK → courses.course\_id, NOT NULL     | Course code                         |
| `quarter`            | `TEXT`    | NOT NULL                              | Quarter label (e.g. `Fall 2023`)    |
| `enrolled`           | `INTEGER` |                                       | Enrollment count                    |
| `grade_distribution` | `JSONB`   |                                       | JSON map of letter grades → counts  |


### Cattlelog_Reviews
- Stores user-submitted reviews from the application (unique perspective)

| Column              | Type      | Constraints                     | Description                |
| ------------------- | --------- | ------------------------------- | -------------------------- |
| `id`                | `SERIAL`  | PK                              | Unique identifier          |
| `professor_name`    | `TEXT`    | FK → professors.professor\_name | Instructor name            |
| `term`              | `TEXT`    |                                 | Academic term              |
| `email`             | `TEXT`    |                                 | Redacted user email        |
| `course_id`         | `TEXT`    | FK → courses.course\_id         | Course code                |
| `quality_rating`    | `FLOAT`   |                                 | Quality score              |
| `difficulty_rating` | `FLOAT`   |                                 | Difficulty score           |
| `review`            | `TEXT`    |                                 | Free‑text review           |
| `tags`              | `TEXT[]`  |                                 | Review tags                |
| `date`              | `TEXT`    |                                 | Timestamp                  |
| `grade`             | `TEXT`    |                                 | Grade awarded              |
| `unique_review`     | `BOOLEAN` | DEFAULT TRUE                    | Flag indicating uniqueness |


### Professor_Duplicates
- Serves as a table to show all professors that share the exact same name
- NEEDS to be check when inputting new data

| Column              | Type      | Constraints                     | Description                |
| ------------------- | --------- | ------------------------------- | -------------------------- |
| `professor_id`                | `VARCHAR`  | PK                              | Unique identifier          |
| `professor_name`    | `TEXT`    |                                 | Instructor name            |


## Relationships & Indexes

- **Primary Keys** on `professors.professor_id`, `courses.course_id`, composite on `classes_professors`.
- **Foreign Keys**:
  - `classes_professors.professor_id → professors.professor_id`
  - `classes_professors.course_id → courses.course_id`
  - `reviews.professor_id → professors.professor_id`
  - `reviews.course_id → courses.course_id`
  - `grades.professor_slug → professors.slug`
  - `grades.course_id → courses.course_id`
  - `cattlelog_reviews.professor_name → professors.professor_name`
  - `cattlelog_reviews.course_id → courses.course_id`
- **Indexes** on:
  - `professors.slug` (unique)
  - `grades.professor_slug`
  - `reviews(course_id)`, `reviews(professor_id)`

---

## Implementation Notes

- Uses PostgreSQL with pgvector extension for semantic search capabilities
- Creates tables only if they don't already exist
- Vector dimension is set to 768 for compatibility with embedding models