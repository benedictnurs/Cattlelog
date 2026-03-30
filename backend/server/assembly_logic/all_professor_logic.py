from server.utils import get_most_common_tags, parse_course_id
from typing import List, Dict, Any
from server.models import Professors, ClassesProfessors

def _all_assemble_professors(professors: List[Professors]) -> List[dict]:
    """
    Professor data with their taught courses and reviews into a clear structure.
    """

    profs: List[Dict[str, Any]] = []

    for prof in professors:
        course_map: Dict[str, Dict[str, Any]] = {}
        for cp in (prof.classes or []):
            cid = cp.course_id
            if not cid:
                continue
            course_map[cid] = {
                "course_id": cid,
                "course_title": (cp.course.course_title if cp.course else (cp.course_title or "")),
                "offered": bool(cp.offered),
                "reviews": [],
            }
        if not course_map:
            profs.append({
                "professor_id": prof.professor_id,
                "professor_name": prof.professor_name,
                "professor_slug": prof.slug,
                "department": prof.department,
                "overall_rating": prof.overall_rating,
                "level_of_difficulty": prof.level_of_difficulty,
                "common_tags": get_most_common_tags(prof.reviews or []),
                "classes": [],
            })
            continue
        for review in (prof.reviews or []):
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
        for cattlelog_review in (getattr(prof, "cattlelog_reviews", [])):
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
        classes_info = sorted(course_map.values(), key=lambda x: parse_course_id(x["course_id"]))
        profs.append({
            "professor_id": prof.professor_id,
            "professor_name": prof.professor_name,
            "professor_slug": prof.slug,
            "department": prof.department,
            "overall_rating": prof.overall_rating,
            "level_of_difficulty": prof.level_of_difficulty,
            "common_tags": get_most_common_tags(prof.reviews or []),
            "classes": classes_info,
        })

    profs.sort(key=lambda x: ((x["department"] or "").lower(), (x["professor_name"] or "").lower()))
    return profs