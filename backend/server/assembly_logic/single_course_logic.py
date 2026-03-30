from server.utils import get_random_review, get_most_common_tags
import numpy

def _assemble_single_course_details(course):
    """
    Organizes a single course's details with associated reviews and professors.
    Includes professors who have NO reviews on this course.
    """

    # Build a map professor_id -> list[Review]
    review_map = {}
    for rv in course.reviews:
        if rv.professor:  # Ensure the professor relationship exists
            review_map.setdefault(rv.professor_id, []).append(rv)

    # fetching isTeaching this course
    teaching_prof_ids = {
        prof.professor_id
        for prof in course.classes_professors
        if getattr(prof, "offered", False)
    }

    professor_summaries = []
    ratings = [] # collect numeric ratings for course average

    for p in course.classes_professors:
        professor = p.professor
        revs = review_map.get(p.professor_id, [])

        # Use RMP overall rating (even if no course reviews)
        if professor.overall_rating is not None:
            avg_prof_rating = round(float(professor.overall_rating), 2)
        else:
            avg_prof_rating = "N/A"
        if isinstance(avg_prof_rating, (int, float)):
            ratings.append(avg_prof_rating)

        rand_rev = get_random_review(revs)

        professor_summaries.append({
            "professor_name": professor.professor_name,
            "id": professor.professor_id,
            "slug": professor.slug,
            "department": professor.department,
            "overall_rating": avg_prof_rating,
            "level_of_difficulty": professor.level_of_difficulty,
            "review": rand_rev.review if rand_rev else "No reviews available",
            "common_tags": get_most_common_tags(revs),
            "is_teaching": p.professor_id in teaching_prof_ids,
        })

    # Course‑level average
    average_rating = round(numpy.mean(ratings), 2) if ratings else 0

    # Sort by numeric rating (treat N/A as 0)
    professor_summaries.sort(
        key=lambda prof: prof["overall_rating"] if isinstance(prof["overall_rating"], (int, float)) else 0,
        reverse=True,
    )
    # Assemble and return the final course details
    return {
        "course_id": course.course_id,
        "course_title": course.course_title,
        "units": course.units,
        "description": course.description,
        "prereq": course.prereq,
        "fulfillment_tags": course.fulfillment_tags.split(",") if course.fulfillment_tags else [],
        "average_overall_rating": average_rating,
        "professors": professor_summaries,
    }
