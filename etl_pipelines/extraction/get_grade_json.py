"""Grade Data Processing - Pandas Optimized Version

Reads raw grade Excel files and aggregates them into a professor-centric JSON format.
Uses pandas for efficient data processing and aggregation.
"""

import os
import json
import pandas as pd
import warnings
import logging
from typing import Dict, List

from utils import create_professor_id, normalize_course_code, get_data_dir

warnings.filterwarnings('ignore', category=UserWarning, module='openpyxl')

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def extract_quarter_from_filename(filename: str) -> str:
    """Extract quarter name from Excel filename."""
    base_name = os.path.splitext(filename)[0]
    parts = base_name.split()
    
    if len(parts) >= 4:
        season = parts[1]  # e.g. "Fall"
        year = parts[-1]   # e.g. "2023"
        return f"{season}_{year}"
    return None


def load_all_excel_files(input_dir: str) -> pd.DataFrame:
    """Load all Excel files into a single DataFrame with quarter column."""
    all_dfs = []
    
    for filename in sorted(os.listdir(input_dir)):
        if not (filename.endswith(".xlsx") and "Quarter" in filename):
            continue
        
        quarter = extract_quarter_from_filename(filename)
        if not quarter:
            logger.warning(f"Skipping '{filename}' - doesn't match expected pattern")
            continue
        
        logger.info(f"Loading '{filename}' as quarter '{quarter}'...")
        
        xlsx_path = os.path.join(input_dir, filename)
        df = pd.read_excel(xlsx_path)
        df['quarter'] = quarter
        all_dfs.append(df)
    
    if not all_dfs:
        raise ValueError(f"No valid Excel files found in {input_dir}")
    
    return pd.concat(all_dfs, ignore_index=True)


def process_grades_data(df: pd.DataFrame) -> pd.DataFrame:
    """Process raw grade data with pandas operations."""
    logger.info("Processing grade data with pandas...")
    
    # Clean and convert columns
    df['IFNAME'] = df['IFNAME'].astype(str).str.strip()
    df['ILNAME'] = df['ILNAME'].astype(str).str.strip()
    df['SUBJ'] = df['SUBJ'].astype(str).str.strip()
    df['CRSE'] = df['CRSE'].astype(str).str.strip()
    df['GRADE'] = df['GRADE'].astype(str).str.strip()
    df['CNTOFGRADE'] = pd.to_numeric(df['CNTOFGRADE'], errors='coerce').fillna(0).astype(int)
    
    # Create professor_id and professor_name
    logger.info("Creating professor IDs...")
    df[['professor_id', 'professor_name']] = df.apply(
        lambda row: pd.Series(create_professor_id(row['IFNAME'], row['ILNAME'])),
        axis=1
    )
    
    # Create course_id
    logger.info("Normalizing course codes...")
    df['course_id'] = df.apply(
        lambda row: normalize_course_code(subject=row['SUBJ'], course_num=row['CRSE']),
        axis=1
    )
    
    # Group and aggregate grades
    logger.info("Aggregating grades...")
    agg_df = df.groupby(
        ['professor_id', 'professor_name', 'quarter', 'course_id', 'GRADE'],
        as_index=False
    )['CNTOFGRADE'].sum()
    
    return agg_df


def build_professor_json(agg_df: pd.DataFrame) -> List[Dict]:
    """Build final JSON structure from aggregated DataFrame."""
    logger.info("Building JSON structure...")
    
    professors = []
    
    # Group by professor
    for prof_id, prof_group in agg_df.groupby('professor_id'):
        professor_name = prof_group['professor_name'].iloc[0]
        
        classes = []
        
        # Group by quarter and course
        for (quarter, course_id), class_group in prof_group.groupby(['quarter', 'course_id']):
            # Create grades dictionary
            grades = dict(zip(
                class_group['GRADE'].astype(str),
                class_group['CNTOFGRADE'].astype(str)
            ))
            
            # Calculate total enrolled
            total_enrolled = class_group['CNTOFGRADE'].sum()
            
            classes.append({
                'course_id': course_id,
                'quarter': quarter,
                'enrolled': str(total_enrolled),
                'grades': grades
            })
        
        professors.append({
            'professor_id': prof_id,
            'professor_name': professor_name,
            'classes': classes
        })
    
    return professors


def xlsx_to_json(input_dir=None, output_path=None):
    """Main function to convert Excel grade files to JSON format."""
    data_dir = get_data_dir(__file__)
    
    if input_dir is None:
        input_dir = os.path.join(data_dir, "raw_grade_data")
    if output_path is None:
        output_path = os.path.join(data_dir, "grades.json")
    
    input_dir = os.path.abspath(input_dir)
    output_path = os.path.abspath(output_path)
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    logger.info("="*60)
    logger.info("Grade Data Processing (Pandas Version)")
    logger.info("="*60)
    
    # Load all Excel files
    logger.info(f"Loading Excel files from: {input_dir}")
    df = load_all_excel_files(input_dir)
    logger.info(f"Loaded {len(df):,} grade records")
    
    # Process data
    agg_df = process_grades_data(df)
    logger.info(f"Aggregated to {len(agg_df):,} unique grade entries")
    
    # Build JSON structure
    final_data = build_professor_json(agg_df)
    
    # Write output
    logger.info(f"Writing to: {output_path}")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, indent=4)
    
    logger.info("="*60)
    logger.info("COMPLETED!")
    logger.info("="*60)
    logger.info(f"Total professors: {len(final_data):,}")
    logger.info(f"Total class entries: {sum(len(p['classes']) for p in final_data):,}")
    logger.info(f"Output: {output_path}")
    logger.info("="*60)


if __name__ == "__main__":
    xlsx_to_json()
