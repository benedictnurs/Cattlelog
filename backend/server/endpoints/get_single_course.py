from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
from server.models import Courses, ClassesProfessors, Reviews
from server.assembly_logic.single_course_logic import _assemble_single_course_details
from server.schemas.course_schemas import CourseDetailsResponse

def single_course(course_id: str, db: Session):
    course = (
        db.query(Courses)
          .options(joinedload(Courses.reviews).joinedload(Reviews.professor))
          .join(ClassesProfessors, Courses.course_id == ClassesProfessors.course_id)
          .filter(Courses.course_id.ilike(course_id))
          .first()
    )
    if not course:
        raise HTTPException(404, "Course not found")

    assembled = _assemble_single_course_details(course)
    if assembled is None:
        return CourseDetailsResponse(
            course_id=course.course_id,
            course_title=course.course_title,
            units=course.units or 0,
            fulfillment_tags=course.fulfillment_tags.split(",") if course.fulfillment_tags else [],
            average_overall_rating=None,
            reviewed_professors=[],
        )

    return assembled

