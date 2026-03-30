import os
import json
import requests
import time
import logging
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from utils import get_data_dir

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def get_professors_via_api(school_id="1073", max_pages=None):
    """
    Fetch professor IDs directly via RateMyProfessors GraphQL API.
    Much faster than scraping - no browser automation needed!
    
    Args:
        school_id: School ID (1073 = UC Davis)
        max_pages: Max number of pages to fetch (None = all)
    """
    import base64
    
    # RMP now uses base64-encoded global IDs in format "School-{id}"
    # Convert numeric school_id to the new format
    if school_id.isdigit():
        global_school_id = base64.b64encode(f"School-{school_id}".encode()).decode()
        logger.info(f"Using encoded school ID: {global_school_id} (decoded: School-{school_id})")
    else:
        global_school_id = school_id
    
    # Create a session to maintain cookies
    session = requests.Session()
    
    # Set up retry strategy
    retry_strategy = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    
    # First, visit the search page to get cookies (mimic real browser)
    search_url = f"https://www.ratemyprofessors.com/search/professors/{school_id}?q=*"
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
    }
    
    try:
        logger.info("Visiting search page to establish session...")
        response = session.get(search_url, headers=headers, timeout=10)
        response.raise_for_status()
        time.sleep(1)  # Brief delay to look more natural
    except Exception as e:
        logger.warning(f"Could not visit search page: {e}")
    
    # Now make GraphQL requests
    url = "https://www.ratemyprofessors.com/graphql"
    
    # This is the GraphQL query RMP uses (updated to match current API)
    # Note: RMP API has a max limit, so we need to paginate
    query = """
    query NewSearchTeachersQuery($query: TeacherSearchQuery!, $after: String) {
      newSearch {
        teachers(query: $query, first: 1000, after: $after) {
          edges {
            cursor
            node {
              id
              legacyId
              firstName
              lastName
              school {
                name
                id
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
          resultCount
        }
      }
    }
    """
    
    graphql_headers = {
        "Content-Type": "application/json",
        "Authorization": "Basic dGVzdDp0ZXN0",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": "https://www.ratemyprofessors.com",
        "Referer": search_url,
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
    }
    
    professor_ids = set()
    cursor = None
    page = 0
    
    while True:
        if max_pages and page >= max_pages:
            break
            
        variables = {
            "query": {
                "text": "",
                "schoolID": global_school_id,
                "fallback": True,
                "departmentID": None
            },
            "after": cursor  # Cursor is passed as a separate variable
        }
        
        try:
            response = session.post(
                url,
                json={"query": query, "variables": variables},
                headers=graphql_headers,
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            
            # Check for errors in response
            if "errors" in data:
                logger.error(f"GraphQL error: {data['errors']}")
                break
            
            # Extract teachers data
            if not data.get("data") or not data["data"].get("newSearch"):
                logger.error(f"Unexpected response structure: {data}")
                break
            
            teachers = data["data"]["newSearch"].get("teachers")
            if not teachers:
                logger.warning("No teachers data in response")
                break
            
            # Show total result count on first page
            result_count = teachers.get("resultCount")
            if page == 0 and result_count:
                logger.info(f"Total professors at UC Davis: {result_count}")
                
            edges = teachers.get("edges", [])
            
            if not edges:
                logger.warning("No edges in response")
                break
            
            # Extract professor IDs
            for edge in edges:
                node = edge.get("node", {})
                legacy_id = node.get("legacyId")
                if legacy_id:
                    professor_ids.add(str(legacy_id))
            
            logger.info(f"Page {page}: Found {len(edges)} professors, total so far: {len(professor_ids)}")
            
            # Check if there are more pages
            page_info = teachers.get("pageInfo", {})
            has_next = page_info.get("hasNextPage", False)
            cursor = page_info.get("endCursor")
            
            logger.debug(f"  hasNextPage: {has_next}, endCursor: {cursor[:50] if cursor else None}...")
            
            if not has_next:
                logger.info(f"Finished! Collected all {len(professor_ids)} professors")
                break
            
            if not cursor:
                logger.warning("No cursor for next page, stopping")
                break
                
            page += 1
            
            # Small delay to be respectful
            time.sleep(0.5)
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error on page {page}: {e}")
            break
        except Exception as e:
            logger.error(f"Error on page {page}: {e}")
            logger.debug(f"Response status: {response.status_code if 'response' in locals() else 'N/A'}")
            if 'response' in locals():
                logger.debug(f"Response text: {response.text[:500]}")
            break
    
    session.close()
    return professor_ids


def main():
    data_dir = get_data_dir(__file__)
    output_file = os.path.join(data_dir, "rmp_ids.json")
    
    logger.info("Fetching professor IDs via API...")
    start_time = time.time()
    
    # Set max_pages=None to get all professors, or a number to limit
    professor_ids = get_professors_via_api(school_id="1073", max_pages=None)
    
    elapsed = time.time() - start_time
    logger.info(f"Fetched {len(professor_ids)} professor IDs in {elapsed:.2f} seconds")
    
    # Save to file
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(sorted(list(professor_ids)), f, indent=4)
    
    logger.info(f"Saved to {output_file}")


if __name__ == "__main__":
    main()