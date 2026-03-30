"""
Comprehensive tests for course.py module.

Tests cover:
- GradeCalculator class methods
- QuarterGradeData model
- ProfessorGradesSummary model
- CourseGradesResponse model
- ProfessorsData aggregation logic
- course_endpoint integration
"""

import pytest
from unittest.mock import Mock, MagicMock
from fastapi import HTTPException
from server.endpoints.get_grade_distribution import (
    GradeCalculator,
    QuarterGradeData,
    ProfessorGradesSummary,
    CourseGradesResponse,
    ProfessorsData,
    course_endpoint
)
from server.models import Courses, Grades, Professors


# ============================================================================
# GradeCalculator Tests
# ============================================================================

class TestGradeCalculator:
    """Test suite for GradeCalculator class."""
    
    def test_get_distribution_single_distribution(self):
        """Test merging a single grade distribution."""
        distributions = [{"A": 10, "B": 5, "C": 3}]
        result = GradeCalculator.get_distribution(distributions)
        
        assert result["A"] == 10
        assert result["B"] == 5
        assert result["C"] == 3
        assert "A+" in result  # Should include all standard grades
        assert "F" in result
    
    def test_get_distribution_multiple_distributions(self):
        """Test merging multiple grade distributions."""
        distributions = [
            {"A": 10, "B": 5, "C": 3},
            {"A": 5, "B": 10, "D": 2},
            {"A": 3, "F": 1}
        ]
        result = GradeCalculator.get_distribution(distributions)
        
        assert result["A"] == 18  # 10 + 5 + 3
        assert result["B"] == 15  # 5 + 10
        assert result["C"] == 3
        assert result["D"] == 2
        assert result["F"] == 1
    
    def test_get_distribution_with_string_counts(self):
        """Test that string counts are properly converted to integers."""
        distributions = [{"A": "10", "B": "5"}]
        result = GradeCalculator.get_distribution(distributions)
        
        assert result["A"] == 10
        assert result["B"] == 5
        assert isinstance(result["A"], int)
    
    def test_get_distribution_additional_grades(self):
        """Test that additional grades like P* and NP* are included."""
        distributions = [
            {"A": 10, "P*": 5, "NP*": 2, "INVALID": 3}
        ]
        result = GradeCalculator.get_distribution(distributions)
        
        assert result["P*"] == 5
        assert result["NP*"] == 2
        assert "INVALID" not in result  # Invalid grades should be excluded
    
    def test_get_distribution_ordered_output(self):
        """Test that output maintains standard grade order."""
        distributions = [{"F": 1, "A+": 10, "C": 5, "B-": 3}]
        result = GradeCalculator.get_distribution(distributions)
        
        keys = list(result.keys())
        # Standard grades should come first in order
        assert keys[0] == "A+"
        assert keys[1] == "A"
        assert keys[-1] == "F"  # F should be last standard grade
    
    def test_get_distribution_empty_input(self):
        """Test handling of empty distributions list."""
        result = GradeCalculator.get_distribution([])
        
        # Should return all standard grades with 0 counts
        assert all(count == 0 for grade, count in result.items() 
                  if grade in GradeCalculator.GRADE_WEIGHTS)
    
    def test_compute_gpa_basic(self):
        """Test basic GPA calculation."""
        distribution = {
            "A": 10,  # 10 * 4.0 = 40
            "B": 5,   # 5 * 3.0 = 15
            "C": 5,   # 5 * 2.0 = 10
        }
        # Total: 65 / 20 = 3.25
        result = GradeCalculator.compute_gpa(distribution)
        
        assert result == pytest.approx(3.25, rel=1e-5)
    
    def test_compute_gpa_all_a_grades(self):
        """Test GPA calculation with all A grades."""
        distribution = {"A": 20, "A+": 10}
        result = GradeCalculator.compute_gpa(distribution)
        
        assert result == pytest.approx(4.0, rel=1e-5)
    
    def test_compute_gpa_with_failing_grades(self):
        """Test GPA calculation including F grades."""
        distribution = {
            "A": 5,   # 5 * 4.0 = 20
            "F": 5,   # 5 * 0.0 = 0
        }
        # Total: 20 / 10 = 2.0
        result = GradeCalculator.compute_gpa(distribution)
        
        assert result == pytest.approx(2.0, rel=1e-5)
    
    def test_compute_gpa_ignores_non_weighted_grades(self):
        """Test that GPA calculation ignores P*/NP* grades."""
        distribution = {
            "A": 10,    # 10 * 4.0 = 40
            "B": 10,    # 10 * 3.0 = 30
            "P*": 100,  # Should be ignored
            "NP*": 50,  # Should be ignored
        }
        # Total: 70 / 20 = 3.5 (P* and NP* ignored)
        result = GradeCalculator.compute_gpa(distribution)
        
        assert result == pytest.approx(3.5, rel=1e-5)
    
    def test_compute_gpa_empty_distribution(self):
        """Test GPA calculation with empty distribution."""
        result = GradeCalculator.compute_gpa({})
        
        assert result is None
    
    def test_compute_gpa_only_non_weighted_grades(self):
        """Test GPA calculation with only non-weighted grades."""
        distribution = {"P*": 10, "NP*": 5}
        result = GradeCalculator.compute_gpa(distribution)
        
        assert result is None
    
    def test_get_enrolled_count_basic(self):
        """Test basic enrolled count calculation."""
        distribution = {"A": 10, "B": 5, "C": 3}
        result = GradeCalculator.get_enrolled_count(distribution)
        
        assert result == 18
    
    def test_get_enrolled_count_includes_all_grades(self):
        """Test that enrolled count includes all grade types."""
        distribution = {
            "A": 10,
            "B": 5,
            "P*": 3,
            "NP*": 2
        }
        result = GradeCalculator.get_enrolled_count(distribution)
        
        assert result == 20  # Includes P* and NP*
    
    def test_get_enrolled_count_empty(self):
        """Test enrolled count with empty distribution."""
        result = GradeCalculator.get_enrolled_count({})
        
        assert result == 0


# ============================================================================
# Pydantic Model Tests
# ============================================================================

class TestQuarterGradeData:
    """Test suite for QuarterGradeData model."""
    
    def test_quarter_grade_data_creation(self):
        """Test creating a QuarterGradeData instance."""
        data = QuarterGradeData(
            quarter_grade_distribution={"A": 10, "B": 5},
            quarter_average_gpa=3.5,
            quarter_enrolled=15
        )
        
        assert data.quarter_grade_distribution == {"A": 10, "B": 5}
        assert data.quarter_average_gpa == 3.5
        assert data.quarter_enrolled == 15
    
    def test_quarter_grade_data_optional_gpa(self):
        """Test that quarter_average_gpa is optional."""
        data = QuarterGradeData(
            quarter_grade_distribution={"A": 10},
            quarter_enrolled=10
        )
        
        assert data.quarter_average_gpa is None
    
    def test_quarter_grade_data_json_serialization(self):
        """Test JSON serialization of QuarterGradeData."""
        data = QuarterGradeData(
            quarter_grade_distribution={"A": 10, "B": 5},
            quarter_average_gpa=3.5,
            quarter_enrolled=15
        )
        json_data = data.model_dump()
        
        assert json_data["quarter_grade_distribution"] == {"A": 10, "B": 5}
        assert json_data["quarter_average_gpa"] == 3.5
        assert json_data["quarter_enrolled"] == 15


class TestProfessorGradesSummary:
    """Test suite for ProfessorGradesSummary model."""
    
    def test_professor_grades_summary_creation(self):
        """Test creating a ProfessorGradesSummary instance."""
        quarter_data = {
            "Total": QuarterGradeData(
                quarter_grade_distribution={"A": 20},
                quarter_average_gpa=3.8,
                quarter_enrolled=20
            )
        }
        
        summary = ProfessorGradesSummary(
            professor_name="John Doe",
            professor_slug="john-doe",
            professor_quarter_data=quarter_data
        )
        
        assert summary.professor_name == "John Doe"
        assert summary.professor_slug == "john-doe"
        assert "Total" in summary.professor_quarter_data
    
    def test_professor_grades_summary_optional_slug(self):
        """Test that professor_slug is optional."""
        summary = ProfessorGradesSummary(
            professor_name="Jane Smith",
            professor_quarter_data={}
        )
        
        assert summary.professor_slug is None


class TestCourseGradesResponse:
    """Test suite for CourseGradesResponse model."""
    
    def test_course_grades_response_creation(self):
        """Test creating a CourseGradesResponse instance."""
        response = CourseGradesResponse(
            course_id="ECS32B",
            course_title="Introduction to Programming",
            overall_grades={"A": 50, "B": 30},
            overall_gpa=3.5,
            overall_enrolled=80,
            available_quarters=["Fall_2023", "Winter_2024"],
            professors=[]
        )
        
        assert response.course_id == "ECS32B"
        assert response.course_title == "Introduction to Programming"
        assert response.overall_gpa == 3.5
        assert len(response.available_quarters) == 2
    
    def test_course_grades_response_defaults(self):
        """Test default values for CourseGradesResponse."""
        response = CourseGradesResponse(
            course_id="ECS32B",
            course_title="Introduction to Programming",
            overall_grades={},
            overall_enrolled=0
        )
        
        assert response.overall_gpa is None
        assert response.available_quarters == []
        assert response.professors == []


# ============================================================================
# ProfessorsData Tests
# ============================================================================

class TestProfessorsData:
    """Test suite for ProfessorsData class."""
    
    def create_mock_grade(self, instructor_name, quarter, distribution, slug=None):
        """Helper to create mock grade records."""
        grade = Mock(spec=Grades)
        grade.instructor_name = instructor_name
        grade.quarter = quarter
        grade.grade_distribution = distribution
        grade.slug = slug
        
        # Mock professor relationship
        if slug:
            professor = Mock(spec=Professors)
            professor.slug = slug
            grade.professor = professor
        else:
            grade.professor = None
        
        return grade
    
    def test_add_record_single_professor(self):
        """Test adding a single grade record."""
        prof_data = ProfessorsData()
        grade = self.create_mock_grade(
            "John Doe", 
            "Fall_2023", 
            {"A": 10, "B": 5},
            "john-doe"
        )
        
        prof_data.add_record(grade)
        
        assert "John Doe" in prof_data.professors
        assert len(prof_data.professors["John Doe"]["distributions"]) == 1
        assert "Fall_2023" in prof_data.professors["John Doe"]["quarter_distributions"]
    
    def test_add_record_multiple_quarters_same_professor(self):
        """Test adding multiple quarters for same professor."""
        prof_data = ProfessorsData()
        
        grade1 = self.create_mock_grade(
            "John Doe", "Fall_2023", {"A": 10}, "john-doe"
        )
        grade2 = self.create_mock_grade(
            "John Doe", "Winter_2024", {"A": 8}, "john-doe"
        )
        
        prof_data.add_record(grade1)
        prof_data.add_record(grade2)
        
        assert len(prof_data.professors["John Doe"]["distributions"]) == 2
        assert "Fall_2023" in prof_data.professors["John Doe"]["quarter_distributions"]
        assert "Winter_2024" in prof_data.professors["John Doe"]["quarter_distributions"]
    
    def test_add_record_ignores_null_distribution(self):
        """Test that records with null distributions are ignored."""
        prof_data = ProfessorsData()
        grade = self.create_mock_grade("John Doe", "Fall_2023", None, "john-doe")
        
        prof_data.add_record(grade)
        
        assert len(prof_data.professors["John Doe"]["distributions"]) == 0
    
    def test_add_record_slug_handling(self):
        """Test proper slug handling from professor or grade."""
        prof_data = ProfessorsData()
        grade = self.create_mock_grade(
            "John Doe", "Fall_2023", {"A": 10}, "john-doe"
        )
        
        prof_data.add_record(grade)
        
        assert prof_data.professors["John Doe"]["slug"] == "john-doe"
    
    def test_add_record_fallback_slug(self):
        """Test fallback to grade.slug when professor is None."""
        prof_data = ProfessorsData()
        grade = Mock(spec=Grades)
        grade.instructor_name = "John Doe"
        grade.quarter = "Fall_2023"
        grade.grade_distribution = {"A": 10}
        grade.professor = None
        grade.slug = "fallback-slug"
        
        prof_data.add_record(grade)
        
        assert prof_data.professors["John Doe"]["slug"] == "fallback-slug"
    
    def test_build_summaries_single_professor(self):
        """Test building summaries for a single professor."""
        prof_data = ProfessorsData()
        grade = self.create_mock_grade(
            "John Doe", "Fall_2023", {"A": 10, "B": 5}, "john-doe"
        )
        
        prof_data.add_record(grade)
        summaries = prof_data.build_summaries()
        
        assert len(summaries) == 1
        assert summaries[0].professor_name == "John Doe"
        assert summaries[0].professor_slug == "john-doe"
        assert "Total" in summaries[0].professor_quarter_data
        assert "Fall_2023" in summaries[0].professor_quarter_data
    
    def test_build_summaries_multiple_professors(self):
        """Test building summaries for multiple professors."""
        prof_data = ProfessorsData()
        
        grade1 = self.create_mock_grade("Alice", "Fall_2023", {"A": 10}, "alice")
        grade2 = self.create_mock_grade("Bob", "Fall_2023", {"B": 10}, "bob")
        
        prof_data.add_record(grade1)
        prof_data.add_record(grade2)
        summaries = prof_data.build_summaries()
        
        assert len(summaries) == 2
        names = [s.professor_name for s in summaries]
        assert "Alice" in names
        assert "Bob" in names
    
    def test_build_summaries_sorted_by_name(self):
        """Test that summaries are sorted alphabetically by professor name."""
        prof_data = ProfessorsData()
        
        grade1 = self.create_mock_grade("Zoe", "Fall_2023", {"A": 10}, "zoe")
        grade2 = self.create_mock_grade("Alice", "Fall_2023", {"A": 10}, "alice")
        grade3 = self.create_mock_grade("Bob", "Fall_2023", {"A": 10}, "bob")
        
        prof_data.add_record(grade1)
        prof_data.add_record(grade2)
        prof_data.add_record(grade3)
        summaries = prof_data.build_summaries()
        
        names = [s.professor_name for s in summaries]
        assert names == ["Alice", "Bob", "Zoe"]
    
    def test_build_summaries_total_aggregation(self):
        """Test that Total aggregates all quarters correctly."""
        prof_data = ProfessorsData()
        
        grade1 = self.create_mock_grade("John Doe", "Fall_2023", {"A": 10, "B": 5}, "john-doe")
        grade2 = self.create_mock_grade("John Doe", "Winter_2024", {"A": 8, "C": 2}, "john-doe")
        
        prof_data.add_record(grade1)
        prof_data.add_record(grade2)
        summaries = prof_data.build_summaries()
        
        total_data = summaries[0].professor_quarter_data["Total"]
        assert total_data.quarter_grade_distribution["A"] == 18  # 10 + 8
        assert total_data.quarter_grade_distribution["B"] == 5
        assert total_data.quarter_grade_distribution["C"] == 2
        assert total_data.quarter_enrolled == 25
    
    def test_build_summaries_quarter_specific_data(self):
        """Test that quarter-specific data is calculated correctly."""
        prof_data = ProfessorsData()
        
        grade = self.create_mock_grade("John Doe", "Fall_2023", {"A": 10, "B": 5}, "john-doe")
        prof_data.add_record(grade)
        summaries = prof_data.build_summaries()
        
        fall_data = summaries[0].professor_quarter_data["Fall_2023"]
        assert fall_data.quarter_grade_distribution["A"] == 10
        assert fall_data.quarter_grade_distribution["B"] == 5
        assert fall_data.quarter_enrolled == 15
        assert fall_data.quarter_average_gpa is not None


# ============================================================================
# Integration Tests for course_endpoint
# ============================================================================

class TestCourseEndpoint:
    """Test suite for course_endpoint function."""
    
    def create_mock_course_with_grades(self):
        """Helper to create a mock course with grade data."""
        course = Mock(spec=Courses)
        course.course_id = "ECS32B"
        course.course_title = "Introduction to Programming"
        
        # Create mock professor
        prof = Mock(spec=Professors)
        prof.slug = "john-doe"
        
        # Create mock grades
        grade1 = Mock(spec=Grades)
        grade1.instructor_name = "John Doe"
        grade1.quarter = "Fall_2023"
        grade1.grade_distribution = {"A": 10, "B": 5, "C": 3}
        grade1.professor = prof
        
        grade2 = Mock(spec=Grades)
        grade2.instructor_name = "John Doe"
        grade2.quarter = "Winter_2024"
        grade2.grade_distribution = {"A": 8, "B": 7, "C": 5}
        grade2.professor = prof
        
        course.grades = [grade1, grade2]
        
        return course
    
    def test_course_endpoint_not_found(self):
        """Test endpoint returns 404 when course not found."""
        mock_db = MagicMock()
        mock_db.query().options().filter().first.return_value = None
        
        with pytest.raises(HTTPException) as exc_info:
            course_endpoint("NONEXISTENT", mock_db)
        
        assert exc_info.value.status_code == 404
        assert "Course not found" in str(exc_info.value.detail)
    
    def test_course_endpoint_no_grades(self):
        """Test endpoint with course that has no grades."""
        mock_course = Mock(spec=Courses)
        mock_course.course_id = "ECS32B"
        mock_course.course_title = "Introduction to Programming"
        mock_course.grades = []
        
        mock_db = MagicMock()
        mock_db.query().options().filter().first.return_value = mock_course
        
        result = course_endpoint("ECS32B", mock_db)
        
        assert result.course_id == "ECS32B"
        assert result.overall_grades == {}
        assert result.overall_gpa is None
        assert result.overall_enrolled == 0
        assert result.available_quarters == []
        assert result.professors == []
    
    def test_course_endpoint_with_grades(self):
        """Test endpoint with course that has grade data."""
        mock_course = self.create_mock_course_with_grades()
        
        mock_db = MagicMock()
        mock_db.query().options().filter().first.return_value = mock_course
        
        result = course_endpoint("ECS32B", mock_db)
        
        assert result.course_id == "ECS32B"
        assert result.course_title == "Introduction to Programming"
        assert result.overall_enrolled > 0
        assert result.overall_gpa is not None
        assert len(result.available_quarters) == 2
        assert len(result.professors) == 1
    
    def test_course_endpoint_overall_statistics(self):
        """Test that overall statistics are correctly calculated."""
        mock_course = self.create_mock_course_with_grades()
        
        mock_db = MagicMock()
        mock_db.query().options().filter().first.return_value = mock_course
        
        result = course_endpoint("ECS32B", mock_db)
        
        # Overall grades should aggregate both quarters
        assert result.overall_grades["A"] == 18  # 10 + 8
        assert result.overall_grades["B"] == 12  # 5 + 7
        assert result.overall_grades["C"] == 8   # 3 + 5
        assert result.overall_enrolled == 38
    
    def test_course_endpoint_professor_data(self):
        """Test that professor data is correctly structured."""
        mock_course = self.create_mock_course_with_grades()
        
        mock_db = MagicMock()
        mock_db.query().options().filter().first.return_value = mock_course
        
        result = course_endpoint("ECS32B", mock_db)
        
        assert len(result.professors) == 1
        prof = result.professors[0]
        assert prof.professor_name == "John Doe"
        assert prof.professor_slug == "john-doe"
        assert "Total" in prof.professor_quarter_data
        assert "Fall_2023" in prof.professor_quarter_data
        assert "Winter_2024" in prof.professor_quarter_data
    
    def test_course_endpoint_case_insensitive(self):
        """Test that course lookup is case-insensitive."""
        mock_course = self.create_mock_course_with_grades()
        
        mock_db = MagicMock()
        mock_query = mock_db.query.return_value
        mock_query.options.return_value.filter.return_value.first.return_value = mock_course
        
        course_endpoint("ecs32b", mock_db)  # lowercase
        
        # Verify ilike was called (case-insensitive filter)
        mock_db.query.assert_called()
    
    def test_course_endpoint_available_quarters_sorted(self):
        """Test that available quarters are sorted."""
        mock_course = Mock(spec=Courses)
        mock_course.course_id = "ECS32B"
        mock_course.course_title = "Introduction to Programming"
        
        prof = Mock(spec=Professors)
        prof.slug = "john-doe"
        
        grade1 = Mock(spec=Grades)
        grade1.instructor_name = "John Doe"
        grade1.quarter = "Winter_2024"
        grade1.grade_distribution = {"A": 10}
        grade1.professor = prof
        
        grade2 = Mock(spec=Grades)
        grade2.instructor_name = "John Doe"
        grade2.quarter = "Fall_2023"
        grade2.grade_distribution = {"A": 10}
        grade2.professor = prof
        
        grade3 = Mock(spec=Grades)
        grade3.instructor_name = "John Doe"
        grade3.quarter = "Spring_2024"
        grade3.grade_distribution = {"A": 10}
        grade3.professor = prof
        
        mock_course.grades = [grade1, grade2, grade3]
        
        mock_db = MagicMock()
        mock_db.query().options().filter().first.return_value = mock_course
        
        result = course_endpoint("ECS32B", mock_db)
        
        # Should be sorted
        assert result.available_quarters == sorted(["Winter_2024", "Fall_2023", "Spring_2024"])
    
    def test_course_endpoint_multiple_professors(self):
        """Test endpoint with multiple professors."""
        mock_course = Mock(spec=Courses)
        mock_course.course_id = "ECS32B"
        mock_course.course_title = "Introduction to Programming"
        
        prof1 = Mock(spec=Professors)
        prof1.slug = "john-doe"
        
        prof2 = Mock(spec=Professors)
        prof2.slug = "jane-smith"
        
        grade1 = Mock(spec=Grades)
        grade1.instructor_name = "John Doe"
        grade1.quarter = "Fall_2023"
        grade1.grade_distribution = {"A": 10, "B": 5}
        grade1.professor = prof1
        
        grade2 = Mock(spec=Grades)
        grade2.instructor_name = "Jane Smith"
        grade2.quarter = "Fall_2023"
        grade2.grade_distribution = {"A": 8, "C": 7}
        grade2.professor = prof2
        
        mock_course.grades = [grade1, grade2]
        
        mock_db = MagicMock()
        mock_db.query().options().filter().first.return_value = mock_course
        
        result = course_endpoint("ECS32B", mock_db)
        
        assert len(result.professors) == 2
        prof_names = [p.professor_name for p in result.professors]
        assert "John Doe" in prof_names
        assert "Jane Smith" in prof_names


# ============================================================================
# Edge Cases and Error Handling Tests
# ============================================================================

class TestEdgeCases:
    """Test suite for edge cases and error conditions."""
    
    def test_grade_calculator_with_zero_counts(self):
        """Test GradeCalculator handles zero counts correctly."""
        distribution = {"A": 0, "B": 0, "C": 10}
        gpa = GradeCalculator.compute_gpa(distribution)
        
        assert gpa == pytest.approx(2.0, rel=1e-5)
    
    def test_grade_calculator_with_negative_counts(self):
        """Test GradeCalculator with negative counts (data integrity issue)."""
        distribution = {"A": 10, "B": -5}  # Invalid but should handle gracefully
        enrolled = GradeCalculator.get_enrolled_count(distribution)
        
        assert enrolled == 5  # 10 + (-5)
    
    def test_professors_data_empty_build(self):
        """Test building summaries from empty ProfessorsData."""
        prof_data = ProfessorsData()
        summaries = prof_data.build_summaries()
        
        assert summaries == []
    
    def test_course_endpoint_with_null_professor(self):
        """Test endpoint handles grades with null professor relationship."""
        mock_course = Mock(spec=Courses)
        mock_course.course_id = "ECS32B"
        mock_course.course_title = "Introduction to Programming"
        
        grade = Mock(spec=Grades)
        grade.instructor_name = "Unknown Professor"
        grade.quarter = "Fall_2023"
        grade.grade_distribution = {"A": 10}
        grade.professor = None
        grade.slug = "unknown-slug"
        
        mock_course.grades = [grade]
        
        mock_db = MagicMock()
        mock_db.query().options().filter().first.return_value = mock_course
        
        result = course_endpoint("ECS32B", mock_db)
        
        assert len(result.professors) == 1
        assert result.professors[0].professor_slug == "unknown-slug"
    
    def test_gpa_rounding(self):
        """Test that GPA values are properly rounded in response."""
        mock_course = Mock(spec=Courses)
        mock_course.course_id = "ECS32B"
        mock_course.course_title = "Introduction to Programming"
        
        prof = Mock(spec=Professors)
        prof.slug = "john-doe"
        
        # Create distribution that results in non-round GPA
        grade = Mock(spec=Grades)
        grade.instructor_name = "John Doe"
        grade.quarter = "Fall_2023"
        grade.grade_distribution = {"A": 7, "B": 5, "C": 3}  # GPA should be ~3.27
        grade.professor = prof
        
        mock_course.grades = [grade]
        
        mock_db = MagicMock()
        mock_db.query().options().filter().first.return_value = mock_course
        
        result = course_endpoint("ECS32B", mock_db)
        
        # Check that GPA is rounded to 2 decimal places
        assert isinstance(result.overall_gpa, float)
        assert len(str(result.overall_gpa).split('.')[-1]) <= 2
