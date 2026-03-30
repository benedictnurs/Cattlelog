from unittest.mock import Mock

from server.assembly_logic.all_professor_logic import _all_assemble_professors
from server.models import Professors, ClassesProfessors, Reviews, CattlelogReviews, Courses


def _make_cp(course_id: str, title: str, offered: bool):
    cp = Mock(spec=ClassesProfessors)
    cp.course_id = course_id
    cp.offered = offered
    cp.course_title = title
    # Provide linked course with title when available
    course = Mock(spec=Courses)
    course.course_title = title
    cp.course = course
    return cp


def _make_review(course_id: str, text: str, tags: list[str]):
    r = Mock(spec=Reviews)
    r.course_id = course_id
    r.review = text
    r.tags = tags
    r.quality_rating = 4.0
    r.difficulty_rating = 3.0
    r.grade = "A"
    r.date = "2024-01-01"
    return r


def _make_cattlelog_review(course_id: str, text: str, tags: list[str]):
    cr = Mock(spec=CattlelogReviews)
    cr.course_id = course_id
    cr.review = text
    cr.tags = tags
    cr.quality_rating = 5.0
    cr.difficulty_rating = 2.0
    cr.grade = "A"
    cr.date = "2024-02-01"
    cr.term = "Fall 2024"
    return cr


def test_all_assemble_professors_basic_mapping_and_classes():
    # Professor with two classes
    p1 = Mock(spec=Professors)
    p1.professor_id = "p1"
    p1.professor_name = "Alice Alpha"
    p1.slug = "alice-alpha"
    p1.department = "Mathematics"
    p1.overall_rating = 4.6
    p1.level_of_difficulty = 3.1
    p1.classes = [
        _make_cp("MAT21C", "Calculus III", True),
        _make_cp("ENG003", "Introduction to Writing", False),
    ]
    p1.reviews = [
        _make_review("MAT21C", "Great class", ["A", "B"]),
        _make_review("ENG003", "Helpful", ["B", "C"]),
    ]
    p1.cattlelog_reviews = [
        _make_cattlelog_review("MAT21C", "Loved it", ["A"]),
    ]

    # Professor without classes
    p2 = Mock(spec=Professors)
    p2.professor_id = "p2"
    p2.professor_name = "Bob Beta"
    p2.slug = "bob-beta"
    p2.department = "Computer Science"
    p2.overall_rating = 3.8
    p2.level_of_difficulty = 2.7
    p2.classes = []
    p2.reviews = []
    p2.cattlelog_reviews = []

    result = _all_assemble_professors([p1, p2])

    # Sorted by department then name: Computer Science (Bob) before Mathematics (Alice)
    assert result[0]["professor_name"] == "Bob Beta"
    assert result[0]["department"] == "Computer Science"
    assert result[0]["classes"] == []

    prof_alice = result[1]
    assert prof_alice["professor_name"] == "Alice Alpha"
    # Classes should be present and sorted by parsed course id
    class_ids = [c["course_id"] for c in prof_alice["classes"]]
    assert class_ids == ["ENG003", "MAT21C"]
    # Offered flags come through
    offered_flags = {c["course_id"]: c["offered"] for c in prof_alice["classes"]}
    assert offered_flags == {"ENG003": False, "MAT21C": True}


def test_all_assemble_professors_common_tags_aggregated():
    p = Mock(spec=Professors)
    p.professor_id = "p3"
    p.professor_name = "Carol Gamma"
    p.slug = "carol-gamma"
    p.department = "Physics"
    p.overall_rating = 4.2
    p.level_of_difficulty = 3.0
    p.classes = [_make_cp("PHY009", "Classical Physics", True)]
    # Tags: B appears 3 times, A twice, C once -> expect ["B", "A", "C"]
    r1 = _make_review("PHY009", "solid", ["A", "B", "C"]) 
    r2 = _make_review("PHY009", "nice", ["A", "B"]) 
    r3 = _make_review("PHY009", "ok", ["B"]) 
    p.reviews = [r1, r2, r3]
    p.cattlelog_reviews = []

    result = _all_assemble_professors([p])
    prof = result[0]
    assert prof["common_tags"] == ["B", "A", "C"]


def test_all_assemble_professors_includes_review_details_per_class():
    p = Mock(spec=Professors)
    p.professor_id = "p4"
    p.professor_name = "Dana Delta"
    p.slug = "dana-delta"
    p.department = "Biology"
    p.overall_rating = 4.0
    p.level_of_difficulty = 2.0
    p.classes = [_make_cp("BIO101", "Intro Biology", True)]
    # One DB review and one cattlelog review for same course
    p.reviews = [_make_review("BIO101", "good", ["Fun"]) ]
    p.cattlelog_reviews = [_make_cattlelog_review("BIO101", "great", ["Engaging"]) ]

    prof = _all_assemble_professors([p])[0]
    reviews = prof["classes"][0]["reviews"]
    # Should contain two reviews with expected fields present
    assert len(reviews) == 2
    keys = set(reviews[0].keys()) | set(reviews[1].keys())
    assert {"quality_rating", "difficulty_rating", "tags", "review", "grade", "date"}.issubset(keys)


