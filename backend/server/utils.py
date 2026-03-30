import random
import re
from collections import Counter
from typing import List, Optional, Tuple
from server.models import Reviews


def parse_course_id(course_id: str) -> Tuple[str, int, str]:
    """
    Splits e.g. 'MAT21C' -> ('MAT', 21, 'C') for sorting.
    """
    match = re.match(r"^([A-Za-z]+)(\d+)([A-Za-z]*)$", course_id.strip())

    if match:
        subject_code, course_num_str, suffix = match.groups()
        return subject_code, int(course_num_str), suffix

    return course_id, 0, ""


def get_most_common_tags(reviews: List[Reviews], top_n=3) -> List[str]:
    """
    Aggregates top-N tags from a list of Review objects (where .tags is a list)
    """
    all_tags = []
    for r in reviews:
        if r.tags:
            all_tags.extend(r.tags)

    counter = Counter(all_tags)
    return [tag for tag, _ in counter.most_common(top_n)]


def get_random_review(review_list: List[Reviews]) -> Optional[Reviews]:
    """
    Select a random review from 'review_list' (if any).
    """
    if not review_list:
        return None

    return random.choice(review_list)
