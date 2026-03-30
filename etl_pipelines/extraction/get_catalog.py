"""UC Davis Catalog Scraper - Pandas Optimized Version

Collects all courses for every subject listed on the catalog index using concurrent requests.
Uses pandas for efficient deduplication and version selection.

Changes from original:
- Uses asyncio and aiohttp for concurrent scraping
- Uses pandas for data processing and deduplication
- Parses units as integer (e.g., "4 units" -> 4)
- Adds normalized course_id field
- Outputs to catalog.json

Captured fields:
    subject_code, subject_name, subject_url,
    course_id, course_code, course_title, units (int), description, course_url
"""

import json
import re
import time
import os
import asyncio
import logging
from dataclasses import dataclass, asdict
from typing import List, Tuple

import aiohttp
import pandas as pd
from bs4 import BeautifulSoup, Tag, NavigableString, Comment

from utils import normalize_course_code, get_data_dir

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

BASE = "https://catalog.ucdavis.edu/"
INDEX_URL = BASE + "courses-subject-code/"

# Regex helpers
H3_SPLIT = re.compile(r"\s*—\s*")  # en dash or hyphen-like separator
UNITS_RE = re.compile(r"\(([^)]*unit[^)]*)\)$", re.IGNORECASE)
COURSE_CODE_RE = re.compile(r"^[A-Z]{2,4}\s+\d+[A-Z]?$")  # e.g., EAE 001, MAT 021C

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml",
}

# Output path - use environment variable or determine based on script location
DATA_DIR = get_data_dir(__file__)
OUTPUT_PATH = os.path.join(DATA_DIR, "catalog.json")

# Concurrency settings
MAX_CONCURRENT_REQUESTS = 10  # Number of concurrent subject pages to fetch
POLITE_DELAY_SEC = 0.1  # Delay between batches
REQUEST_TIMEOUT = 30
RETRIES = 3

@dataclass
class CourseRow:
    subject_code: str
    subject_name: str
    subject_url: str
    course_id: str
    course_code: str
    course_title: str
    units: int
    description: str
    course_url: str
    learning_activities: str = ""
    grade_mode: str = ""
    general_education: str = ""
    general_education_tags: list = None
    prerequisites: str = ""
    version_effective_from: str = ""
    version_ended: bool = False
    repeat_credit: str = ""
    cross_listing: str = ""
    credit_limitation: str = ""
    enrollment_restriction: str = ""
    no_longer_offered: str = ""
    
    def __post_init__(self):
        # Ensure general_education_tags is initialized
        if self.general_education_tags is None:
            self.general_education_tags = []


def parse_units(units_str: str) -> int:
    """
    Parse units string to integer.
    Examples:
        "4 units" -> 4
        "1-5 units" -> 5 (take max)
        "0.5 units" -> 1 (round up)
        "Variable units" -> 0
    """
    if not units_str:
        return 0
    
    # Extract numbers from the string
    numbers = re.findall(r'\d+\.?\d*', units_str)
    if not numbers:
        return 0
    
    # Convert to floats and take the maximum (for ranges like "1-5 units")
    try:
        max_units = max(float(n) for n in numbers)
        return int(round(max_units))
    except:
        return 0


def extract_ge_tags(general_education: str) -> list:
    """
    Extract General Education tags from the general_education string.
    
    Examples:
        "Social Sciences (SS); American Cultures (ACGH)" -> ["SS", "ACGH"]
        "Writing Experience (WE)" -> ["WE"]
        "" -> []
    """
    if not general_education:
        return []
    
    # Find all text within parentheses
    tags = re.findall(r'\(([A-Z]+(?:\s+&?\s*[A-Z]+)*)\)', general_education)
    
    # Clean up tags (remove extra spaces, split if multiple codes)
    cleaned_tags = []
    for tag in tags:
        # Split by common separators and clean
        for part in re.split(r'[;,&]', tag):
            part = part.strip()
            if part:
                cleaned_tags.append(part)
    
    return cleaned_tags


async def get_soup(session: aiohttp.ClientSession, url: str) -> BeautifulSoup:
    """Fetch URL -> BeautifulSoup with retry/backoff."""
    for attempt in range(RETRIES):
        try:
            async with session.get(url, headers=HEADERS, timeout=aiohttp.ClientTimeout(total=REQUEST_TIMEOUT)) as resp:
                resp.raise_for_status()
                text = await resp.text()
                return BeautifulSoup(text, "html.parser")
        except Exception as e:
            if attempt == RETRIES - 1:
                raise
            await asyncio.sleep(1.5 * (attempt + 1))
    raise RuntimeError("Unreachable get_soup state")


def parse_subject_links(soup: BeautifulSoup) -> List[Tuple[str, str, str]]:
    """Return list of (subject_name, subject_code, subject_url)."""
    links = []
    for a in soup.select("a[href]"):
        href = a.get("href", "")
        # subject pages live under /courses-subject-code/<slug>/
        if href.startswith("/courses-subject-code/") and href.rstrip("/").count("/") == 2:
            text = " ".join(a.get_text(" ", strip=True).split())
            m = re.search(r"\(([^)]+)\)\s*$", text)
            if not m:
                continue
            subj_code = m.group(1).strip()
            subj_name = text[:m.start()].strip()
            links.append((subj_name, subj_code, BASE + href.lstrip("/")))
    
    # de-dup while preserving order
    seen = set()
    deduped = []
    for item in links:
        if item[2] not in seen:
            deduped.append(item)
            seen.add(item[2])
    return deduped


def normalize_space(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def iter_course_blocks(subject_soup: BeautifulSoup) -> List[Tag]:
    """Return list of <h3> tags that look like course headers."""
    blocks = []
    for h3 in subject_soup.find_all("h3"):
        if not isinstance(h3, Tag):
            continue
        raw = h3.get_text(" ", strip=True) or ""
        txt = normalize_space(raw)
        if "—" not in txt:
            continue
        left_right = H3_SPLIT.split(txt, maxsplit=1)
        if len(left_right) != 2:
            continue
        left, _ = left_right
        if not COURSE_CODE_RE.match(left):
            continue
        blocks.append(h3)
    return blocks


def _collect_body_until_next_h3(h3: Tag) -> List[str]:
    """Return list of paragraph-like strings under this course header until the next <h3>."""
    out: List[str] = []
    for sib in h3.next_siblings:
        if isinstance(sib, Tag) and sib.name == "h3":
            break
        if sib is None or isinstance(sib, (NavigableString, Comment)):
            continue
        try:
            txt = normalize_space(sib.get_text(" ", strip=True))
        except Exception:
            continue
        if txt:
            out.append(txt)
    return out


def extract_course_details(h3: Tag, subject_name: str, subject_code: str, subject_url: str) -> CourseRow:
    # Parse the <h3> header
    header = normalize_space(h3.get_text(" ", strip=True))
    left, right = H3_SPLIT.split(header, maxsplit=1)
    course_code = left
    title = right
    units_str = ""
    m_units = UNITS_RE.search(right)
    if m_units:
        units_str = m_units.group(1).strip()
        title = normalize_space(right[: m_units.start()].rstrip(" -—"))

    # Parse units to integer
    units = parse_units(units_str)

    # Create normalized course_id
    course_id = normalize_course_code(course_code)

    # collect body lines under this h3
    body_lines = _collect_body_until_next_h3(h3)
    body_text = " ".join(body_lines)
    ended_seen = any("this version has ended;" in line.lower() for line in body_lines)

    # If ended is announced, try to find updated course info (nested or next h3)
    if ended_seen:
        nested_pattern = re.compile(
            re.escape(course_code) + r"\s*[—–-]\s*(.+?)\s*\(([^)]+unit[^)]*)\)",
            re.IGNORECASE
        )
        nested_match = nested_pattern.search(body_text)
        
        if nested_match:
            title = nested_match.group(1).strip()
            units_str = nested_match.group(2).strip()
            units = parse_units(units_str)
            body_text = body_text[nested_match.end():]
            body_lines = [body_text]
            
        else:
            # 2. Fallback: Jump to the next h3 and ensure it's the same course_code.
            next_h3 = h3.find_next("h3")
            if isinstance(next_h3, Tag):
                next_header = normalize_space(next_h3.get_text(" ", strip=True) or "")
                parts = H3_SPLIT.split(next_header, maxsplit=1)
                if len(parts) == 2 and parts[0] == course_code:
                    # Switch to the newer block
                    h3 = next_h3
                    _, right = parts
                    title = right
                    m_units = UNITS_RE.search(right)
                    if m_units:
                        units_str = m_units.group(1).strip()
                        units = parse_units(units_str)
                        title = normalize_space(right[: m_units.start()].rstrip(" -—"))
                    body_lines = _collect_body_until_next_h3(h3)
                    body_text = " ".join(body_lines)

    # Initialize fields
    description = ""
    learning_activities = ""
    grade_mode = ""
    general_ed = ""
    prereq = ""
    version_effective_from = ""
    repeat_credit = ""
    cross_listing = ""
    credit_limitation = ""
    enrollment_restriction = ""
    no_longer_offered = ""

    # Regexes
    # Lookahead pattern for fields that stop at the next field or end of string
    NEXT_FIELD = r"(?=(?:\s+Enrollment Restriction\(s\):|\s+Credit Limitation\(?s\)?:|\s+Repeat Credit:|\s+Cross Listing:|\s+Grade Mode:|\s+General Education:|\s+This course version is effective|$))"
    
    LA_RE       = re.compile(r"\bLearning Activities:\s*(.+?)" + NEXT_FIELD, re.IGNORECASE)
    RESTRICT_RE = re.compile(r"\bEnrollment Restriction\(s\):\s*(.+?)" + NEXT_FIELD, re.IGNORECASE)
    LIMIT_RE    = re.compile(r"\bCredit Limitation\(?s\)?:?\s*(.+?)" + NEXT_FIELD, re.IGNORECASE)
    REPEAT_RE   = re.compile(r"\bRepeat Credit:\s*(.+?)" + NEXT_FIELD, re.IGNORECASE)
    CROSS_RE    = re.compile(r"\bCross Listing:\s*(.+?)" + NEXT_FIELD, re.IGNORECASE)
    
    GM_RE       = re.compile(r"\bGrade Mode:\s*([^.]+)", re.IGNORECASE)
    GE_RE       = re.compile(r"\bGeneral Education:\s*([^.]+)", re.IGNORECASE)
    DESC_RE     = re.compile(r"\bCourse Description:\s*(.+)", re.IGNORECASE)
    EFF_RE      = re.compile(r"This course version is effective.*?:\s*(.+?)(?:\.\s*|$)", re.IGNORECASE)
    NO_OFFER_RE = re.compile(r"Starting\s+([A-Za-z]+\s+Quarter\s+\d{4}).*?no\s+longer\s+offered\.?", re.IGNORECASE)

    # Helper to extract last match
    def get_last_match(regex, text):
        matches = list(regex.finditer(text))
        return matches[-1].group(1).strip(' .') if matches else ""

    learning_activities = get_last_match(LA_RE, body_text)
    if learning_activities:
        learning_activities += "."

    enrollment_restriction = get_last_match(RESTRICT_RE, body_text)
    credit_limitation = get_last_match(LIMIT_RE, body_text)
    repeat_credit = get_last_match(REPEAT_RE, body_text)
    cross_listing = get_last_match(CROSS_RE, body_text)
    grade_mode = get_last_match(GM_RE, body_text)
    general_ed = get_last_match(GE_RE, body_text)

    m_eff = EFF_RE.search(body_text)
    if m_eff:
        version_effective_from = m_eff.group(1).strip(' .')
        
    m_no_offer = NO_OFFER_RE.search(body_text)
    if m_no_offer:
        no_longer_offered = m_no_offer.group(1).strip(' .')

    for line in body_lines:
        if not line:
            continue
        low = line.lower()

        if not description:
            m = DESC_RE.search(line)
            if m:
                description = m.group(1).strip(' .')

        if not prereq and ("prerequisite:" in low or "prerequisite(s):" in low):
            m = re.search(r"\bPrerequisite\(s\)?:\s*(.+)", line, flags=re.IGNORECASE)
            if m:
                prereq = m.group(1).strip(' .')

    # Extract GE tags from the general education string
    ge_tags = extract_ge_tags(general_ed)
    
    return CourseRow(
        subject_code=subject_code,
        subject_name=subject_name,
        subject_url=subject_url,
        course_id=course_id,
        course_code=course_code,
        course_title=title,
        units=units,
        description=description,
        course_url=subject_url,
        learning_activities=learning_activities,
        grade_mode=grade_mode,
        general_education=general_ed,
        general_education_tags=ge_tags,
        prerequisites=prereq,
        version_effective_from=version_effective_from,
        version_ended=ended_seen,
        repeat_credit=repeat_credit,
        cross_listing=cross_listing,
        credit_limitation=credit_limitation,
        enrollment_restriction=enrollment_restriction,
        no_longer_offered=no_longer_offered,
    )


def parse_effective_date(effective: str) -> Tuple[int, int]:
    """Parse effective date string into (year, quarter_index) tuple."""
    if not effective:
        return (0, 0)
    eff = effective.lower()
    quarters = {"winter": 1, "spring": 2, "summer": 3, "fall": 4}
    year = 0
    qidx = 0
    for q in quarters:
        if q in eff:
            qidx = quarters[q]
            break
    m = re.search(r"(20\d{2})", eff)
    if m:
        year = int(m.group(1))
    return (year, qidx)


def choose_best_versions_pandas(courses: List[CourseRow]) -> pd.DataFrame:
    """
    Choose the best course version for each course using pandas.
    
    Selection criteria (in order):
    1. Active (not ended) courses with effective dates (most recent)
    2. Active courses without dates
    3. Ended courses with effective dates (most recent)
    4. Ended courses without dates
    """
    if not courses:
        return pd.DataFrame()
    
    # Convert to DataFrame
    df = pd.DataFrame([asdict(c) for c in courses])
    
    # Parse effective dates into sortable columns
    df[['eff_year', 'eff_quarter']] = df['version_effective_from'].apply(
        lambda x: pd.Series(parse_effective_date(x))
    )
    
    # Create priority score for sorting
    # Lower score = higher priority
    # Priority: active with date (0) > active no date (1) > ended with date (2) > ended no date (3)
    def get_priority(row):
        if not row['version_ended']:
            return 0 if row['version_effective_from'] else 1
        else:
            return 2 if row['version_effective_from'] else 3
    
    df['priority'] = df.apply(get_priority, axis=1)
    
    # Sort by: course_code, priority, year (desc), quarter (desc)
    df_sorted = df.sort_values(
        ['course_code', 'priority', 'eff_year', 'eff_quarter'],
        ascending=[True, True, False, False]
    )
    
    # Take first (best) version of each course
    best_versions = df_sorted.groupby('course_code', as_index=False).first()
    
    # Extract GE tags using pandas (in case any were missed)
    best_versions['general_education_tags'] = best_versions['general_education'].apply(extract_ge_tags)
    
    # Drop helper columns
    best_versions = best_versions.drop(columns=['eff_year', 'eff_quarter', 'priority'])
    
    return best_versions


async def scrape_subject(
    session: aiohttp.ClientSession,
    subject_name: str,
    subject_code: str,
    subject_url: str,
    semaphore: asyncio.Semaphore
) -> Tuple[str, List[CourseRow]]:
    """Scrape a single subject page and return list of CourseRow objects."""
    async with semaphore:
        try:
            subj_soup = await get_soup(session, subject_url)
            
            courses = []
            for h3 in iter_course_blocks(subj_soup):
                try:
                    row = extract_course_details(h3, subject_name, subject_code, subject_url)
                    courses.append(row)
                except Exception as e:
                    logger.error(f"Parse error in {subject_code}: {e}")
                    continue
            
            return (subject_code, courses)
        except Exception as e:
            logger.error(f"Failed to fetch {subject_code} {subject_url}: {e}")
            return (subject_code, [])


async def scrape_all_async() -> pd.DataFrame:
    """Scrape all subjects concurrently and return a DataFrame of chosen courses."""
    # First, get the index page to find all subjects
    async with aiohttp.ClientSession() as session:
        index_soup = await get_soup(session, INDEX_URL)
        subjects = parse_subject_links(index_soup)
        logger.info(f"Found {len(subjects)} subject pages")
        logger.info(f"Using {MAX_CONCURRENT_REQUESTS} concurrent requests")

    # Now scrape all subjects concurrently
    semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
    all_courses: List[CourseRow] = []
    
    async with aiohttp.ClientSession() as session:
        tasks = [
            scrape_subject(session, subj_name, subj_code, subj_url, semaphore)
            for subj_name, subj_code, subj_url in subjects
        ]
        
        # Process as they complete
        completed = 0
        total = len(tasks)
        
        for coro in asyncio.as_completed(tasks):
            subject_code, courses = await coro
            completed += 1
            
            if courses:
                all_courses.extend(courses)
                logger.info(f"{subject_code}: {len(courses)} courses ({completed}/{total})")
            else:
                logger.warning(f"{subject_code}: 0 courses ({completed}/{total})")
    
    # Choose best versions using pandas
    logger.info("Selecting best course versions with pandas...")
    logger.info(f"Processing {len(all_courses):,} total course versions")
    
    best_versions_df = choose_best_versions_pandas(all_courses)
    
    logger.info(f"Selected {len(best_versions_df):,} unique courses")
    
    return best_versions_df


async def main_async():
    """Main async function."""
    start_time = time.time()
    
    logger.info("="*60)
    logger.info("UC Davis Catalog Scraper - Pandas Optimized")
    logger.info("="*60)
    
    # Scrape all courses
    courses_df = await scrape_all_async()
    
    # Write output
    logger.info(f"Writing to {OUTPUT_PATH}...")
    os.makedirs(DATA_DIR, exist_ok=True)
    
    # Convert DataFrame to list of dicts for JSON
    courses_list = courses_df.to_dict('records')
    
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(courses_list, f, ensure_ascii=False, indent=2)
    
    # Calculate stats
    end_time = time.time()
    elapsed = end_time - start_time
    minutes = int(elapsed // 60)
    seconds = int(elapsed % 60)
    
    # Generate summary statistics with pandas
    logger.info("Data Summary:")
    logger.info(f"  Total courses: {len(courses_df):,}")
    logger.info(f"  Unique subjects: {courses_df['subject_code'].nunique()}")
    logger.info(f"  Avg units: {courses_df['units'].mean():.1f}")
    logger.info(f"  Active courses: {(~courses_df['version_ended']).sum():,}")
    logger.info(f"  Ended courses: {courses_df['version_ended'].sum():,}")
    
    # Count courses with GE tags
    courses_with_ge = courses_df['general_education_tags'].apply(lambda x: len(x) > 0 if isinstance(x, list) else False).sum()
    logger.info(f"  Courses with GE tags: {courses_with_ge:,} ({courses_with_ge/len(courses_df)*100:.1f}%)")
    
    # Count unique GE tags
    all_ge_tags = []
    for tags in courses_df['general_education_tags']:
        if isinstance(tags, list):
            all_ge_tags.extend(tags)
    unique_ge_tags = set(all_ge_tags)
    logger.info(f"  Unique GE tags: {len(unique_ge_tags)}")
    
    logger.info("="*60)
    logger.info("COMPLETED!")
    logger.info("="*60)
    logger.info(f"Total courses: {len(courses_df):,}")
    logger.info(f"Total runtime: {minutes}m {seconds}s")
    logger.info(f"Output saved to: {OUTPUT_PATH}")
    logger.info("="*60)


def main():
    """Entry point - runs the async main function."""
    asyncio.run(main_async())


if __name__ == "__main__":
    main()

