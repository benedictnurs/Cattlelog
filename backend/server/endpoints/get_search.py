from fastapi import HTTPException
import google.generativeai as genai
import os
import time
import asyncio

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from server.models import Courses, Reviews, Professors, ClassesProfessors
from typing import List
from posthog import Posthog

from server.assembly_logic.all_course_logic import _all_assemble_courses
from server.assembly_logic.all_professor_logic  import _all_assemble_professors

# Configure the GenAI client
genai_key = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=genai_key)

POSTHOG_API_KEY = os.getenv("POSTHOG_API_KEY")
posthog = Posthog(POSTHOG_API_KEY, host="https://us.i.posthog.com")


class TimeTrace:
    """TimeTrace is used to monitor performance of function through
    experimentation

    In future, this can be moved to a utility file if it's expanded upon
    """

    def __init__(self, experiment_name: str):
        self.name = experiment_name
        # New storage is created for each instance of TimeTrace
        self.store = {}

    def add_trace(self, name: str):
        """Add the current time to the storage"""
        self.store[name] = time.time()

    def commit(self):
        """Upload the experiment event to posthog"""

        posthog.capture(
            # Use the same id to prevent multiple unique user count to go up
            distinct_id="TimeTrace",
            event=self.name,
            properties=self.store,
        )

threshold = 0.65


async def embed_search_term(search_term: str):
    return await asyncio.to_thread(
        genai.embed_content,
        model="models/text-embedding-004",
        content=search_term,
        output_dimensionality=768,
    )


async def course_search_query(db: Session, search_term: str) -> List[dict]:
    """
    Searches for courses using fuzzy matching on course IDs and titles.
    Falls back to semantic search if no results are found.
    """
    tt = TimeTrace("course_search_query_test")

    course_id_joined = search_term.replace(" ", "").lower()

    tt.add_trace("function_start_time")

    # Optimization Notes:
    # Step 1: Add perf log checkpoints and see how this performs in production
    #   The reason to test perf in production is because it's significantly
    #   more accurate easier than making a similar environment (including
    #   hardware) to test in realistic conditions.
    #
    # Step 2: See which commands take up the most amount of time
    #   This will help us narrow down on what is causing the issue.
    #   We could blindly fix a bunch things and check the overall performance,
    #   but using logging checkpoint will allow us to learn from this
    #   experiment.
    #
    # Additionally, these logs will act like regression tests in the future.
    # We will also test the time of the entire function to calculate a total
    # improvement over the previous version.
    #
    # Stage 1 is complete here. We will now go on to monitoring the performance
    # in the production environment. After we get enough data in a few days, we
    # will implement speed improvements.
    #
    # The experiment has started and I ranked what takes the longest to run
    # from 1st (worst) to 3rd. The time in-between the other checkpoints is
    # completely negligible.

    # Prefect the embed result but don't await it
    embed_result_promise = embed_search_term(search_term)

    tt.add_trace("embed_promise")

    # First, try the LIKE-based search
    course_subquery = (
        db.query(
            Courses.course_id,
            func.greatest(
                func.similarity(
                    func.replace(Courses.course_id, " ", ""), course_id_joined
                ),
                func.similarity(Courses.course_title, search_term),
            ).label("score"),
        )
        .filter(
            or_(
                func.replace(Courses.course_id, " ", "").ilike(f"%{course_id_joined}%"),
                Courses.course_title.ilike(f"%{search_term}%"),
                func.similarity(
                    func.replace(Courses.course_id, " ", ""), course_id_joined
                )
                > threshold,
                func.similarity(Courses.course_title, search_term) > threshold,
            )
        )
        .subquery()
    )

    tt.add_trace("course_subquery")

    query = (
        db.query(Courses, ClassesProfessors, Professors)
        .outerjoin(ClassesProfessors, Courses.course_id == ClassesProfessors.course_id)
        .outerjoin(Professors, Professors.professor_id == ClassesProfessors.professor_id)
        .join(course_subquery, Courses.course_id == course_subquery.c.course_id)
        .order_by(course_subquery.c.score.desc())
    )

    tt.add_trace("first_query")

    data = query.all()

    # 3. The code before this takes the third longest.
    tt.add_trace("fetch_all")

    if data:
        return _all_assemble_courses(data)

    tt.add_trace("assemble_courses")

    # Semantic search fallback
    embed_result = await embed_result_promise

    # 1. The code before this takes the longest
    # Or at least, it was before it was made into an async function
    tt.add_trace("create_embed_async_version")

    query_vector = embed_result["embedding"]

    top_courses_subquery = (
        db.query(Courses.course_id)
        .order_by(Courses.embedding.op("<=>")(query_vector))
        .limit(5)
        .subquery()
    )

    tt.add_trace("top_subqeury")

    query = (
        db.query(Courses, ClassesProfessors, Professors)
        .outerjoin(ClassesProfessors, Courses.course_id == ClassesProfessors.course_id)
        .outerjoin(Professors, Professors.professor_id == ClassesProfessors.professor_id)
        .join(
            top_courses_subquery, Courses.course_id == top_courses_subquery.c.course_id
        )
        .filter(Courses.course_id.in_(top_courses_subquery))
    )

    tt.add_trace("second_query")

    data = query.all()

    # 2. The code before this takes the second longest
    tt.add_trace("second_fetch_all")

    if not data:
        raise HTTPException(status_code=404, detail="No courses found")

    assembled = _all_assemble_courses(data)

    tt.add_trace("second_assemble")

    tt.commit()

    return assembled

async def course_search_ids_only(db: Session, search_term: str):
    term = search_term.strip()
    if not term:
        return []

    course_id_joined = term.replace(" ", "").lower()

    course_subq = (
        db.query(
            Courses.course_id,
            func.greatest(
                func.similarity(func.replace(Courses.course_id, " ", ""), course_id_joined),
                func.similarity(Courses.course_title, term),
            ).label("score"),
        )
        .filter(
            or_(
                func.replace(Courses.course_id, " ", "").ilike(f"%{course_id_joined}%"),
                Courses.course_title.ilike(f"%{term}%"),
                func.similarity(func.replace(Courses.course_id, " ", ""), course_id_joined) > threshold,
                func.similarity(Courses.course_title, term) > threshold,
            )
        )
        .order_by(func.greatest(
            func.similarity(func.replace(Courses.course_id, " ", ""), course_id_joined),
            func.similarity(Courses.course_title, term),
        ).desc())
        .all()
    )

    if course_subq:
        return [{"course_id": row.course_id, "score": float(row.score)} for row in course_subq]

    # semantic fallback if no fuzzy hits,
    # but returning only course_ids from nearest vectors.
    embed_result = await embed_search_term(term)
    query_vector = embed_result["embedding"]

    top_courses = (
        db.query(Courses.course_id)
        .order_by(Courses.embedding.op("<=>")(query_vector))
        .limit(5)
        .all()
    )
    if not top_courses:
        raise HTTPException(status_code=404, detail="No courses found")
    return [{"course_id": row.course_id, "score": None} for row in top_courses]


def professor_search_query(db: Session, search_term: str) -> List[dict]:
    term = search_term.strip()
    if not term:
        return []

    threshold = 0.65

    # only pull back the three columns we need
    rows = (
        db.query(
            Professors.professor_id,
            Professors.slug.label("professor_slug"),
            Professors.professor_name,
        )
        .filter(
            or_(
                Professors.professor_name.ilike(f"%{term}%"),
                func.similarity(Professors.professor_name, term) > threshold,
            )
        )
        .order_by(func.similarity(Professors.professor_name, term).desc())
        .limit(20)
        .all()
    )

    # map into the shape your front end expects
    return [
        {
            "professor_id": prof_id,
            "professor_slug": slug,
            "professor_name": name,
        }
        for prof_id, slug, name in rows
    ]