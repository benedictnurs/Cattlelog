from typing import Optional, Dict, List
from collections import Counter, defaultdict
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel, Field
import numpy as np

from server.models import Courses, Grades
from server.database import get_db


class GradeCalculator:
    """Handles grade distribution calculations and GPA computation."""
    
    GRADE_WEIGHTS = {
        "A+": 4.0, "A": 4.0, "A-": 3.7,
        "B+": 3.3, "B": 3.0, "B-": 2.7,
        "C+": 2.3, "C": 2.0, "C-": 1.7,
        "D+": 1.3, "D": 1.0, "D-": 0.7,
        "F": 0.0
    }
    ADDITIONAL_GRADES = ["P*", "NP*"]

    @classmethod
    def get_distribution(cls, distributions: List[Dict[str, int]]) -> Dict[str, int]:
        """Merge multiple grade distributions and return ordered distribution with standard grades first."""
        grade_distributions = Counter()
        for distribution in distributions:
            for grade, count in distribution.items():
                grade_distributions[grade] += int(count)

        ordered_grade_distribution = {grade: grade_distributions.get(grade, 0) for grade in cls.GRADE_WEIGHTS.keys()}

        for grade, count in grade_distributions.items():
            if grade not in ordered_grade_distribution and grade in cls.ADDITIONAL_GRADES:
                ordered_grade_distribution[grade] = count

        return ordered_grade_distribution

    @classmethod
    def compute_gpa(cls, distribution: Dict[str, int]) -> Optional[float]:
        """Calculate GPA from distribution, only counting weighted grades using numpy for performance."""
        weighted_items = [(grade, count) for grade, count in distribution.items() if grade in cls.GRADE_WEIGHTS]
        
        if not weighted_items:
            return None
        
        grades, counts = zip(*weighted_items)
        weights = np.array([cls.GRADE_WEIGHTS[grade] for grade in grades])
        counts_array = np.array(counts)
        
        return float(np.sum(weights * counts_array) / np.sum(counts_array))
    
    @classmethod
    def get_enrolled_count(cls, distribution: Dict[str, int]) -> int:
        """Get total enrolled."""
        return sum(count for count in distribution.values())


class QuarterGradeData(BaseModel):
    """Grade data for a specific quarter.
    
    Attributes:
        quarter_grade_distribution (Dict[str, int]): Mapping of letter grades to student counts.
        quarter_average_gpa (Optional[float]): Average GPA calculated from weighted grades only.
        quarter_enrolled (int): Total number of students enrolled (weighted grades only).
    """
    quarter_grade_distribution: Dict[str, int]
    quarter_average_gpa: Optional[float] = None
    quarter_enrolled: int


class ProfessorGradesSummary(BaseModel):
    """Summary of professor's grade data for a course.
    
    Attributes:
        professor_name (str): Full name of the professor.
        professor_slug (Optional[str]): URL-friendly slug identifier for the professor.
        professor_quarter_data (Dict[str, QuarterGradeData]): Grade data by quarter, 
            with 'Total' key containing overall aggregated statistics.
    """
    professor_name: str
    professor_slug: Optional[str] = None
    professor_quarter_data: Dict[str, QuarterGradeData]


class CourseGradesResponse(BaseModel):
    """Complete course grades response with overall statistics and per-professor breakdowns.
    
    Attributes:
        course_id (str): Unique course identifier (e.g., 'ECS32B').
        course_title (str): Full title of the course.
        overall_grades (Dict[str, int]): Overall grade distribution across all professors and quarters.
        overall_gpa (Optional[float]): Overall course GPA calculated from weighted letter grades.
        overall_enrolled (int): Total enrolled students across all sections (weighted grades only).
        available_quarters (List[str]): List of quarters for which grade data is available.
        professors (List[ProfessorGradesSummary]): List of professors with their grade statistics.
    """
    course_id: str
    course_title: str
    overall_grades: Dict[str, int]
    overall_gpa: Optional[float] = None
    overall_enrolled: int
    available_quarters: List[str] = Field(default_factory=list)
    professors: List[ProfessorGradesSummary] = Field(default_factory=list)


class ProfessorsData:
    """Aggregates grade data by professor."""
    
    def __init__(self):
        self.professors: Dict[str, Dict] = defaultdict(lambda: {
            "distributions": [],
            "quarter_distributions": defaultdict(list),
            "slug": None
        })
    
    def add_record(self, course_grade_data: Grades):
        """Add a grade record to the dictionary."""
        if not course_grade_data.grade_distribution:
            return

        professor = self.professors[course_grade_data.instructor_name]
        professor["slug"] = course_grade_data.professor.slug if course_grade_data.professor else course_grade_data.slug
        professor["distributions"].append(course_grade_data.grade_distribution)
        professor["quarter_distributions"][course_grade_data.quarter].append(course_grade_data.grade_distribution)

    def build_summaries(self) -> List[ProfessorGradesSummary]:
        """Build professor grade summaries from aggregated data."""
        summaries = []
        
        for professor_name, data in self.professors.items():
            quarter_data = {}

            # Calculate overall professor stats
            overall_distribution = GradeCalculator.get_distribution(data["distributions"])
            overall_prof_gpa = GradeCalculator.compute_gpa(overall_distribution)
            overall_prof_enrolled = GradeCalculator.get_enrolled_count(overall_distribution)

            # Add professor total summary
            quarter_data["Total"] = QuarterGradeData(
                quarter_grade_distribution=overall_distribution,
                quarter_average_gpa=round(overall_prof_gpa, 2),
                quarter_enrolled=overall_prof_enrolled
            )

            # Build quarter-specific data
            for quarter, dist_list in data["quarter_distributions"].items():
                quarter_distribution = GradeCalculator.get_distribution(dist_list)
                quarter_data[quarter] = QuarterGradeData(
                    quarter_grade_distribution=quarter_distribution,
                    quarter_average_gpa=round(GradeCalculator.compute_gpa(quarter_distribution), 2),
                    quarter_enrolled=GradeCalculator.get_enrolled_count(quarter_distribution)
                )
            
            summaries.append(ProfessorGradesSummary(
                professor_name=professor_name,
                professor_slug=data["slug"],
                professor_quarter_data=quarter_data
            ))
        
        return sorted(summaries, key=lambda x: x.professor_name)


def course_endpoint(course_id: str, db: Session = Depends(get_db)) -> CourseGradesResponse:
    """Get comprehensive grade data for a course."""
    course = (
        db.query(Courses)
        .options(joinedload(Courses.grades).joinedload(Grades.professor))
        .filter(Courses.course_id.ilike(course_id))
        .first()
    )
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if not course.grades:
        return CourseGradesResponse(
            course_id=course.course_id,
            course_title=course.course_title,
            overall_grades={},
            overall_gpa=None,
            overall_enrolled=0,
            available_quarters=[],
            professors=[]
        )
    
    # Calculate overall course statistics
    all_distributions = [data.grade_distribution for data in course.grades]
    overall_distribution = GradeCalculator.get_distribution(all_distributions)
    overall_gpa = GradeCalculator.compute_gpa(overall_distribution)
    overall_enrolled = GradeCalculator.get_enrolled_count(overall_distribution)

    # Initializes and fills professor data
    professors_data = ProfessorsData()
    for course_grade_data in course.grades:
        professors_data.add_record(course_grade_data)

    # Build response
    return CourseGradesResponse(
        course_id=course.course_id,
        course_title=course.course_title,
        overall_grades=overall_distribution,
        overall_gpa=round(overall_gpa, 2),
        overall_enrolled=overall_enrolled,
        available_quarters=sorted({data.quarter for data in course.grades}),
        professors=professors_data.build_summaries()
    )
