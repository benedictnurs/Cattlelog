from server.utils import parse_course_id, get_most_common_tags
from server.models import Reviews


def test_parse_course_id():
    assert ("MAT", 21, "C") == parse_course_id("MAT21C")
    assert ("MAT", 21, "C") == parse_course_id("MAT021C")
    assert ("ENG", 3, "") == parse_course_id("ENG003")


def test_get_most_common_tags():
    a = Reviews()
    b = Reviews()
    c = Reviews()
    d = Reviews()

    a.tags = ["A", "B", "C"]
    b.tags = ["A", "B"]
    c.tags = ["B", "D"]
    d.tags = ["A", "C", "B"]
    reviews = [a, b, c, d]

    tags = get_most_common_tags(reviews)
    assert tags == ["B", "A", "C"]
