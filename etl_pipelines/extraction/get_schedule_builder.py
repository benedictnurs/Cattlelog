import json
import os
import urllib.parse
import random
import asyncio
import aiohttp
import pandas as pd
import logging
from typing import List, Any

from utils import create_professor_id, normalize_name, get_data_dir

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Base URL for the Schedule Builder API
BASE_URL = 'https://my.ucdavis.edu/schedulebuilder/cf/search/search.cfc'

# Concurrency settings
MAX_CONCURRENT_REQUESTS = 10  # Number of concurrent requests

# Headers required for the request
HEADERS = {
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                  'Chrome/86.0.4240.75 Safari/537.36',
    'X-Requested-With': 'XMLHttpRequest'
}

def season_to_term_code(season, year):
    """
    Convert a season and year to a UC Davis term code.
    
    Args:
        season (str): The season ('winter', 'spring', 'summer', 'fall')
        year (str or int): The year (e.g., 2025 or '2025')
    
    Returns:
        tuple: (raw_term_code, formatted_term) e.g., ('202501', 'winter_2025')
    """
    # Map seasons to month codes
    season_to_month = {
        'winter': '01',
        'spring': '03',
        'summer': '06',
        'fall': '10'
    }
    
    season_lower = season.lower().strip()
    month_code = season_to_month.get(season_lower)
    
    if not month_code:
        raise ValueError(f"Invalid season '{season}'. Must be one of: winter, spring, summer, fall")
    
    # Construct the raw term code (e.g., '202501')
    raw_term_code = f"{year}{month_code}"
    
    # Construct the formatted term (e.g., 'winter_2025')
    formatted_term = f"{season_lower}_{year}"
    
    return raw_term_code, formatted_term

def get_subjects():
    """
    Retrieve a list of all subjects/departments available.
    """
    subjects = [
        "PTX","EVH","MIC","WLD","RUS","AVS","JPN","EAE","GER","CMN",
        "GDB","CRD","MSA","VET","BCB","ENV","JST","PHI","COM","MSC",
        "GLO","SAS","BCM","ESM","LED","PMR","GRD","MCB","BIS","ESP",
        "PAS","AAS","LDA","ECS","STS","CNS","GRK","VMB","STH","EBS",
        "ETX","CRI","AGC","LAT","MHI","MCP","BIO","EPI","CST","PBI",
        "SOC","TAE","PHY","HEB","SSC","MUS","LAW","BIM","EVE","LIN",
        "PLB","ARE","HON","DSC","NAS","SPA","BPT","PLP","EXB","MGT",
        "AED","HND","DER","NEM","STA","EXS","MGV","BPH","PMS","PLS",
        "NEP","HIN","AMS","REL","BST","FAP","APC","DEB","MGP","PSU",
        "DES","SUR","CDM","FPS","MGB","NPB","ANE","HIS","DRA","NEU",
        "HNR","VSR","POL","BIT","FMS","MPM","PBG","ANB","NSC","SAF",
        "HRT","EPS","BAX","EMS","FAH","PHR","ABI","EAS","NSU","HDE",
        "SSB","MCN","FST","POR","CAR","ABG","HPH","ECL","TCS","CHA",
        "FSM","MAT","ACC","NRS","ANG","HMR","NUT","TXC","ECN","ECH",
        "FOR","MAE","PSY","HUM","NUB","ANS","EDU","TTP","FRE","EME",
        "CHE","PSC","ANT","EAP","OBG","CHI","FRS","WAS","MDD","HYD",
        "SPH","ATM","ABT","IMM","FSE","CHN","OPT","UWP","EEC","PUL",
        "MMI","EAD","EMR","IDI","URD","OSU","CTS","ENM","GAS","PUN",
        "IST","ARB","PHA","URO","OTO","MDS","GSW","RON","EGG","IMD",
        "DVM","PMD","ECI","CLA","AHI","GMD","ART","VME","RDI","ENG",
        "IAD","PMI","GGG","VEN","CLH","MST","RNU","ASA","ICL",
        "PED","ITA","WFC","ENL","CGS","GEO","MMG","RST","AST","ENT",
        "IRE","PFS","PER","LTS","WMS","MIB","RAL","ENH","GEL"
    ]


    return subjects

def process_instructors_pandas(class_data):
    """
    Process all instructors using pandas for efficient batch operations.
    Also restructures course data: renames 'course' dict to 'course_info' 
    and adds a new 'course_id' string field (subjectCode + courseNum).
    Modifies the data in place.
    """
    if not isinstance(class_data, list):
        return
    
    # Collect all instructors for batch processing
    instructor_records = []
    instructor_refs = []  # Keep references to modify original dicts
    
    for subject_classes in class_data:
        if not isinstance(subject_classes, list):
            continue
            
        for course in subject_classes:
            if not isinstance(course, dict):
                continue
            
            # Process course info restructuring
            if 'course' in course and isinstance(course['course'], dict):
                course_dict = course['course']
                subject_code = course_dict.get('subjectCode', '')
                course_num = course_dict.get('courseNum', '')
                
                # Rename 'course' dict to 'course_info'
                course['course_info'] = course.pop('course')
                
                # Add new 'course_id' field as concatenated string
                if subject_code and course_num:
                    course['course_id'] = f"{subject_code}{course_num}"
                else:
                    course['course_id'] = ""
            
            # Collect instructor data
            instructors = course.get('instructor', [])
            if not isinstance(instructors, list):
                continue
                
            for instructor in instructors:
                if not isinstance(instructor, dict):
                    continue
                
                first_name_raw = instructor.get('firstName', '').strip()
                last_name_raw = instructor.get('lastName', '').strip()
                
                if first_name_raw or last_name_raw:
                    instructor_records.append({
                        'firstName_raw': first_name_raw,
                        'lastName_raw': last_name_raw
                    })
                    instructor_refs.append(instructor)
    
    # Process all instructors with pandas if we have any
    if instructor_records:
        logger.info(f"Processing {len(instructor_records):,} classes with pandas...")
        
        df = pd.DataFrame(instructor_records)
        
        # Batch normalize names
        df['firstName_normalized'] = df['firstName_raw'].apply(lambda x: normalize_name(x) if x else '')
        df['lastName_normalized'] = df['lastName_raw'].apply(lambda x: normalize_name(x) if x else '')
        
        # Batch create professor_ids
        df[['professor_id', 'fullName']] = df.apply(
            lambda row: pd.Series(create_professor_id(row['firstName_raw'], row['lastName_raw'])),
            axis=1
        )
        
        # Update original instructor dictionaries
        for idx, instructor in enumerate(instructor_refs):
            row = df.iloc[idx]
            
            if row['firstName_raw']:
                instructor['firstName'] = row['firstName_normalized']
            if row['lastName_raw']:
                instructor['lastName'] = row['lastName_normalized']
            
            instructor['professor_id'] = row['professor_id']
            instructor['fullName'] = row['fullName']


def process_instructors(class_data):
    """Wrapper function to maintain backward compatibility."""
    process_instructors_pandas(class_data)

# Gets classes on schedule builder API
async def search_classes_async(
    session: aiohttp.ClientSession,
    term_code: str,
    subject: str,
    semaphore: asyncio.Semaphore
) -> tuple:
    """
    Search for classes for a given term and subject asynchronously.
    Returns (subject, class_data) tuple.
    """
    # Generate unique PIDM for each request
    pidm = str(random.randint(1000000, 9999999))
    
    # Build the data payload
    filters = {
        "searchTerm": "",
        "addFilters": f"course_number=&subject={subject}&course_start_eval=At&course_start_time=-&"
                      f"course_end_eval=At&course_end_time=-&course_level=-&course_units=-&"
                      f"course_meet_type=ALL&course_status=All&sortBy=&showMe=&runMe=1&"
                      f"clearMe=&termCode={term_code}&expandFilters="
    }

    data = {
        'method': 'search',
        'termCode': term_code,
        'filters': json.dumps(filters),
        'pidm': pidm,
    }

    encoded_data = urllib.parse.urlencode(data)
    
    async with semaphore:
        try:
            async with session.post(BASE_URL, headers=HEADERS, data=encoded_data) as response:
                if response.status == 200:
                    text = await response.text()
                    text = text.strip()
                    try:
                        json_data = json.loads(text)
                        return (subject, json_data)
                    except json.JSONDecodeError:
                        return (subject, None)
                return (subject, None)
        except Exception as e:
            logger.error(f"Error fetching {subject}: {e}")
            return (subject, None)


async def fetch_all_subjects_async(term_code: str, subjects: List[str]) -> List[Any]:
    """
    Fetch all subjects concurrently using asyncio.
    """
    semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
    
    async with aiohttp.ClientSession() as session:
        tasks = [
            search_classes_async(session, term_code, subject, semaphore)
            for subject in subjects
        ]
        
        # Execute all tasks and show progress
        results = []
        completed = 0
        total = len(tasks)
        
        for coro in asyncio.as_completed(tasks):
            subject, data = await coro
            results.append(data)
            completed += 1
            logger.info(f"Fetched {subject} ({completed}/{total})")
        
        return results

async def main_async():
    """Main async function for concurrent fetching."""
    # USER INPUT: Change these values to get data for different quarters
    SEASON = 'winter'  # Options: 'winter', 'spring', 'summer', 'fall'
    YEAR = '2026'      # Example: '2025', '2026', etc.
    
    # Convert to term codes
    raw_term_code, formatted_term = season_to_term_code(SEASON, YEAR)
    
    logger.info(f"Fetching classes for {SEASON.title()} {YEAR} (Term Code: {raw_term_code})")
    logger.info(f"Using {MAX_CONCURRENT_REQUESTS} concurrent requests")
    
    subjects = get_subjects()
    
    # Fetch all subjects concurrently
    all_classes = await fetch_all_subjects_async(raw_term_code, subjects)

    # Process instructors to add normalized professor_id fields
    logger.info("Processing classes...")
    process_instructors(all_classes)

    # Save to file
    data_dir = get_data_dir(__file__)
    output_file = os.path.join(data_dir, 'class_data', f'ucd_classes_{formatted_term}.json')
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    logger.info("Saving to file...")
    with open(output_file, 'w') as f:
        json.dump(all_classes, f, indent=4)
    
    logger.info(f"Done! Saved {len(subjects)} subjects to {output_file}")


def main():
    """Entry point - runs the async main function."""
    asyncio.run(main_async())


if __name__ == '__main__':
    main()
