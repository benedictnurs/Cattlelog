from pydantic import BaseModel
from typing import List, Dict, Optional

class ReviewSummary(BaseModel):
    professor_name: str
    slug: str
    overall_rating: float
    is_teaching: bool
    review: str
    common_tags: List[str]

class GradeQuarterData(BaseModel):
    quarter_grade_distribution: Dict[str, int]
    quarter_average_gpa: Optional[float]
    quarter_enrolled: int

class GradeSummary(BaseModel):
    professor_name: str
    professor_slug: str
    professor_quarter_data: Dict[str, GradeQuarterData]

class CourseDetailsResponse(BaseModel):
    course_id: str
    course_title: str
    units: int
    fulfillment_tags: List[str]

    # included when include_reviews=True
    average_overall_rating: Optional[float] = None
    reviewed_professors: Optional[List[ReviewSummary]] = None

    # included when include_grades=True
    overall_grades: Optional[Dict[str,int]] = None
    overall_gpa: Optional[float] = None
    overall_enrolled: Optional[int] = None
    available_quarters: Optional[List[str]] = None
    grade_professors: Optional[List[GradeSummary]] = None
