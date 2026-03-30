"""
Fix professor IDs that were incorrectly set to slugs by migrating data to the
correct numeric IDs and merging relationships/attributes.

Two modes:
1) Mapping mode (default): Use the built-in list of specific professors.
   - Requires at least one review already using the numeric id (safety guard).
   - Deletes old professor rows after migration (keeps DB tidy).

2) JSON-wide force mode: Process ALL professors from the provided JSON file.
   - Bypasses the numeric-review guard and forces relationships to the JSON id.
   - DOES NOT delete old professor rows by default (avoids slug/grades FK risk).

Run (Windows PowerShell):
  # Dry-run targeted mapping (default behavior)
  python -m backend.database_management.fix_professor_ids_from_slugs --dry-run --verbose

  # Apply targeted mapping
  python -m backend.database_management.fix_professor_ids_from_slugs --verbose

  # Dry-run JSON-wide force transfer (recommended first)
  python -m backend.database_management.fix_professor_ids_from_slugs --all-from-json --dry-run --verbose

  # Apply JSON-wide force transfer (keeps old rows, no deletes)
  python -m backend.database_management.fix_professor_ids_from_slugs --all-from-json --verbose

Options:
  --file <path>       Path to the professors JSON used to enrich fields.
  --all-from-json     Iterate ALL professors from the JSON instead of the built-in list.
                      In this mode, we force-migrate relationships and DO NOT delete
                      old rows by default to avoid slug/grades foreign key violations.

Notes:
  - Idempotent. Safe to re-run.
  - Mapping mode is conservative and cleans up old rows; JSON mode is broader and avoids deletes.
"""
from __future__ import annotations

import argparse
import csv
import json
import os
from io import StringIO
from typing import Dict, List, Optional, Tuple

from backend.server.database import get_db_connection


# Provided mapping: numeric_id, professor_name, slug (slug is ignored per request)
MAPPING_CSV = """
1233013,Adam Moule,adam-moule-1233013
3104489,Akira Horiguchi,akira-horiguchi-3104489
3037215,Alan Dugger,alan-dugger-3037215
370188,Andrea Khoo,andrea-khoo-370188
3080333,Andrew Testa,andrew-testa-3080333
2917800,Angela Morris,angela-morris-2917800
3086500,Ani Abovian,ani-abovian-3086500
2343069,Antoine Champetier,antoine-champetier-2343069
2355617,April Peletta,april-peletta-2355617
2916141,Ariana Valle,ariana-valle-2916141
2292583,Benjamin Pellegrom,benjamin-pellegrom-2292583
2021944,Brenda Rinard,brenda-rinard-2021944
3052294,Brennan Gonering,brennan-gonering-3052294
657805,Carlos Jackson,carlos-jackson-657805
1356371,Carl Whithaus,carl-whithaus-1356371
3106401,Casey Manogue,casey-manogue-3106401
858246,Christi Bamford~9/19/12,christi-bamford-9-19-12
1389656,Christina Cogdell,christina-cogdell-1389656
1404490,Christina Cogdell,christina-cogdell-1404490
2920058,Cory Parker,cory-parker-2920058
2963323,Daniel Langford,daniel-langford-2963323
3111755,Daria Taback,daria-taback-3111755
2903129,David Lang,david-lang-2903129
3109337,Deni Velagic,deni-velagic-3109337
3061537,Dogyoon Song,dogyoon-song-3061537
3108729,Dylan Moore,dylan-moore-3108729
2097348,Emily Foss,emily-foss-2097348
3107159,Evan Martinak,evan-martinak-3107159
2996091,Francisco Martinez Avina,francisco-martinez-avina-2996091
1240477,Heather Milton,heather-milton-1240477
3108147,Henry Gonzalez,henry-gonzalez-3108147
2882194,Jala Alarja,jala-alarja-2882194
477262,Jeanette Money,jeanette-money-477262
2134182,Jean-Jacques Lambert,jean-jacques-lambert-2134182
3107044,Jeremy Freeman,jeremy-freeman-3107044
3092690,Jeremy Rud,jeremy-rud-3092690
20268,John Constantine,john-constantine-20268
1156485,John Maxey,john-maxey-1156485
285461,John Samsel,john-samsel-285461
1008836,Julie Wyman,julie-wyman-1008836
1199894,Katharine Graf-Estes,katharine-graf-estes-1199894
3108223,Katie Chappell,katie-chappell-3108223
2880718,Kenjiro Quides,kenjiro-quides-2880718
3036790,Lifu Huang,lifu-huang-3036790
116853,Lori Lubin,lori-lubin-116853
3106810,Lotte Borkowski,lotte-borkowski-3106810
3013895,Meredith Carlson,meredith-carlson-3013895
77832,Milmon Harrison,milmon-harrison-77832
1001197,Natalia Deeb-Sossa,natalia-deeb-sossa-1001197
3076254,Oliver Siebert,oliver-siebert-3076254
374028,Pamela Demory,pamela-demory-374028
3108633,Preston Stone,preston-stone-3108633
319536,Robin Hill,robin-hill-319536
1974495,Shannah Lester,shannah-lester-1974495
2253375,Simon Sadler,simon-sadler-2253375
1045076,Soichiro Yamada,soichiro-yamada-1045076
1973551,Stephen Robinson,stephen-robinson-1973551
2347701,Ted Powers,ted-powers-2347701
148744,Trish Berger,trish-berger-148744
1935096,Trish Berger,trish-berger-1935096
3097241,Vincent Lovero,vincent-lovero-3097241
2102159,Vinod Narayanan,vinod-narayanan-2102159
2872231,Xiao-Hui Tai,xiao-hui-tai-2872231
3036794,Zhe Zhao,zhe-zhao-3036794
2996089,Zhi Ding,zhi-ding-2996089
""".strip()


def parse_mapping(csv_text: str) -> List[Tuple[str, str]]:
    reader = csv.reader(StringIO(csv_text))
    pairs: List[Tuple[str, str]] = []
    for row in reader:
        if not row or len(row) < 2:
            continue
        new_id = row[0].strip()
        name = row[1].strip()
        pairs.append((new_id, name))
    return pairs


def load_professor_json(file_path: str) -> Dict[str, dict]:
    """Return mapping from id and from normalized name to JSON record for enrichment."""
    if not file_path or not os.path.exists(file_path):
        return {}
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    by_id: Dict[str, dict] = {}
    by_name: Dict[str, dict] = {}
    for rec in data:
        if not isinstance(rec, dict):
            continue
        rid = str(rec.get("id") or "").strip()
        name = (rec.get("professor_name") or "").strip().lower()
        if rid:
            by_id[rid] = rec
        if name:
            by_name[name] = rec
    # Merge strategies: prefer id match, fallback to name
    return {**{k: v for k, v in by_id.items()}, **{f"name::{k}": v for k, v in by_name.items()}}


def json_pairs(file_path: str) -> List[Tuple[str, str]]:
    """Return (id, name) pairs for all professors in the JSON file."""
    if not file_path or not os.path.exists(file_path):
        raise FileNotFoundError(f"JSON file not found: {file_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    pairs: List[Tuple[str, str]] = []
    for rec in data:
        if not isinstance(rec, dict):
            continue
        rid = str(rec.get("id") or "").strip()
        name = (rec.get("professor_name") or "").strip()
        if rid and name:
            pairs.append((rid, name))
    return pairs


def column_exists(cur, table: str, column: str) -> bool:
    cur.execute(
        """
        SELECT 1 FROM information_schema.columns
        WHERE table_name = %s AND column_name = %s
        """,
        (table, column),
    )
    return cur.fetchone() is not None


def upsert_professor(cur, professor_id: str, name: str, enrich: Optional[dict]):
    # Gather fields from enrich if available
    fields = {
        "professor_id": professor_id,
        "professor_name": name,
        "profile_url": None if not enrich else enrich.get("profile_url"),
        "department": None if not enrich else enrich.get("department"),
        "number_of_ratings": None if not enrich else enrich.get("number_of_ratings"),
        "overall_rating": 0.0 if not enrich else float(enrich.get("overall_rating") or 0),
        "would_take_again_percentage": None if not enrich else enrich.get("would_take_again_percentage"),
        "level_of_difficulty": 0.0 if not enrich else float(enrich.get("level_of_difficulty") or 0),
        # We intentionally do not touch slug here
    }
    # Insert/update without slug to avoid UQ conflicts; will set slug later
    cur.execute(
        """
        INSERT INTO professors (
            professor_id, professor_name, profile_url, department,
            number_of_ratings, overall_rating, would_take_again_percentage,
            level_of_difficulty
        ) VALUES (%(professor_id)s, %(professor_name)s, %(profile_url)s, %(department)s,
                  %(number_of_ratings)s, %(overall_rating)s, %(would_take_again_percentage)s,
                  %(level_of_difficulty)s)
        ON CONFLICT (professor_id) DO UPDATE SET
            professor_name = COALESCE(EXCLUDED.professor_name, professors.professor_name),
            profile_url = COALESCE(EXCLUDED.profile_url, professors.profile_url),
            department = COALESCE(EXCLUDED.department, professors.department),
            number_of_ratings = COALESCE(EXCLUDED.number_of_ratings, professors.number_of_ratings),
            overall_rating = COALESCE(EXCLUDED.overall_rating, professors.overall_rating),
            would_take_again_percentage = COALESCE(EXCLUDED.would_take_again_percentage, professors.would_take_again_percentage),
            level_of_difficulty = COALESCE(EXCLUDED.level_of_difficulty, professors.level_of_difficulty)
        ;
        """,
        fields,
    )


def migrate_one(
    cur,
    new_id: str,
    name: str,
    enrich: Optional[dict],
    verbose: bool = False,
    delete_old: bool = True,
) -> str:
    # Ensure the target professor row exists (no slug changes)
    upsert_professor(cur, new_id, name, enrich)

    # Discover any existing professor rows with the same name but different id (old ids to migrate)
    cur.execute(
        """
        SELECT professor_id
        FROM professors
        WHERE LOWER(professor_name) = LOWER(%s)
          AND professor_id <> %s
          AND professor_id !~ '^[0-9]+$'   -- only non-integer old ids
        """,
        (name, new_id),
    )
    old_ids = [r[0] for r in cur.fetchall() or []]
    # Optional extra guard (defensive double-check): retain only truly non-numeric ids
    old_ids = [oid for oid in old_ids if not str(oid).isdigit()]

    if verbose:
        print(f"{name}: found {len(old_ids)} old id(s) to migrate -> {new_id}: {old_ids}")

    # Upsert classes_professors relationships (merge offered/one_review) for each old id
    try:
        for old_id in old_ids:
            cur.execute(
                """
                INSERT INTO classes_professors (professor_id, course_id, offered, one_review)
                SELECT %s, cp.course_id, cp.offered, cp.one_review
                FROM classes_professors cp
                WHERE cp.professor_id = %s
                ON CONFLICT (professor_id, course_id) DO UPDATE
                SET offered = classes_professors.offered OR EXCLUDED.offered,
                    one_review = COALESCE(classes_professors.one_review, EXCLUDED.one_review);
                """,
                (new_id, old_id),
            )
    except Exception:
        for old_id in old_ids:
            cur.execute(
                """
                INSERT INTO classes_professors (professor_id, course_id, offered)
                SELECT %s, cp.course_id, cp.offered
                FROM classes_professors cp
                WHERE cp.professor_id = %s
                ON CONFLICT (professor_id, course_id) DO UPDATE
                SET offered = classes_professors.offered OR EXCLUDED.offered;
                """,
                (new_id, old_id),
            )

    # Repoint reviews for each old id
    for old_id in old_ids:
        cur.execute("UPDATE reviews SET professor_id = %s WHERE professor_id = %s;", (new_id, old_id))

    # Merge attributes from each old row where target is missing (exclude slug)
    for old_id in old_ids:
        cur.execute(
            """
            UPDATE professors new
            SET professor_name = COALESCE(new.professor_name, old.professor_name),
                profile_url = COALESCE(new.profile_url, old.profile_url),
                department = COALESCE(new.department, old.department),
                number_of_ratings = COALESCE(new.number_of_ratings, old.number_of_ratings),
                overall_rating = COALESCE(new.overall_rating, old.overall_rating),
                would_take_again_percentage = COALESCE(new.would_take_again_percentage, old.would_take_again_percentage),
                level_of_difficulty = COALESCE(new.level_of_difficulty, old.level_of_difficulty),
                common_tags = COALESCE(new.common_tags, old.common_tags)
            FROM professors old
            WHERE new.professor_id = %s AND old.professor_id = %s;
            """,
            (new_id, old_id),
        )

    # Delete old rows if requested (mapping mode).
    # In JSON-wide mode, we skip deletes to avoid violating potential grades->slug FKs.
    if delete_old:
        # Does grades have professor_slug?
        has_grades_slug = column_exists(cur, "grades", "professor_slug")

        for old_id in old_ids:
            # 1) Load the old row’s slug (could be the same string as old_id for slug-ids)
            cur.execute("SELECT slug FROM professors WHERE professor_id = %s;", (old_id,))
            row = cur.fetchone()
            old_slug = row[0] if row else None

            # 2) If grades references the old slug, move grades to a temp slug on the final row first
            temp_slug = None
            if has_grades_slug and old_slug:
                temp_slug = f"{old_slug}__tmp__{new_id}"

                # Set temp slug on the final row, guarding uniqueness
                cur.execute(
                    """
                    UPDATE professors p
                    SET slug = %s
                    WHERE p.professor_id = %s
                        AND NOT EXISTS (
                            SELECT 1 FROM professors q
                            WHERE q.slug = %s AND q.professor_id <> %s
                        );
                    """,
                    (temp_slug, new_id, temp_slug, new_id),
                )

                # Now repoint grades from old_slug -> temp_slug so we can delete the old row safely
                cur.execute(
                    "UPDATE grades SET professor_slug = %s WHERE professor_slug = %s;",
                    (temp_slug, old_slug),
                )

            # 3) Detach/clean mappings that may point to old_id
            try:
                cur.execute(
                    "UPDATE professor_duplicates SET professor_id = %s WHERE professor_id = %s;",
                    (new_id, old_id),
                )
            except Exception:
                try:
                    cur.execute("DELETE FROM professor_duplicates WHERE professor_id = %s;", (old_id,))
                except Exception:
                    pass

            # Remove any remaining class links for old_id (we already merged them above)
            cur.execute("DELETE FROM classes_professors WHERE professor_id = %s;", (old_id,))

            # 4) Delete the old professor row (grades now points at temp_slug on the final row)
            cur.execute("DELETE FROM professors WHERE professor_id = %s;", (old_id,))

            # 5) Finalize: give the canonical old_slug to the final row, then move grades to that slug.
            if has_grades_slug and old_slug and temp_slug:
                # Use a SAVEPOINT so a failure to defer constraints doesn't abort the whole tx
                cur.execute("SAVEPOINT sp_fk_defer;")
                try:
                    # Preferred path: if FK is already DEFERRABLE, defer it for this tx
                    cur.execute("SET CONSTRAINTS fk_grades_professors_professor_slug DEFERRED;")

                    # Change professors slug first (checks deferred until COMMIT)
                    cur.execute(
                        """
                        UPDATE professors
                        SET slug = %s
                        WHERE professor_id = %s
                          AND NOT EXISTS (
                               SELECT 1 FROM professors q
                               WHERE q.slug = %s AND q.professor_id <> %s
                          );
                        """,
                        (old_slug, new_id, old_slug, new_id),
                    )
                    # Now move grades from temp_slug -> old_slug
                    cur.execute(
                        "UPDATE grades SET professor_slug = %s WHERE professor_slug = %s;",
                        (old_slug, temp_slug),
                    )

                    cur.execute("RELEASE SAVEPOINT sp_fk_defer;")
                except Exception:
                    # Roll back just the failed defer attempt, keep transaction alive
                    cur.execute("ROLLBACK TO SAVEPOINT sp_fk_defer;")
                    cur.execute("RELEASE SAVEPOINT sp_fk_defer;")

                    # Fallback: drop whatever FK(s) link grades(professor_slug) -> professors(slug),
                    # then recreate as ON UPDATE CASCADE DEFERRABLE
                    cur.execute("""
DO $$
DECLARE cname text;
BEGIN
  FOR cname IN
    SELECT DISTINCT c.conname
    FROM pg_constraint c
    JOIN pg_class t   ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_class r   ON r.oid = c.confrelid
    JOIN pg_attribute a  ON a.attrelid = t.oid AND a.attnum = ANY (c.conkey)
    JOIN pg_attribute ar ON ar.attrelid = r.oid AND ar.attnum = ANY (c.confkey)
    WHERE n.nspname = current_schema()
      AND c.contype = 'f'
      AND t.relname = 'grades'
      AND r.relname = 'professors'
      AND a.attname = 'professor_slug'
      AND ar.attname = 'slug'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I', current_schema(), 'grades', cname);
  END LOOP;
END $$;
""")
                    cur.execute("""
ALTER TABLE grades
ADD CONSTRAINT fk_grades_professors_professor_slug
FOREIGN KEY (professor_slug) REFERENCES professors(slug)
ON UPDATE CASCADE ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;
""")

                    # With ON UPDATE CASCADE, updating professors.slug will auto-update grades
                    cur.execute(
                        """
                        UPDATE professors
                        SET slug = %s
                        WHERE professor_id = %s
                          AND NOT EXISTS (
                               SELECT 1 FROM professors q
                               WHERE q.slug = %s AND q.professor_id <> %s
                          );
                        """,
                        (old_slug, new_id, old_slug, new_id),
                    )

                    # Belt-and-suspenders: ensure no temp_slug remains in grades
                    cur.execute(
                        "UPDATE grades SET professor_slug = %s WHERE professor_slug = %s;",
                        (old_slug, temp_slug),
                    )



    return f"migrated old ids {old_ids} -> '{new_id}'" if old_ids else "ensured target exists"


def main():
    parser = argparse.ArgumentParser(description="Hardcoded fix for specific professors (slug-id -> numeric-id)")
    parser.add_argument(
        "--file",
        default=os.environ.get(
            "PROFESSOR_FILE_PATH",
            "backend/data_pipelines/data/ucdavis_professors_reviews.json",
        ),
        help="Optional path to professors JSON to enrich fields.",
    )
    parser.add_argument(
        "--all-from-json",
        action="store_true",
        help="Process all professors from the JSON file (force transfer mode; no deletes)",
    )
    parser.add_argument(
        "--force-mapping",
        action="store_true",
        help="In mapping mode, bypass the numeric-review guard and force-migrate to the hardcoded numeric IDs (still deletes old rows).",
    )
    parser.add_argument("--dry-run", action="store_true", help="Preview actions without committing changes")
    parser.add_argument("--verbose", action="store_true", help="Print detailed steps")
    args = parser.parse_args()

    # Determine input set and behavior per mode
    if args.all_from_json:
        pairs = json_pairs(args.file)
        require_numeric_review = False
        delete_old = False
        mode = "JSON"
    else:
        pairs = parse_mapping(MAPPING_CSV)
        require_numeric_review = not args.force_mapping
        delete_old = True
        mode = "MAPPING-FORCE" if args.force_mapping else "MAPPING"
    enrich = load_professor_json(args.file)

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        upserts = 0
        migrations = 0
        for new_id, name in pairs:
            rec = enrich.get(new_id) or enrich.get(f"name::{name.lower()}")

            # In mapping mode, require at least one review already using the numeric id.
            # In JSON-wide mode, we force transfer regardless of review presence.
            if require_numeric_review:
                cur.execute("SELECT 1 FROM reviews WHERE professor_id = %s LIMIT 1;", (new_id,))
                has_reviews_with_numeric = cur.fetchone() is not None
                if not has_reviews_with_numeric:
                    if args.verbose:
                        print(f"[SKIP] {name}: no reviews found with professor_id={new_id}")
                    continue

            if args.dry_run:
                # Find old ids by name
                cur.execute(
                    """
                    SELECT professor_id
                    FROM professors
                    WHERE LOWER(professor_name) = LOWER(%s)
                      AND professor_id <> %s
                      AND professor_id !~ '^[0-9]+$'
                    """,
                    (name, new_id),
                )
                old_ids = [r[0] for r in cur.fetchall() or []]
                old_ids = [oid for oid in old_ids if not str(oid).isdigit()]

                action = "update" if old_ids else "ensure"
                upserts += 1
                if args.verbose:
                    print(f"[DRY][{mode}] {name}: would {action} target={new_id}; old_ids={old_ids}; delete_old={delete_old}")
                if old_ids:
                    migrations += 1
                continue

            # Real migration
            msg = migrate_one(cur, new_id, name, rec, verbose=args.verbose, delete_old=delete_old)
            upserts += 1
            if msg.startswith("migrated"):
                migrations += 1
            conn.commit()
            if args.verbose:
                print(f"[{mode}] {name}: {msg}")

        print(f"Done. Mode={mode}. Upserts: {upserts}; Migrations: {migrations}.")
    except Exception as e:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
