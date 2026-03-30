from server.utils import get_most_common_tags, parse_course_id
from server.models import Professors
from typing import Dict, Any


def _assemble_single_professor(professor: Professors) -> Dict[str, Any]:
    """
    Assembles a single professor's data with their taught courses, reviews, and AI summaries.
    Includes is_teaching information for each course.
    """
    
    course_map: Dict[str, Dict[str, Any]] = {}
    
    # Build course map with is_teaching info
    for cp in (professor.classes or []):
        cid = cp.course_id
        if not cid:
            continue
        course_map[cid] = {
            "course_id": cid,
            "course_title": (cp.course.course_title if cp.course else (cp.course_title or "")),
            "offered": bool(cp.offered),  # is_teaching_this_quarter
            "reviews": [],
        }
    
    # If no courses, return basic professor info
    if not course_map:
        return {
            "professor_id": professor.professor_id,
            "professor_name": professor.professor_name,
            "professor_slug": professor.slug,
            "department": professor.department,
            "overall_rating": professor.overall_rating,
            "level_of_difficulty": professor.level_of_difficulty,
            "common_tags": get_most_common_tags(professor.reviews or []),
            "classes": [],
        }
    
    # Add RateMyProfessor reviews
    for review in (professor.reviews or []):
        cid = review.course_id
        if cid in course_map:
            course_map[cid]["reviews"].append({
                "quality_rating": review.quality_rating,
                "difficulty_rating": review.difficulty_rating,
                "tags": review.tags or [],
                "review": review.review,
                "grade": review.grade,
                "date": review.date,
                "unique_review": False,
            })
    
    # Add Cattlelog reviews
    for cattlelog_review in (getattr(professor, "cattlelog_reviews", [])):
        if cattlelog_review.course_id in course_map:
            course_map[cattlelog_review.course_id]["reviews"].append({
                "quality_rating": cattlelog_review.quality_rating,
                "difficulty_rating": cattlelog_review.difficulty_rating,
                "tags": cattlelog_review.tags or [],
                "review": cattlelog_review.review,
                "grade": cattlelog_review.grade,
                "date": cattlelog_review.date,
                "term": cattlelog_review.term,
                "unique_review": True,
            })
    
    # Sort classes by course ID
    classes_info = sorted(course_map.values(), key=lambda x: parse_course_id(x["course_id"]))
    
    # Generate AI summary for ALL reviews across all courses
    all_review_texts = []
    for course_data in course_map.values():
        review_texts = [r["review"] for r in course_data["reviews"] if r.get("review")]
        all_review_texts.extend(review_texts)
    
    # Prepare professor info for AI summarization
    professor_info = {
        "name": professor.professor_name,
        "department": professor.department,
        "overall_rating": professor.overall_rating,
        "level_of_difficulty": professor.level_of_difficulty,
    }
        
    return {
        "professor_id": professor.professor_id,
        "professor_name": professor.professor_name,
        "professor_slug": professor.slug,
        "department": professor.department,
        "overall_rating": professor.overall_rating,
        "level_of_difficulty": professor.level_of_difficulty,
        "common_tags": get_most_common_tags(professor.reviews or []),
        "classes": classes_info,
    }
