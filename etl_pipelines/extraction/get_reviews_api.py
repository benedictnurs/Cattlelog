import os
import json
import time
import logging
import base64
import re
from datetime import datetime
from typing import List, Dict, Any, Optional
import random
import asyncio

import aiohttp
from aiohttp import ClientSession, ClientTimeout
import pandas as pd

from utils import create_professor_id, normalize_course_code, get_data_dir

########################################
# Config / Globals
########################################

logging.basicConfig(level=logging.INFO)

# Tune this for parallelism - number of concurrent requests
# IMPORTANT: Lower value = less likely to hit rate limits
# Recommended: 2-3 concurrent requests for ~5000 professors (RMP is strict!)
MAX_CONCURRENT_REQUESTS = 2

# GraphQL endpoint
GRAPHQL_URL = "https://www.ratemyprofessors.com/graphql"

# Rate limiting settings
MIN_DELAY = 0.8  # Minimum delay between requests (seconds)
MAX_DELAY = 1.5  # Maximum delay between requests (seconds)
RATE_LIMIT_BACKOFF = 30  # Wait time when hitting 429 (seconds)
REQUEST_TIMEOUT = 30  # Timeout for each request (seconds)

########################################
# Department Similarity Matching
########################################

def departments_similar(dept1: str, dept2: str) -> bool:
    """
    Check if two department names have significant similarity.
    Returns True if they share a common word (excluding common words like "and", "of", etc.)
    
    Examples:
        "Agricultural Economics" & "Agricultural & Resource Economics" -> True (share "Agricultural", "Economics")
        "Mathematics" & "Statistics" -> False
    """
    if not dept1 or not dept2:
        return False
    
    # Normalize departments: lowercase, remove punctuation
    dept1_clean = re.sub(r'[^\w\s]', ' ', dept1.lower())
    dept2_clean = re.sub(r'[^\w\s]', ' ', dept2.lower())
    
    # Split into words
    words1 = set(dept1_clean.split())
    words2 = set(dept2_clean.split())
    
    # Common words to ignore
    ignore_words = {'and', 'of', 'the', 'for', 'in', 'at', 'to', 'a', 'an', '&'}
    words1 -= ignore_words
    words2 -= ignore_words
    
    # Check for intersection (shared words)
    common_words = words1 & words2
    
    # Return True if they share meaningful words
    return len(common_words) > 0


########################################
# Async GraphQL API Calls
########################################

async def get_professor_reviews(
    session: ClientSession,
    professor_id: str,
    semaphore: asyncio.Semaphore,
    progress_counter: dict = None,  # Shared counter dict with 'count' and 'total'
    professor_registry: dict = None,  # Dict mapping professor_id -> professor data for merging
    id_lock: asyncio.Lock = None,  # Lock for thread-safe ID generation
    retry_count: int = 0,
    max_retries: int = 5
) -> Optional[Dict[str, Any]]:
    """
    Fetch all reviews for a single professor using GraphQL API.
    Returns a dict with professor info and reviews.
    Includes exponential backoff for rate limiting.
    """
    
    # Convert to base64 Teacher ID
    teacher_global_id = base64.b64encode(f"Teacher-{professor_id}".encode()).decode()
    
    # GraphQL query for fetching professor details and reviews
    query = """
    query TeacherRatingsPageQuery($id: ID!) {
      node(id: $id) {
        ... on Teacher {
          id
          legacyId
          firstName
          lastName
          school {
            name
            id
          }
          department
          avgRating
          avgDifficulty
          wouldTakeAgainPercent
          ratingsDistribution {
            total
          }
          ratings(first: 1000) {
            edges {
              node {
                id
                comment
                date
                class
                helpfulRating
                clarityRating
                difficultyRating
                grade
                attendanceMandatory
                wouldTakeAgain
                isForOnlineClass
                ratingTags
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    }
    """
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Basic dGVzdDp0ZXN0",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": "https://www.ratemyprofessors.com",
        "Referer": f"https://www.ratemyprofessors.com/professor/{professor_id}",
    }
    
    all_reviews = []
    cursor = None
    
    try:
        # Random delay BEFORE acquiring semaphore - critical for throughput!
        # This allows other requests to proceed while we're sleeping
        delay = random.uniform(MIN_DELAY, MAX_DELAY)
        await asyncio.sleep(delay)
        
        rate_limited = False
        wait_time = 0
        
        async with semaphore:
            # Fetch first page of reviews
            variables = {"id": teacher_global_id}
            
            async with session.post(
                GRAPHQL_URL,
                json={"query": query, "variables": variables},
                headers=headers,
                timeout=ClientTimeout(total=REQUEST_TIMEOUT)
            ) as response:
                
                # Handle rate limiting with exponential backoff + jitter
                if response.status == 429:
                    rate_limited = True
                    if retry_count < max_retries:
                        # Exponential backoff: 30s, 60s, 120s, 240s, 480s
                        base_wait = RATE_LIMIT_BACKOFF * (2 ** retry_count)
                        # Add jitter (0-5s) to prevent thundering herd
                        jitter = random.uniform(0, 5)
                        wait_time = base_wait + jitter
                        logging.warning(f"Rate limited! Waiting {wait_time:.1f}s before retry {retry_count + 1}/{max_retries} for professor {professor_id}")
                    else:
                        logging.error(f"Max retries reached for professor {professor_id} due to rate limiting")
                        return None
                else:
                    response.raise_for_status()
                    data = await response.json()
        
        # If we got rate limited, sleep OUTSIDE semaphore and retry
        if rate_limited:
            if retry_count < max_retries:
                await asyncio.sleep(wait_time)
                logging.info(f"Retrying professor {professor_id} after rate limit backoff...")
                return await get_professor_reviews(session, professor_id, semaphore, progress_counter, professor_registry, id_lock, retry_count + 1, max_retries)
            else:
                return None  # Max retries reached
        
        # Check for errors
        if "errors" in data:
            logging.warning(f"GraphQL error for professor {professor_id}: {data['errors']}")
            return None
        
        # Extract professor data
        teacher_node = data.get("data", {}).get("node")
        if not teacher_node:
            logging.warning(f"No data for professor {professor_id}")
            return None
        
        # Get first and last name
        first_name_raw = teacher_node.get('firstName', '').strip()
        last_name_raw = teacher_node.get('lastName', '').strip()
        
        # Create normalized professor_id and full name using shared utility
        base_prof_id, professor_name = create_professor_id(first_name_raw, last_name_raw)
        
        # Fallback if name is empty
        if not base_prof_id or base_prof_id == "unknown":
            base_prof_id = f"unknown-{professor_id}"
        
        # Get department early to check for merging
        department = teacher_node.get("department", "")
        
        # Extract reviews
        ratings = teacher_node.get("ratings", {})
        edges = ratings.get("edges", [])
        
        # Skip professors with no reviews/ratings
        if not edges or len(edges) == 0:
            return None
        
        for edge in edges:
            rating = edge.get("node", {})
            
            # Parse date
            date_str = rating.get("date", "")
            formatted_date = "N/A"
            if date_str:
                try:
                    # RMP API can return various formats:
                    # "2015-12-16 13:37:32 +0000 UTC"
                    # "2024-10-03T00:00:00.000Z"
                    # "2024-10-03"
                    
                    # Try parsing "YYYY-MM-DD HH:MM:SS +0000 UTC" format first
                    if " " in date_str and "UTC" in date_str:
                        # Format: "2015-12-16 13:37:32 +0000 UTC"
                        date_part = date_str.split(" ")[0]  # Get "2015-12-16"
                        date_obj = datetime.strptime(date_part, "%Y-%m-%d")
                    elif "T" in date_str:
                        # Format: "2024-10-03T00:00:00.000Z"
                        clean_date = date_str.replace("Z", "").split("T")[0]
                        date_obj = datetime.fromisoformat(clean_date)
                    else:
                        # Format: "2024-10-03"
                        date_obj = datetime.fromisoformat(date_str)
                    
                    # Format as MM/DD/YYYY to match original format (e.g., "03/24/2010")
                    formatted_date = date_obj.strftime("%m/%d/%Y")
                except Exception:
                    # Fallback: try to extract just YYYY-MM-DD if present
                    try:
                        match = re.search(r'(\d{4})-(\d{2})-(\d{2})', date_str)
                        if match:
                            year, month, day = match.groups()
                            formatted_date = f"{month}/{day}/{year}"
                        else:
                            formatted_date = "N/A"
                    except:
                        formatted_date = "N/A"
            
            # Normalize course code using shared utility
            course_raw = rating.get("class", "")
            course_normalized = normalize_course_code(course_raw) if course_raw else "N/A"
            
            # Extract ratings
            quality_rating = rating.get("clarityRating", "N/A")
            difficulty_rating = rating.get("difficultyRating", "N/A")
            
            # Extract metadata
            grade = rating.get("grade", "N/A") or "N/A"
            attendance = "Mandatory" if rating.get("attendanceMandatory") else "Not Mandatory"
            would_take_again = "Yes" if rating.get("wouldTakeAgain") else "No" if rating.get("wouldTakeAgain") is False else "N/A"
            
            # Extract tags
            tags_str = rating.get("ratingTags", "")
            tags_list = [tag.strip() for tag in tags_str.split("--") if tag.strip()] if tags_str else []
            
            # Review text
            review_text = rating.get("comment", "N/A") or "N/A"
            
            review_data = {
                "course_id": course_normalized,
                "professor": professor_name,
                "date": formatted_date,
                "quality_rating": quality_rating,
                "difficulty_rating": difficulty_rating,
                "review": review_text,
                "grade": grade,
                "attendance": attendance,
                "would_take_again": would_take_again,
                "tags": tags_list,
            }
            
            all_reviews.append(review_data)
        
        # Deduplicate reviews using pandas (remove exact duplicates)
        if len(all_reviews) > 1:
            reviews_df = pd.DataFrame(all_reviews)
            # Remove duplicate reviews (same course, date, and review text)
            reviews_df = reviews_df.drop_duplicates(
                subset=['course_id', 'date', 'review', 'quality_rating', 'difficulty_rating'],
                keep='first'
            )
            all_reviews = reviews_df.to_dict('records')
        
        # Determine unique ID with merging logic (thread-safe)
        unique_prof_id = base_prof_id
        should_merge = False
        existing_prof = None
        
        if professor_registry is not None and id_lock is not None:
            async with id_lock:
                # Check if base ID already exists
                if base_prof_id in professor_registry:
                    existing_prof = professor_registry[base_prof_id]
                    existing_dept = existing_prof.get("department", "")
                    
                    # Check if departments are similar
                    if departments_similar(department, existing_dept):
                        # Merge with existing professor
                        should_merge = True
                        unique_prof_id = base_prof_id
                        logging.info(f"Merging {professor_name} ({department}) with existing entry ({existing_dept})")
                    else:
                        # Different department, create new ID with counter
                        counter = 1
                        unique_prof_id = f"{base_prof_id}-{counter}"
                        while unique_prof_id in professor_registry:
                            counter += 1
                            unique_prof_id = f"{base_prof_id}-{counter}"
                else:
                    # First time seeing this name
                    unique_prof_id = base_prof_id
        
        # Build result
        result = {
            "professor_id": unique_prof_id,
            "rmp_id": professor_id,  # Keep original RMP ID for reference
            "professor_name": professor_name,
            "url": f"https://www.ratemyprofessors.com/professor/{professor_id}",
            "department": department,
            "school": teacher_node.get("school", {}).get("name", ""),
            "overall_rating": teacher_node.get("avgRating"),
            "level_of_difficulty": teacher_node.get("avgDifficulty"),
            "would_take_again_percentage": teacher_node.get("wouldTakeAgainPercent"),
            "number_of_ratings": len(all_reviews),
            "reviews": all_reviews,
            "classes": list(set([r["course_id"] for r in all_reviews if r["course_id"] != "N/A"])),
        }
        
        # If merging, combine reviews with existing professor
        if should_merge and existing_prof:
            async with id_lock:
                # Combine reviews
                existing_prof["reviews"].extend(all_reviews)
                existing_prof["number_of_ratings"] = len(existing_prof["reviews"])
                
                # Combine classes
                all_classes = set(existing_prof["classes"]) | set(result["classes"])
                existing_prof["classes"] = list(all_classes)
                
            
            # Return None since we merged into existing entry
            return None
        else:
            # Register this new professor
            if professor_registry is not None and id_lock is not None:
                async with id_lock:
                    professor_registry[unique_prof_id] = result
        
        # Log progress counter at intervals (every 10 profs)
        if progress_counter:
            progress_counter['count'] += 1
            completed = progress_counter['count']
            total = progress_counter['total']
            if completed % 10 == 0 or completed == total:
                logging.info(f"✓ Fetched {completed} profs (out of {total})")
        return result
        
    except aiohttp.ClientError as e:
        logging.error(f"✗ Network error fetching professor {professor_id}: {e}")
        return None
    except Exception as e:
        logging.error(f"✗ Error processing professor {professor_id}: {e}")
        return None


########################################
# Async Processing
########################################

async def fetch_all_professors(professor_ids: List[str]) -> List[Dict[str, Any]]:
    """
    Fetch all professors concurrently using asyncio and aiohttp.
    Uses a semaphore to limit concurrent requests and avoid rate limiting.
    Merges professors with similar departments.
    """
    semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
    total_count = len(professor_ids)
    
    # Shared progress counter (mutable dict so all tasks can update it)
    progress_counter = {'count': 0, 'total': total_count}
    
    # Shared registry to track professors for merging (professor_id -> professor data)
    professor_registry = {}
    
    # Lock for thread-safe ID generation and merging
    id_lock = asyncio.Lock()
    
    # Create aiohttp session with proper timeout and connector settings
    timeout = ClientTimeout(total=REQUEST_TIMEOUT)
    connector = aiohttp.TCPConnector(limit=MAX_CONCURRENT_REQUESTS, limit_per_host=MAX_CONCURRENT_REQUESTS)
    
    async with ClientSession(timeout=timeout, connector=connector) as session:
        # Create tasks for all professors with shared registry
        tasks = [
            get_professor_reviews(session, prof_id, semaphore, progress_counter, professor_registry, id_lock)
            for prof_id in professor_ids
        ]
        
        # Execute all tasks concurrently and gather results
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Results are now in professor_registry (merged entries)
        # Return the values from the registry
        valid_results = list(professor_registry.values())
        
        # Log any exceptions
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logging.error(f"✗ Exception for professor {professor_ids[i]}: {result}")
        
        return valid_results


########################################
# Main
########################################

async def main_async():
    start_time = time.time()
    data_dir = get_data_dir(__file__)
    
    input_file = os.path.join(data_dir, "rmp_ids.json")
    output_file = os.path.join(data_dir, "ucdavis_professors_reviews.json")

    if not os.path.exists(input_file):
        logging.error(f"Input file {input_file} not found.")
        return

    try:
        with open(input_file, "r", encoding="utf-8") as f:
            prof_list = json.load(f)
    except Exception as e:
        logging.error(f"Could not read input JSON: {e}")
        return

    if not isinstance(prof_list, list):
        logging.error("Input file is not a list of professor IDs.")
        return

    logging.info(f"Processing {len(prof_list)} professors with {MAX_CONCURRENT_REQUESTS} concurrent requests...")
    logging.info(f"Rate limiting: {MIN_DELAY}-{MAX_DELAY}s delay between requests")
    

    # Fetch all professors concurrently
    collected_results = await fetch_all_professors(prof_list)

    # Write professor data JSON
    try:
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(collected_results, f, ensure_ascii=False, indent=4)
        logging.info(f"✅ Wrote {len(collected_results)} professor records to {output_file}")
    except Exception as e:
        logging.error(f"Failed to write output JSON: {e}")

    end_time = time.time()
    elapsed = end_time - start_time
    hours = int(elapsed // 3600)
    minutes = int((elapsed % 3600) // 60)
    seconds = int(elapsed % 60)
    
    # Calculate total reviews
    total_reviews = sum(prof.get("number_of_ratings", 0) for prof in collected_results)
    success_rate = (len(collected_results) / len(prof_list)) * 100
    
    logging.info(f"\n{'='*60}")
    logging.info(f"✅ COMPLETED!")
    logging.info(f"{'='*60}")
    logging.info(f"📊 Professors processed: {len(collected_results)}/{len(prof_list)} ({success_rate:.1f}%)")
    logging.info(f"📝 Total reviews fetched: {total_reviews:,}")
    logging.info(f"⏱️  Total runtime: {hours}h {minutes}m {seconds}s")
    logging.info(f"⚡ Average speed: {elapsed/len(prof_list):.2f}s per professor")
    logging.info(f"💾 Output saved to: {output_file}")
    logging.info(f"{'='*60}\n")


def main():
    """Entry point - runs the async main function."""
    asyncio.run(main_async())


if __name__ == "__main__":
    main()

