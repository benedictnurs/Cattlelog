# Data Pipelines

This directory contains scripts for collecting and processing UC Davis course and professor data from multiple sources.

## Core Scripts

### 1. `get_professor_id.py`
Searches RateMyProfessors for UC Davis professors and collects their RMP IDs.

**Output:** `data/rmp_ids.json`

### 2. `get_reviews_api.py`
Fetches detailed professor reviews from RateMyProfessors using their GraphQL API. Uses concurrent requests with rate limiting.

**Input:** `data/rmp_ids.json`  
**Output:** `data/ucdavis_professors_reviews.json`

**Features:**
- Concurrent fetching (2-3 requests at a time)
- Rate limit handling with exponential backoff
- Professor merging for similar departments
- Normalized professor names and IDs

### 3. `get_grade_json.py`
Processes raw Excel grade distribution files into structured JSON format.

**Input:** `data/raw_grade_data/*.xlsx`  
**Output:** `data/grades.json`

**Features:**
- Parses quarter data from filenames
- Normalizes professor names and course codes
- Aggregates grade counts per professor/course/quarter

### 4. `get_schedule_builder.py`
Fetches current class schedule data from UC Davis Schedule Builder API.

**Output:** `data/class_data/ucd_classes_<term>.json`

**Features:**
- Concurrent fetching of all subjects
- Normalizes instructor names and course codes
- Adds `course_id` and `professor_id` fields

### 5. `get_catalog.py`
Scrapes UC Davis course catalog for course descriptions, units, prerequisites, etc.

**Output:** `data/catalog.json`

**Features:**
- Concurrent scraping of all departments
- Parses units as integers
- Handles multiple course versions (selects most recent)
- Normalizes course codes

## Utility Files

### `utils.py`
Shared utility functions used across all scripts:
- `normalize_name()` - Removes accents, special characters from names
- `create_professor_id()` - Generates consistent professor IDs
- `normalize_course_code()` - Standardizes course codes (e.g., "ECS 32" → "ECS032")

## Running Order

For a complete data refresh:

```bash
# 1. Get professor IDs from RMP
python get_professor_id.py

# 2. Fetch reviews for all professors
python get_reviews_api.py

# 3. Process grade data
python get_grade_json.py

# 4. Fetch current class schedules
python get_schedule_builder.py

# 5. Scrape course catalog
python get_catalog.py
```

## Data Normalization

All scripts use consistent normalization:
- **Professor Names:** ASCII-only, properly capitalized (e.g., "José García" → "Jose Garcia")
- **Professor IDs:** Lowercase with dashes (e.g., "jose-garcia")
- **Course Codes:** 3-letter prefix + 3-digit number (e.g., "ECS032", "MAT021A")

This ensures data from different sources can be easily merged and matched.

