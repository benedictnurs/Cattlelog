# Database Management

This directory contains scripts for managing the database structure and content for the UC Davis course recommendation system.

## Scripts Overview

- **`create_tables.py`**: Use when starting a clean database or making changes to table schemas
- **`load_to_db.py`**: Use for populating tables with course, professor, and review data

## Database Loader (`load_to_db.py`)

### Overview

The `load_to_db.py` script populates and updates the database with information about courses, professors, reviews, and grade distributions from JSON files. It also generates text embeddings for semantic search capabilities.

### Dependencies

- `json`: For parsing data files
- `os`: For accessing environment variables
- `google.generativeai` (optional): For generating course content embeddings
- Database connection utilities from the server module

### Configuration

#### Environment Variables
- `GOOGLE_API_KEY`: Required for generating course embeddings

#### Data Sources
The script uses the following JSON data files:

- **Professors and Reviews**: `demo/backend/data_pipelines/data/ucdavis_professors_reviews.json`
- **Course Information**: `demo/backend/data_pipelines/data/class_data/ucd_classes_202510.json`
(Make sure to change file based on the current quarter)
- **Grade Distributions**: `demo/backend/data_pipelines/data/grades.json`

### Usage

#### Basic Usage
Run the script with default settings (updates professors only):

```bash
python -m demo.backend.database_management.load_to_db
```

#### Function Parameters

The main `load_data()` function accepts the following parameters:

- `update_courses` (bool, default=False): Load and update course data
- `update_quarter` (bool, default=False): Refresh current-quarter 'offered' flags
- `update_professors` (bool, default=True): Load and update professor data
- `update_reviews` (bool, default=False): Load and update course reviews
- `update_grades` (bool, default=False): Load and update grade distribution data

#### Advanced Usage Examples

Update courses and their embeddings:

```python
from demo.backend.database_management.load_to_db import load_data

load_data(update_courses=True, update_professors=False)
```

Full update of all data:

```python
load_data(
    update_courses=True,
    update_quarter=True,
    update_professors=True,
    update_reviews=True,
    update_grades=True
)
```

### Operations

1. **Update Offered Status** (when `update_quarter=True`):
   - Resets and updates 'offered' flags for courses and class-professor relationships
   - Creates class-professor relationships for current quarter courses

2. **Course Data Loading** (when `update_courses=True`):
   - Inserts course information: ID, title, description, requirements, etc.
   - Generates text embeddings for courses (if not existing and `GOOGLE_API_KEY` is configured). If the embedding API is unavailable, the loader skips embeddings and continues.

3. **Professor Data Loading** (when `update_professors=True`):
   - Inserts professor information and ratings
   - Creates class-professor relationship records
   - Optionally loads reviews when `update_reviews=True`
   - Populates a stable `slug` for each professor (lowercase, dash-separated). Slugs are unique and used to join with grade distributions.
   - After loading reviews, computes and stores `common_tags` per professor (top 3 tags from their reviews)

4. **Grade Data Loading** (when `update_grades=True`):
   - Inserts grade distribution data by instructor, course, and quarter
   - Populates `grades.professor_slug` by slugifying `instructor_name`
   - Ensures a corresponding minimal `professors` row exists for any `professor_slug` not already present, so foreign keys are satisfied

### Database Schema Integration

The script works with the following database tables:
- `courses`: Course information and embeddings
- `professors`: Professor details and ratings
- `classes_professors`: Many-to-many relationship between courses and professors
- `reviews`: Student reviews of courses and professors
- `grades`: Historical grade distributions
   - Includes a `professor_slug` column (FK to `professors.slug`)

### Notes

- Course embeddings are only generated if they don't already exist
- The script uses upsert operations to avoid duplicate entries
- Data consistency is maintained across related tables
- Professor `slug` is now required by the application and is auto-derived during load. If a name collision occurs, the loader appends the `professor_id` to keep slugs unique.

## Loading Data Steps

### Quarterly course information:

### Step 1: Update Course and Quarter Data
Run the data loader with the appropriate flags:

```bash
python -m backend.database_management.load_to_db
# Set update_quarter=True and update_courses=True in the script
```
