from collections import defaultdict
from server.utils import parse_course_id
import numpy

def _all_assemble_courses(data):
    """
    Organizes course information with professors and reviews into a clear structure.
    For each professor, their overall rating is computed as the average of all ratings
    across database rows. The course's overall average rating is computed as the average
    of all individual review ratings (i.e. the flattened list of ratings) to be consistent
    with _assemble_course_details.
    """

    # Organize data into a course-based structure.
    courses = defaultdict(lambda: {
        "course_id": None,
        "course_title": None,
        "fulfillment_tags": [],
        "description": None,
        "prereq": None,
        "offered": False,
        "units": None,
        "average_gpa": None,
        "professors": defaultdict(lambda: {
            "name": None,
            "id": None,
            "slug": None,
            "is_teaching": False,
            "quality_ratings": [],
            "difficulty_ratings": [],
            "review": None,
            "common_tags": []
        })
    })

    # Process each database row.
    for course, professor_course, professor in data:
        current_course = courses[course.course_id]

        # Store basic course info once.
        if current_course["course_id"] is None:
            current_course.update({
                "course_id": course.course_id,
                "course_title": course.course_title,
                "units": course.units,
                "description": course.description,
                "prereq": course.prereq,
                "fulfillment_tags": course.fulfillment_tags.split(",") if course.fulfillment_tags else [],
                "offered": course.offered,
                "average_gpa": course.average_gpa
            })

        if not professor_course or not professor:
            continue
        # Store professor information and accumulate ratings.
        prof = current_course["professors"][professor.professor_id]
        if prof["name"] is None:
            prof["name"] = professor.professor_name
            prof["id"] = professor.professor_id
            prof["slug"] = professor.slug
            prof["is_teaching"] |= bool(professor_course.offered)
            prof["review"] = professor_course.one_review
            prof["common_tags"] = professor.common_tags if professor.common_tags else []

        if getattr(professor, "overall_rating", None) is not None:
            try:
                prof["quality_rating"] = round(float(professor.overall_rating), 2)
            except Exception:
                prof["quality_rating"] = None
        if getattr(professor, "level_of_difficulty", None) is not None:
            try:
                prof["difficulty_rating"] = round(float(professor.level_of_difficulty), 2)
            except Exception:
                prof["difficulty_rating"] = None



    # Transform data into the final format.
    result = []

    for course_id, course_data in courses.items():
        # Process all professors for this course.
        professors_list = []
        quality_vals = []
        difficulty_vals = []
        for _, prof_data in course_data["professors"].items():
            quality = prof_data.get("quality_rating") or 0
            difficulty = prof_data.get("difficulty_rating") or 0

            if quality > 0:
                quality_vals.append(quality)
            if difficulty > 0:
                difficulty_vals.append(difficulty)

            professors_list.append({
                "professor_name": prof_data["name"],
                "id": prof_data["id"],
                "slug": prof_data["slug"],
                "is_teaching": prof_data["is_teaching"],
                "overall_rating": quality,
                "overall_difficulty": difficulty,
                "review": prof_data["review"],
                "common_tags": prof_data["common_tags"],
            })

        # Sort professors by their overall rating (treating "N/A" as -1 so they sort last).
        professors_list.sort(
            key=lambda x: (-x["overall_rating"], x["overall_difficulty"])
        )


        # Calculate the course's overall average rating using positive professor ratings only.
        course_average_quality = round(numpy.mean(quality_vals), 2) if quality_vals else 0
        course_average_difficulty = round(numpy.mean(difficulty_vals), 2) if difficulty_vals else 0

        # Add the formatted course data to the results.
        result.append({
            "course_id": course_data["course_id"],
            "course_title": course_data["course_title"],
            "fulfillment_tags": course_data["fulfillment_tags"],
            "prerequisites": course_data["prereq"],
            "units": course_data["units"],
            "description": course_data["description"],
            "average_overall_rating": course_average_quality,
            "average_difficulty_rating": course_average_difficulty,
            "offered": course_data["offered"],
            "average_gpa": course_data["average_gpa"],
            "professors": professors_list
        })

    return sorted(result, key=lambda c: parse_course_id(c["course_id"]))
