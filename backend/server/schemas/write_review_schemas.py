from pydantic import BaseModel
from typing import List, Dict, Optional

class CattlelogReviewRequest(BaseModel):
    course_id: str
    professor_name: str
    term: str | None
    email: str | None
    quality_rating: float
    difficulty_rating: float
    review: str
    tags: list[str] = []
    date: str | None = None
    grade: str | None = None
