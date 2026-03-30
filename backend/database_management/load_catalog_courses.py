"""Load catalog courses into the database.

Usage:
  python -m backend.database_management.load_catalog_courses

Reads the scraped catalog JSON produced by data pipeline:
  backend/data_pipelines/data/catalog.json

Inserts rows into the 'courses' table if they do not already exist. This is a
one-time (or occasionally repeated) population script for baseline catalog data.
It does NOT touch embeddings, fulfillment_tags, prereq, offered flags, etc.
Those can be enriched by other scripts.
"""

import json
import os
import re
from typing import Any, Dict, List

try:
    import google.generativeai as genai
except Exception:
    genai = None

from ..server.database import get_db_connection

CATALOG_JSON_PATH = "etl_pipelines/data/catalog.json"
EMBED_MODEL = "models/text-embedding-004"
EMBED_DIM = 768

# normalization helpers
_course_code_re = re.compile(r"^([A-Z]{2,4})\s*0*([0-9]+[A-Z]?)$", re.IGNORECASE)
_units_number_re = re.compile(r"^(?P<low>\d+)(?:-(?P<high>\d+))?\s*unit")


def parse_course_id(raw: str) -> str:
    """Convert catalog course_code like 'MAT 021C' to 'MAT21C'."""
    if not raw:
        return ""
    raw = raw.strip()
    m = _course_code_re.match(raw)
    if not m:
        return raw.replace(" ", "")
    subj = m.group(1).upper()
    num = m.group(2).upper()
    num = re.sub(r"^0+", "", num)
    return f"{subj}{num}"


def parse_units(raw: str) -> int | None:
    """Pick a representative units value (low end) from string like '1-5 units' or '4 units'."""
    if not raw:
        return None
    raw = raw.lower()
    m = _units_number_re.match(raw)
    if not m:
        return None
    low = m.group("low")
    return int(low) if low else None


def load_catalog_json(path: str) -> list[Dict[str, Any]]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _extract_fulfillment_tags(row: Dict[str, Any]) -> str | None:
    """Extract GE / fulfillment codes from general_education text into 'QL,SE,SL' format.
    """
    ge_text = row.get("general_education") or row.get("generalEducation") or ""
    if not ge_text:
        return None
    codes = re.findall(r"\(([A-Z]{1,4})\)", ge_text)
    if not codes:
        return None
    seen = []
    for c in codes:
        if c not in seen:
            seen.append(c)
    return ",".join(seen)


def upsert_courses(rows: list[Dict[str, Any]]):
    """Insert new catalog courses and selectively update NULL fields on existing rows.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    inserted_ids: List[str] = []
    updated_ids: List[str] = []
    embedding_candidates: List[str] = []
    inserted = 0
    touched_existing = 0
    for row in rows:
        course_code = row.get("course_code")
        course_id = parse_course_id(course_code)
        title = row.get("course_title") or ""
        description = (row.get("description") or "").strip()
        units_str = row.get("units") or ""
        units_val = parse_units(units_str)
        prereq_val = (row.get("prerequisites") or "").strip()
        fulfillment_val = _extract_fulfillment_tags(row)

        if not course_id:
            continue

        # Try insert first
        try:
            cur.execute(
                """
                INSERT INTO courses (course_id, course_title, units, description, fulfillment_tags, prereq, offered)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (course_id) DO NOTHING;
                """,
                (course_id, title, units_val, description or None, fulfillment_val, prereq_val or None, False),
            )
            if cur.rowcount > 0:
                inserted += 1
                inserted_ids.append(course_id)
            else:
                # Existing row, fetch current nullable columns
                cur.execute(
                    """
                    SELECT description, fulfillment_tags, prereq, embedding
                    FROM courses WHERE course_id = %s;
                    """,
                    (course_id,),
                )
                existing = cur.fetchone()
                if not existing:
                    continue
                ex_description, ex_fulfillment, ex_prereq, ex_embedding = existing
                updates = []
                params: List[Any] = []
                if ex_description is None and description:
                    updates.append("description = %s")
                    params.append(description)
                if ex_fulfillment is None and fulfillment_val:
                    updates.append("fulfillment_tags = %s")
                    params.append(fulfillment_val)
                if ex_prereq is None and prereq_val:
                    updates.append("prereq = %s")
                    params.append(prereq_val)
                if updates:
                    params.append(course_id)
                    sql = f"UPDATE courses SET {', '.join(updates)} WHERE course_id = %s"
                    try:
                        cur.execute(sql, params)
                        if cur.rowcount > 0:
                            updated_ids.append(course_id)
                    except Exception as e:
                        print(f"[warn] failed update {course_id}: {e}")
                        conn.rollback()
                        continue
                # Mark for embedding if still null embedding
                if ex_embedding is None:
                    embedding_candidates.append(course_id)
                touched_existing += 1
                # If no updates and embedding present, nothing else to do
                if ex_embedding is None and course_id not in embedding_candidates:
                    embedding_candidates.append(course_id)
                # If newly obtained description/fulfillment/prereq were all blank, we still may embed if needed
        except Exception as e:
            print(f"[warn] failed insert/update path {course_id}: {e}")
            conn.rollback()
            continue

        # For newly inserted rows, they have no embedding yet
        if course_id in inserted_ids:
            embedding_candidates.append(course_id)

    conn.commit()
    cur.close()
    conn.close()

    # Deduplicate embedding candidate list
    embedding_candidates = list(dict.fromkeys(embedding_candidates))
    print(
        f"[catalog-load] inserted={inserted} existing_seen={touched_existing} updated_nulls={len(updated_ids)} embedding_candidates={len(embedding_candidates)}"
    )
    return inserted_ids, updated_ids, embedding_candidates


def maybe_generate_embeddings(course_ids: List[str]):
    """Generate embeddings for provided course_ids that lack them.
    """
    if not course_ids:
        return
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key or genai is None:
        print("[catalog-embed] skipping (no GOOGLE_API_KEY or genai lib)")
        return
    try:
        genai.configure(api_key=api_key)
    except Exception as e:
        print(f"[catalog-embed] configure failed: {e}")
        return

    conn = get_db_connection()
    cur = conn.cursor()
    embedded = 0
    skipped = 0
    for cid in course_ids:
        try:
            cur.execute("SELECT course_title, description, embedding FROM courses WHERE course_id = %s;", (cid,))
            row = cur.fetchone()
            if not row:
                continue
            title, description, existing_embedding = row
            if existing_embedding is not None:
                skipped += 1
                continue
            text_to_embed = f"{cid} {title or ''} { (description or '').strip() }".strip()
            if not text_to_embed:
                skipped += 1
                continue
            try:
                resp = genai.embed_content(
                    model=EMBED_MODEL,
                    content=text_to_embed,
                    output_dimensionality=EMBED_DIM,
                )
                embedding_vec = resp.get("embedding") if isinstance(resp, dict) else None
                if not embedding_vec:
                    skipped += 1
                    continue
                cur.execute("UPDATE courses SET embedding = %s WHERE course_id = %s;", (embedding_vec, cid))
                embedded += 1
            except Exception as e:  # individual failure
                print(f"[catalog-embed] failed {cid}: {e}")
                continue
        except Exception as outer:
            print(f"[catalog-embed] query fail {cid}: {outer}")
            continue
    conn.commit()
    cur.close()
    conn.close()
    print(f"[catalog-embed] embedded={embedded} skipped={skipped}")


def main():
    if not os.path.exists(CATALOG_JSON_PATH):
        raise SystemExit(f"Catalog JSON not found at {CATALOG_JSON_PATH}. Run the scraper first.")
    rows = load_catalog_json(CATALOG_JSON_PATH)
    inserted_ids, updated_ids, embed_ids = upsert_courses(rows)
    maybe_generate_embeddings(embed_ids)


if __name__ == "__main__":
    main()
