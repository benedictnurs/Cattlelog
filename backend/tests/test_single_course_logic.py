import pytest
from unittest.mock import Mock
from server.assembly_logic.single_course_logic import _assemble_single_course_details
from server.models import Courses, Professors, ClassesProfessors, Reviews


def create_mock_course():
    """Create a mock course object with all necessary attributes and relationships."""
    # Create mock course
    course = Mock(spec=Courses)
    course.course_id = "MAT21C"
    course.course_title = "Calculus III"
    course.units = 4
    course.description = "Multivariable calculus"
    course.prereq = "MAT21B"
    course.fulfillment_tags = "SE,QR"
    
    # Create mock professors
    prof1 = Mock(spec=Professors)
    prof1.professor_id = "prof1"
    prof1.professor_name = "John Doe"
    prof1.slug = "john-doe"
    prof1.department = "Mathematics"
    prof1.overall_rating = 4.5
    prof1.level_of_difficulty = 3.2
    
    prof2 = Mock(spec=Professors)
    prof2.professor_id = "prof2"
    prof2.professor_name = "Jane Smith"
    prof2.slug = "jane-smith"
    prof2.department = "Mathematics"
    prof2.overall_rating = None  # N/A rating
    prof2.level_of_difficulty = 2.8
    
    prof3 = Mock(spec=Professors)
    prof3.professor_id = "prof3"
    prof3.professor_name = "Bob Johnson"
    prof3.slug = "bob-johnson"
    prof3.department = "Mathematics"
    prof3.overall_rating = 3.8
    prof3.level_of_difficulty = 4.1
    
    # Create mock classes_professors relationships
    cp1 = Mock(spec=ClassesProfessors)
    cp1.professor_id = "prof1"
    cp1.professor = prof1
    cp1.offered = True
    
    cp2 = Mock(spec=ClassesProfessors)
    cp2.professor_id = "prof2"
    cp2.professor = prof2
    cp2.offered = False
    
    cp3 = Mock(spec=ClassesProfessors)
    cp3.professor_id = "prof3"
    cp3.professor = prof3
    cp3.offered = True
    
    course.classes_professors = [cp1, cp2, cp3]
    
    # Create mock reviews
    review1 = Mock(spec=Reviews)
    review1.professor_id = "prof1"
    review1.professor = prof1
    review1.review = "Great professor!"
    review1.tags = []
    
    review2 = Mock(spec=Reviews)
    review2.professor_id = "prof3"
    review2.professor = prof3
    review2.review = "Challenging but fair"
    review2.tags = ["Challenging", "Fair"]
    
    course.reviews = [review1, review2]
    
    return course


def test_assemble_single_course_details_basic():
    """Test basic functionality of _assemble_single_course_details."""
    course = create_mock_course()
    result = _assemble_single_course_details(course)
    
    # Check basic course information
    assert result["course_id"] == "MAT21C"
    assert result["course_title"] == "Calculus III"
    assert result["units"] == 4
    assert result["description"] == "Multivariable calculus"
    assert result["prereq"] == "MAT21B"
    assert result["fulfillment_tags"] == ["SE", "QR"]
    
    # Check that we have 3 professors
    assert len(result["professors"]) == 3
    
    # Check professor details
    prof_names = [p["professor_name"] for p in result["professors"]]
    assert "John Doe" in prof_names
    assert "Jane Smith" in prof_names
    assert "Bob Johnson" in prof_names


def test_assemble_single_course_details_rating_handling():
    """Test that N/A ratings are handled correctly."""
    course = create_mock_course()
    result = _assemble_single_course_details(course)
    
    # Find professors by name
    prof_dict = {p["professor_name"]: p for p in result["professors"]}
    
    # Professor with valid rating
    john_doe = prof_dict["John Doe"]
    assert john_doe["overall_rating"] == 4.5
    assert john_doe["is_teaching"] == True
    
    # Professor with N/A rating
    jane_smith = prof_dict["Jane Smith"]
    assert jane_smith["overall_rating"] == "N/A"
    assert jane_smith["is_teaching"] == False
    
    # Professor with valid rating
    bob_johnson = prof_dict["Bob Johnson"]
    assert bob_johnson["overall_rating"] == 3.8
    assert bob_johnson["is_teaching"] == True


def test_assemble_single_course_details_average_calculation():
    """Test that course average is calculated correctly, excluding N/A ratings."""
    course = create_mock_course()
    result = _assemble_single_course_details(course)
    
    # The average should only include professors with valid ratings (4.5 and 3.8)
    # Average of 4.5 and 3.8 is 4.15
    expected_average = round((4.5 + 3.8) / 2, 2)
    assert result["average_overall_rating"] == expected_average


def test_assemble_single_course_details_sorting():
    """Test that professors are sorted by rating (highest first, N/A last)."""
    course = create_mock_course()
    result = _assemble_single_course_details(course)
    
    # Professors should be sorted by rating (highest first)
    # John Doe (4.5) should be first, Bob Johnson (3.8) second, Jane Smith (N/A) last
    assert result["professors"][0]["professor_name"] == "John Doe"
    assert result["professors"][0]["overall_rating"] == 4.5
    
    assert result["professors"][1]["professor_name"] == "Bob Johnson"
    assert result["professors"][1]["overall_rating"] == 3.8
    
    assert result["professors"][2]["professor_name"] == "Jane Smith"
    assert result["professors"][2]["overall_rating"] == "N/A"


def test_assemble_single_course_details_no_ratings():
    """Test behavior when no professors have ratings."""
    course = create_mock_course()
    
    # Set all professor ratings to None
    for cp in course.classes_professors:
        cp.professor.overall_rating = None
    
    result = _assemble_single_course_details(course)
    
    # Average should be 0 when no valid ratings
    assert result["average_overall_rating"] == 0
    
    # All professors should have "N/A" rating
    for prof in result["professors"]:
        assert prof["overall_rating"] == "N/A"


def test_assemble_single_course_details_empty_reviews():
    """Test behavior when there are no reviews."""
    course = create_mock_course()
    course.reviews = []
    
    result = _assemble_single_course_details(course)
    
    # Should still work with empty reviews
    assert len(result["professors"]) == 3
    
    # Check that review field is set to default message
    for prof in result["professors"]:
        assert prof["review"] == "No reviews available"


def test_assemble_single_course_details_teaching_status():
    """Test that is_teaching status is correctly determined."""
    course = create_mock_course()
    result = _assemble_single_course_details(course)
    
    prof_dict = {p["professor_name"]: p for p in result["professors"]}
    
    # John Doe and Bob Johnson are teaching (offered=True)
    assert prof_dict["John Doe"]["is_teaching"] == True
    assert prof_dict["Bob Johnson"]["is_teaching"] == True
    
    # Jane Smith is not teaching (offered=False)
    assert prof_dict["Jane Smith"]["is_teaching"] == False


def test_assemble_single_course_details_professor_attributes():
    """Test that all professor attributes are correctly set."""
    course = create_mock_course()
    result = _assemble_single_course_details(course)
    
    prof_dict = {p["professor_name"]: p for p in result["professors"]}
    john_doe = prof_dict["John Doe"]
    
    # Check all expected attributes
    assert john_doe["id"] == "prof1"
    assert john_doe["slug"] == "john-doe"
    assert john_doe["department"] == "Mathematics"
    assert john_doe["level_of_difficulty"] == 3.2
    assert "common_tags" in john_doe
    assert "review" in john_doe


if __name__ == "__main__":
    # Run tests if executed directly
    test_assemble_single_course_details_basic()
    test_assemble_single_course_details_rating_handling()
    test_assemble_single_course_details_average_calculation()
    test_assemble_single_course_details_sorting()
    test_assemble_single_course_details_no_ratings()
    test_assemble_single_course_details_empty_reviews()
    test_assemble_single_course_details_teaching_status()
    test_assemble_single_course_details_professor_attributes()
    print("All tests passed!")
