from .utils import stable_hash

def k_all_courses(max_val:int) -> str:
    return f"ac:v1:max={max_val}"

def k_all_professors() -> str:
    return f"all_professors:v1"

def k_prof(identifier:str) -> str:
    return f"prof:{identifier}"


def k_course_info(course_id: str) -> str:
    return f"ci:v1:{course_id}"

def k_grades(course_id: str) -> str:
    return f"gr:v1:{course_id}"

def k_is_teaching(course_id:str, identifiers:list[str]) -> str:
    return f"is_teaching:{course_id}:{stable_hash(identifiers)}"
