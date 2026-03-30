"""Data Validation and Analysis Script

Analyzes professor_id and course_id standardization across all data sources:
- RateMyProfessors reviews
- Grade distributions
- Class schedules
- Course catalog

Uses pandas for efficient data analysis and optional CSV export.
"""

import json
import os
import logging
import pandas as pd
from typing import Dict, Set

from utils import get_data_dir

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Get data directory
data_dir = get_data_dir(__file__)


def safe_percentage(numerator: int, denominator: int) -> str:
    """Calculate percentage safely, returning 0% if denominator is 0."""
    if denominator == 0:
        return "0.0"
    return f"{numerator/denominator*100:.1f}"


def load_and_validate_file(filepath: str, source_name: str, command: str) -> dict:
    """Load JSON file with error handling."""
    if not os.path.exists(filepath):
        logger.error(f"{source_name} file not found at {filepath}")
        logger.info(f"   Run: python {command}")
        exit(1)
    
    with open(filepath) as f:
        return json.load(f)


def extract_professors_and_courses(rmp_data, grades_data, schedule_data, catalog_data) -> dict:
    """Extract professor_ids and course_ids from all sources using pandas."""
    
    # ===== RMP Data =====
    rmp_df = pd.DataFrame(rmp_data)
    rmp_profs = set(rmp_df['professor_id'].dropna())
    
    # Explode classes array and filter out N/A
    rmp_courses = set(
        rmp_df['classes'].explode().dropna()
        .loc[lambda x: x != 'N/A']
    )
    
    # ===== Grades Data =====
    grades_df = pd.DataFrame(grades_data)
    grade_profs = set(grades_df['professor_id'].dropna())
    
    # Normalize nested classes data
    grade_courses_df = pd.json_normalize(grades_data, 'classes', ['professor_id'])
    grade_courses = set(grade_courses_df['course_id'].dropna())
    
    # ===== Schedule Data =====
    # Flatten the nested schedule structure
    schedule_courses_list = []
    schedule_profs_list = []
    
    for classes in schedule_data:
        if isinstance(classes, list):
            for course in classes:
                if isinstance(course, dict):
                    # Add course_id
                    if 'course_id' in course:
                        schedule_courses_list.append(course['course_id'])
                    
                    # Add professor_ids from instructors
                    for instructor in course.get('instructor', []):
                        if 'professor_id' in instructor:
                            schedule_profs_list.append(instructor['professor_id'])
    
    schedule_profs = set(schedule_profs_list)
    schedule_courses = set(schedule_courses_list)
    
    # ===== Catalog Data =====
    catalog_df = pd.DataFrame(catalog_data)
    catalog_courses = set(catalog_df['course_id'].dropna())
    
    return {
        'professors': {
            'rmp': rmp_profs,
            'grades': grade_profs,
            'schedule': schedule_profs
        },
        'courses': {
            'rmp': rmp_courses,
            'grades': grade_courses,
            'schedule': schedule_courses,
            'catalog': catalog_courses
        }
    }


def print_analysis(data: Dict[str, Dict[str, Set]]):
    """Print comprehensive analysis of data overlaps."""
    profs = data['professors']
    courses = data['courses']
    
    # Professor overlaps
    rmp_grades_profs = profs['rmp'] & profs['grades']
    rmp_schedule_profs = profs['rmp'] & profs['schedule']
    grades_schedule_profs = profs['grades'] & profs['schedule']
    all_three_profs = profs['rmp'] & profs['grades'] & profs['schedule']
    
    # Course overlaps
    rmp_grades_courses = courses['rmp'] & courses['grades']
    rmp_schedule_courses = courses['rmp'] & courses['schedule']
    rmp_catalog_courses = courses['rmp'] & courses['catalog']
    grades_schedule_courses = courses['grades'] & courses['schedule']
    grades_catalog_courses = courses['grades'] & courses['catalog']
    schedule_catalog_courses = courses['schedule'] & courses['catalog']
    all_four_courses = courses['rmp'] & courses['grades'] & courses['schedule'] & courses['catalog']
    
    logger.info("="*70)
    logger.info("DATA VALIDATION ANALYSIS")
    logger.info("="*70)
    
    # Professor Analysis
    logger.info("="*60)
    logger.info("PROFESSOR DATA")
    logger.info("="*60)
    logger.info("Total Unique Professors by Source:")
    logger.info(f"  RMP:      {len(profs['rmp']):>5}")
    logger.info(f"  Grades:   {len(profs['grades']):>5}")
    logger.info(f"  Schedule: {len(profs['schedule']):>5}")
    
    logger.info("Cross-Source Matches:")
    logger.info(f"  RMP ∩ Grades:      {len(rmp_grades_profs):>5} ({safe_percentage(len(rmp_grades_profs), min(len(profs['rmp']), len(profs['grades'])) if profs['rmp'] and profs['grades'] else 0)}%)")
    logger.info(f"  RMP ∩ Schedule:    {len(rmp_schedule_profs):>5} ({safe_percentage(len(rmp_schedule_profs), min(len(profs['rmp']), len(profs['schedule'])) if profs['rmp'] and profs['schedule'] else 0)}%)")
    logger.info(f"  Grades ∩ Schedule: {len(grades_schedule_profs):>5} ({safe_percentage(len(grades_schedule_profs), min(len(profs['grades']), len(profs['schedule'])) if profs['grades'] and profs['schedule'] else 0)}%)")
    logger.info(f"  All Three:         {len(all_three_profs):>5} ({safe_percentage(len(all_three_profs), min(len(profs['rmp']), len(profs['grades']), len(profs['schedule'])) if profs['rmp'] and profs['grades'] and profs['schedule'] else 0)}%)")
    
    logger.info("Professors Only In:")
    logger.info(f"  RMP only:      {len(profs['rmp'] - profs['grades'] - profs['schedule']):>5}")
    logger.info(f"  Grades only:   {len(profs['grades'] - profs['rmp'] - profs['schedule']):>5}")
    logger.info(f"  Schedule only: {len(profs['schedule'] - profs['rmp'] - profs['grades']):>5}")
    
    # Course Analysis
    logger.info("="*60)
    logger.info("COURSE DATA")
    logger.info("="*60)
    logger.info("Total Unique Courses by Source:")
    logger.info(f"  RMP:      {len(courses['rmp']):>5}")
    logger.info(f"  Grades:   {len(courses['grades']):>5}")
    logger.info(f"  Schedule: {len(courses['schedule']):>5}")
    logger.info(f"  Catalog:  {len(courses['catalog']):>5}")
    
    logger.info("Cross-Source Matches:")
    logger.info(f"  RMP ∩ Grades:       {len(rmp_grades_courses):>5} ({safe_percentage(len(rmp_grades_courses), min(len(courses['rmp']), len(courses['grades'])) if courses['rmp'] and courses['grades'] else 0)}%)")
    logger.info(f"  RMP ∩ Schedule:     {len(rmp_schedule_courses):>5} ({safe_percentage(len(rmp_schedule_courses), min(len(courses['rmp']), len(courses['schedule'])) if courses['rmp'] and courses['schedule'] else 0)}%)")
    logger.info(f"  RMP ∩ Catalog:      {len(rmp_catalog_courses):>5} ({safe_percentage(len(rmp_catalog_courses), min(len(courses['rmp']), len(courses['catalog'])) if courses['rmp'] and courses['catalog'] else 0)}%)")
    logger.info(f"  Grades ∩ Schedule:  {len(grades_schedule_courses):>5} ({safe_percentage(len(grades_schedule_courses), min(len(courses['grades']), len(courses['schedule'])) if courses['grades'] and courses['schedule'] else 0)}%)")
    logger.info(f"  Grades ∩ Catalog:   {len(grades_catalog_courses):>5} ({safe_percentage(len(grades_catalog_courses), min(len(courses['grades']), len(courses['catalog'])) if courses['grades'] and courses['catalog'] else 0)}%)")
    logger.info(f"  Schedule ∩ Catalog: {len(schedule_catalog_courses):>5} ({safe_percentage(len(schedule_catalog_courses), min(len(courses['schedule']), len(courses['catalog'])) if courses['schedule'] and courses['catalog'] else 0)}%)")
    logger.info(f"  All Four:           {len(all_four_courses):>5} ({safe_percentage(len(all_four_courses), min(len(courses['rmp']), len(courses['grades']), len(courses['schedule']), len(courses['catalog'])) if courses['rmp'] and courses['grades'] and courses['schedule'] and courses['catalog'] else 0)}%)")
    
    logger.info("Courses Only In:")
    logger.info(f"  RMP only:      {len(courses['rmp'] - courses['grades'] - courses['schedule'] - courses['catalog']):>5}")
    logger.info(f"  Grades only:   {len(courses['grades'] - courses['rmp'] - courses['schedule'] - courses['catalog']):>5}")
    logger.info(f"  Schedule only: {len(courses['schedule'] - courses['rmp'] - courses['grades'] - courses['catalog']):>5}")
    logger.info(f"  Catalog only:  {len(courses['catalog'] - courses['rmp'] - courses['grades'] - courses['schedule']):>5}")
    
    logger.info("="*70)


def main():
    """Main execution function."""
    # File paths
    rmp_file = os.path.join(data_dir, "ucdavis_professors_reviews.json")
    grades_file = os.path.join(data_dir, "grades.json")
    schedule_file = os.path.join(data_dir, "class_data", "ucd_classes_winter_2026.json")
    catalog_file = os.path.join(data_dir, "catalog.json")
    
    logger.info("Loading data from:")
    logger.info(f"  RMP:      {rmp_file}")
    logger.info(f"  Grades:   {grades_file}")
    logger.info(f"  Schedule: {schedule_file}")
    logger.info(f"  Catalog:  {catalog_file}")
    
    # Load all data sources
    rmp_data = load_and_validate_file(rmp_file, "RMP", "get_reviews_api.py")
    grades_data = load_and_validate_file(grades_file, "Grades", "get_grade_json.py")
    schedule_data = load_and_validate_file(schedule_file, "Schedule", "get_schedule_builder.py")
    catalog_data = load_and_validate_file(catalog_file, "Catalog", "get_catalog.py")
    
    logger.info("Loading and extracting data with pandas...")
    
    # Extract all data using pandas
    data = extract_professors_and_courses(rmp_data, grades_data, schedule_data, catalog_data)
    
    logger.info("Data loaded successfully")
    
    # Print analysis
    print_analysis(data)


if __name__ == "__main__":
    main()
