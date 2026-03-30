from unittest.mock import Mock

from server.assembly_logic.all_course_logic import _all_assemble_courses
from server.models import Courses, Professors, ClassesProfessors


def make_row(course: Courses, class_professor: ClassesProfessors | None, professor: Professors | None):
    return (course, class_professor, professor)


def create_course_and_rows():
    # Course
    course = Mock(spec=Courses)
    course.course_id = "MAT21C"
    course.course_title = "Calculus III"
    course.units = 4
    course.description = "Multivariable calculus"
    course.prereq = "MAT21B"
    course.fulfillment_tags = "SE,QR"
    course.offered = True
    course.average_gpa = 3.5

    # Professors
    p1 = Mock(spec=Professors)
    p1.professor_id = "prof1"
    p1.professor_name = "John Doe"
    p1.slug = "john-doe"
    p1.overall_rating = 4.6
    p1.level_of_difficulty = 3.0
    p1.common_tags = ["Clear grading"]

    p2 = Mock(spec=Professors)
    p2.professor_id = "prof2"
    p2.professor_name = "Jane Smith"
    p2.slug = "jane-smith"
    p2.overall_rating = 0.0  # Represent N/A as 0 per current logic
    p2.level_of_difficulty = 2.5
    p2.common_tags = []

    p3 = Mock(spec=Professors)
    p3.professor_id = "prof3"
    p3.professor_name = "Bob Johnson"
    p3.slug = "bob-johnson"
    p3.overall_rating = 3.9
    p3.level_of_difficulty = 4.1
    p3.common_tags = ["Challenging"]

    # Class links
    cp1 = Mock(spec=ClassesProfessors)
    cp1.professor_id = "prof1"
    cp1.offered = True
    cp1.one_review = "Solid course"

    cp2 = Mock(spec=ClassesProfessors)
    cp2.professor_id = "prof2"
    cp2.offered = False
    cp2.one_review = None

    cp3 = Mock(spec=ClassesProfessors)
    cp3.professor_id = "prof3"
    cp3.offered = True
    cp3.one_review = "Tough but fair"

    # Data rows (multiple rows for the same course, one per prof)
    rows = [
        make_row(course, cp1, p1),
        make_row(course, cp2, p2),
        make_row(course, cp3, p3),
    ]

    return course, rows


def test_all_assemble_courses_basic():
    _, rows = create_course_and_rows()
    result = _all_assemble_courses(rows)

    assert len(result) == 1
    c = result[0]
    assert c["course_id"] == "MAT21C"
    assert c["course_title"] == "Calculus III"
    assert c["units"] == 4
    assert c["description"] == "Multivariable calculus"
    assert c["prerequisites"] == "MAT21B"
    assert c["fulfillment_tags"] == ["SE", "QR"]
    assert c["offered"] is True
    assert c["average_gpa"] == 3.5


def test_all_assemble_courses_professors_mapping_and_display():
    _, rows = create_course_and_rows()
    result = _all_assemble_courses(rows)
    c = result[0]
    profs = c["professors"]

    # Should have 3 professors
    assert len(profs) == 3
    by_name = {p["professor_name"]: p for p in profs}

    # p1 has rating 4.6
    assert by_name["John Doe"]["overall_rating"] == 4.0 + 0.6  # 4.6
    assert by_name["John Doe"]["is_teaching"] is True

    # p2 has N/A -> displayed as 0 (current logic)
    assert by_name["Jane Smith"]["overall_rating"] == 0
    assert by_name["Jane Smith"]["is_teaching"] is False

    # p3 has rating 3.9
    assert by_name["Bob Johnson"]["overall_rating"] == 3.0 + 0.9  # 3.9
    assert by_name["Bob Johnson"]["is_teaching"] is True


def test_all_assemble_courses_average_matches_display_logic():
    _, rows = create_course_and_rows()
    result = _all_assemble_courses(rows)
    c = result[0]

    assert c["average_overall_rating"] == 4.25


def test_all_assemble_courses_sorting():
    _, rows = create_course_and_rows()
    result = _all_assemble_courses(rows)
    profs = result[0]["professors"]

    # Sorted by overall_rating desc (0 for N/A goes last)
    names_in_order = [p["professor_name"] for p in profs]
    assert names_in_order[0] == "John Doe"      # 4.6
    assert names_in_order[1] == "Bob Johnson"   # 3.9
    assert names_in_order[-1] == "Jane Smith"   # 0 from N/A


def test_all_assemble_courses_handles_missing_professor_rows():
    # Include a row with missing professor to ensure it's skipped safely
    course, rows = create_course_and_rows()
    rows.append((course, None, None))

    result = _all_assemble_courses(rows)
    assert len(result[0]["professors"]) == 3


