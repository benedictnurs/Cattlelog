from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import or_
from fastapi.responses import Response
from redis.asyncio import Redis
from starlette.concurrency import run_in_threadpool

import re
import os
from datetime import datetime
from zoneinfo import ZoneInfo

try:
    import kronicler
    KRONICLER_AVAILABLE = True
except ImportError:
    KRONICLER_AVAILABLE = False

from .assembly_logic.all_professor_logic import _all_assemble_professors
from .assembly_logic.all_course_logic import _all_assemble_courses
from .assembly_logic.single_course_logic import _assemble_single_course_details
from .assembly_logic.single_professor_logic import _assemble_single_professor

from .database import get_db
from .models import Courses, Reviews, Professors, ClassesProfessors, Grades, CattlelogReviews

from .schemas.write_review_schemas import CattlelogReviewRequest
from .schemas.course_schemas import CourseDetailsResponse

from .endpoints.get_professor_summary import summarize_reviews
from .endpoints.get_single_course import single_course
from .endpoints.get_search import course_search_ids_only, professor_search_query
from .endpoints.get_grade_distribution import course_endpoint

from .redis.client import get_redis
from .redis import keys as CK
from .redis import ttl as TTL
from .redis.utils import to_bytes, from_bytes

DB = None
if KRONICLER_AVAILABLE:
    DB = kronicler.Database(sync_consume=True)

router = APIRouter()
API_PREFIX = "/api"

DIGITS = re.compile(r'^\d+$')

PACIFIC_TZ = ZoneInfo("America/Los_Angeles")
STARTED_AT = datetime.now(PACIFIC_TZ).isoformat()
GIT_SHA = os.getenv("GIT_COMMIT")


#############################################
# GET /health - Health Check Endpoint
#############################################
@router.get(f"{API_PREFIX}/health")
async def health_check():
    """Health check endpoint for verifying backend availability"""
    return {
        "status": "healthy",
        "service": "course-recommender-backend",
        "started_at": STARTED_AT,
        "timezone": "America/Los_Angeles",
        # Commit SHA if available
        "commit": GIT_SHA,
    }


#############################################
# GET /api/logs - All Kronicler Logs
#############################################
@router.get(f"{API_PREFIX}/logs")
def read_logs():
    if DB is not None:
        return DB.logs()
    return []


#############################################
# GET /api/courses - All Course Data
#############################################
@router.get(f"{API_PREFIX}/courses")
async def get_all_courses(
    db: Session = Depends(get_db),
    max: int = Query(200_000_000, alias="max"),
    r: Redis = Depends(get_redis)
):
    key = CK.k_all_courses(max)
    if r:
        cached = await r.get(key)
        if cached:
            return Response(content=cached, media_type="application/json", headers={"Content-Encoding": "gzip", "Cache-Control": "public, max-age=3600, stale-while-revalidate=60"})

    def _fetch():
        return (
            db.query(Courses, ClassesProfessors, Professors)
              .outerjoin(ClassesProfessors, ClassesProfessors.course_id == Courses.course_id)
              .outerjoin(Professors, Professors.professor_id == ClassesProfessors.professor_id)
              .limit(max)
              .all()
        )
    rows = await run_in_threadpool(_fetch)

    def _assemble_zip():
        assembled = _all_assemble_courses(rows)
        return to_bytes(assembled, compress=True)   # uses orjson + gzip(level=5)
    body = await run_in_threadpool(_assemble_zip)

    if r:
        try:
            await r.setex(key, TTL.ALL_COURSES, body)
        except Exception:
            pass

    return Response(
        content=body,
        media_type="application/json",
        headers={"Content-Encoding": "gzip", "Cache-Control": "public, max-age=3600, stale-while-revalidate=60"}
    )

#################################################
# GET /api/professors - All Professor Details
#################################################
@router.get(f"{API_PREFIX}/professors")
async def get_all_professors(
    db: Session = Depends(get_db),
    r: Redis = Depends(get_redis),
):
    key = CK.k_all_professors()

    if r:
        cached = await r.get(key)
        if cached:
            return Response(content=cached, media_type="application/json", headers={
                "Content-Encoding": "gzip",
                "Cache-Control": "public, max-age=3600, stale-while-revalidate=60",
            })

    def _fetch():
        return (
            db.query(Professors)
              .options(
                  selectinload(Professors.classes).selectinload(ClassesProfessors.course),
                  selectinload(Professors.reviews),
                  selectinload(Professors.cattlelog_reviews),
              )
              .all()
        )

    professors = await run_in_threadpool(_fetch)

    def _assemble_zip():
        assembled = _all_assemble_professors(professors)
        return to_bytes(assembled, compress=True)

    body = await run_in_threadpool(_assemble_zip)

    if r:
        try:
            await r.setex(key, TTL.ALL_PROFESSORS, body)
        except Exception:
            pass

    return Response(
        content=body,
        media_type="application/json",
        headers={
            "Content-Encoding": "gzip",
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=60",
        },
    )

########################################################################
# GET /api/courses/{course_id} - Course Details With Reviews
########################################################################
@router.get(f"{API_PREFIX}/courses/{{course_id}}")
async def get_course_details(course_id: str, db: Session = Depends(get_db)):
    return single_course(course_id, db)


################################################################################
# GET /api/courses/{course_id}/grades - Course Details for grades
################################################################################
@router.get(f"{API_PREFIX}/courses/{{course_id}}/grades")
async def get_course_grades(course_id: str, db: Session = Depends(get_db), r: Redis = Depends(get_redis)):
    key = CK.k_grades(course_id)
    if r:
        try:
            cached = await r.get(key)
            if cached:
                return Response(
                    content=cached,
                    media_type="application/json",
                    headers={
                        "Content-Encoding": "gzip",
                        "Cache-Control": "public, max-age=3600, stale-while-revalidate=60",
                    },
                )
        except Exception:
            pass
    data = await run_in_threadpool(lambda: course_endpoint(course_id, db))
    if r:
        try:
            body = to_bytes(data, compress=True)  # orjson + gzip(level=5)
            await r.setex(key, TTL.DAY, body)
            return Response(
                content=body,
                media_type="application/json",
                headers={
                    "Content-Encoding": "gzip",
                    "Cache-Control": "public, max-age=3600, stale-while-revalidate=60",
                },
            )
        except Exception:
            pass
    return data


########################################
# GET /api/professors/{identifier}
########################################
@router.get(f"{API_PREFIX}/professors/{{identifier}}")
async def get_professor_details(identifier: str, db: Session = Depends(get_db), r: Redis = Depends(get_redis)):
    key = CK.k_prof(identifier)
    if r:
        try:
            cached = await r.get(key)
            if cached:
                return from_bytes(cached, compressed=True)
        except Exception:
            pass

    def _load_professor():
        professor_query = (
            db.query(Professors)
            .options(
                selectinload(Professors.classes).selectinload(ClassesProfessors.course),
                selectinload(Professors.reviews),
                selectinload(Professors.cattlelog_reviews),
            )
        )
        # Search by professor ID or slug depending on input format
        if identifier.isdigit():
            return professor_query.filter(Professors.professor_id == identifier).first()
        else:
            return professor_query.filter(Professors.slug == identifier).first()

    professor = await run_in_threadpool(_load_professor)
    if not professor:
        raise HTTPException(status_code=404, detail="Professor not found")

    # Use the assembly logic with AI summarization
    result = _assemble_single_professor(professor)

    if r:
        try:
            await r.setex(key, TTL.PROF, to_bytes(result, compress=True))
        except Exception:
            pass

    return result


#############################################
# POST /api/professors/summarize_professor
# Output: Summarize professor reviews using AI
#############################################
@router.post(f"{API_PREFIX}/professors/summarize_professor")
async def summarize_professor_reviews_endpoint(
    request: dict,
):
    """
    Generate AI summary from professor data passed from frontend.
    Expects: { "professor_info": {...}, "reviews": [...] }
    """
    professor_info = request.get("professor_info", {})
    reviews = request.get("reviews", [])

    summary = await run_in_threadpool(
        summarize_reviews,
        professor_info,
        reviews
    )
    return {"summary": summary}


###########################################################
# GET /api/search/courses?search_term=computer
###########################################################
@router.get(f"{API_PREFIX}/search/courses")
async def search_courses_endpoint(search_term: str, db: Session = Depends(get_db)):
    return await course_search_ids_only(db, search_term)


##############################################################
# GET /api/search/professors?search_term=frank
##############################################################
@router.get(f"{API_PREFIX}/search/professors")
async def search_professors_endpoint(search_term: str, db: Session = Depends(get_db)):
    return professor_search_query(db, search_term)


######################################################################
# GET /api/search/grades/courses?search_term=ecs
######################################################################
@router.get(f"{API_PREFIX}/search/grades/courses", summary="Search courses with grade data using fuzzy + semantic search")
async def search_grade_courses(
    search_term: str = Query(..., description="Search term for course search"),
    db: Session = Depends(get_db),
):
    search_results = await course_search_ids_only(db, search_term)

    courses_with_grades = (
        db.query(Grades.course_id)
          .distinct()
          .all()
    )
    courses_with_grades_set = {row[0] for row in courses_with_grades}

    course_ids = [
        result["course_id"]
        for result in search_results
        if result["course_id"] in courses_with_grades_set
    ][:8]

    return course_ids


######################################################################
# GET /api/courses/{course_id}/is_teaching?identifiers=...
######################################################################
@router.get(f"{API_PREFIX}/courses/{{course_id}}/is_teaching")
async def is_professor_teaching(
    course_id: str, identifiers: list[str] = Query(...), db: Session = Depends(get_db)
):
    # Separate numeric IDs from slugs
    ids = [x for x in identifiers if DIGITS.match(x)]
    slugs = [x for x in identifiers if not DIGITS.match(x)]
    q = (
        db.query(ClassesProfessors)
          .join(Professors, ClassesProfessors.professor_id == Professors.professor_id)
          .filter(ClassesProfessors.course_id == course_id)
    )

    if ids and slugs:
        q = q.filter(or_(
            ClassesProfessors.professor_id.in_(ids),
            Professors.slug.in_(slugs),
        ))
    elif ids:
        q = q.filter(ClassesProfessors.professor_id.in_(ids))
    else:
        q = q.filter(Professors.slug.in_(slugs))

    teaching_records = q.all()

    results = []
    for ident in identifiers:
        rec = next(
            (r for r in teaching_records
            if (DIGITS.match(ident) and r.professor_id == ident)
            or (not DIGITS.match(ident) and r.professor.slug == ident)),
            None
        ) if teaching_records else None

        if rec is None:
            results.append({
                "identifier": ident,
                "course_id": course_id,
                "error": "Professor or course for current quarter not found",
            })
        else:
            results.append({
                "identifier": ident,
                "professor_id": rec.professor_id,
                "professor_slug": rec.professor.slug,
                "course_id": course_id,
                "is_teaching_this_quarter": rec.offered,
            })

    return results


################################################################################
# POST /api/reviews/cattlelog
# Output: Post route to create a new cattlelog exclusive reviews
################################################################################
@router.post(f"{API_PREFIX}/reviews/cattlelog")
def create_cattlelog_review(
    request: CattlelogReviewRequest,
    db: Session = Depends(get_db),
    r: Redis = Depends(get_redis)
):
    new_review = CattlelogReviews(
        course_id=request.course_id,
        professor_name=request.professor_name,
        term=request.term,
        email=request.email,
        quality_rating=request.quality_rating,
        difficulty_rating=request.difficulty_rating,
        review=request.review,
        tags=request.tags if request.tags else [],
        date=request.date,
        grade=request.grade,
        unique_review=True,  # Ensures this review is from our site
    )
    db.add(new_review); db.commit(); db.refresh(new_review)
    # Cache invalidation
    if r:
        try:
            prof = db.query(Professors).filter(Professors.professor_name == request.professor_name).first()
            pipe = r.pipeline()
            if prof:
                if prof.slug: pipe.delete(CK.k_prof(prof.slug))
                if prof.professor_id: pipe.delete(CK.k_prof(str(prof.professor_id)))
            pipe.execute()
        except Exception:
            pass

    return {"message": "Cattlelog review created successfully", "review": new_review}
