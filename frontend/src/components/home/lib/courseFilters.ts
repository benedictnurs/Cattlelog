import { Course } from "../../types/Course";
import { is_bad_regex } from "../../../utils/isAlphabetic";

export type Sort = "none" | "rating" | "gpa";
export type Level = "" | "lower division" | "upper division" | "grad";

export type Filters = {
  prefixes: string[];
  level: Level;
  GEs: string[];
  units: number | null;
  courseNumber?: string | null;
  search: string;
  sort: Sort;
  offeredOnly: boolean;
  noPrereqsOnly: boolean;
  averageRatingRange?: [number, number] | null;
  averageGpaRange?: [number, number] | null;
};

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const courseLevelNum = (id: string) => {
  const m = id.replace("-", " ").match(/^([A-Za-z]+)\s*(\d+)/);
  return m ? parseInt(m[2], 10) : NaN;
};

export function applyFilters(
  all: Course[],
  filters: Filters,
  searchResults?: Course[],
) {
  const base = (filters.search.trim().length ? searchResults : all) ?? all;
  let list = [...base];

  if (filters.prefixes.length) {
    const cleaned = filters.prefixes.map((p) => p.trim()).filter(Boolean);

    if (!is_bad_regex(cleaned)) {
      const rx = new RegExp(
        `^(${cleaned.map(escapeRegExp).join("|")})\\s*\\d+`,
        "i",
      );
      list = list.filter((c) => rx.test(c.course_id));
    }
  }

  if (filters.level) {
    list = list.filter((c) => {
      const n = courseLevelNum(c.course_id);
      if (Number.isNaN(n)) return false;
      if (filters.level === "lower division") return n >= 1 && n <= 99;
      if (filters.level === "upper division") return n >= 100 && n <= 199;
      if (filters.level === "grad") return n >= 200 && n <= 299;
      return true;
    });
  }

  if (filters.courseNumber && filters.courseNumber.trim()) {
    const targetRaw = filters.courseNumber.trim().toUpperCase();
    const normalizeAlphaNum = (s: string) => s.replace(/^0+(?=\d)/, "");
    const target = normalizeAlphaNum(targetRaw);
    const targetDigits =
      target.replace(/[^0-9]/g, "").replace(/^0+/, "") || "0";

    list = list.filter((c) => {
      const m = c.course_id
        .replace("-", " ")
        .match(/^([A-Za-z]+)\s*(\d+[A-Za-z]*)/);
      if (!m) return false;
      const numStr = m[2].toUpperCase();
      const numStrNorm = normalizeAlphaNum(numStr);
      if (/^[0-9]*[A-Z]+$/.test(target)) {
        return numStrNorm === target;
      }
      const digitsOnly =
        numStrNorm.replace(/[^0-9]/g, "").replace(/^0+/, "") || "0";
      return digitsOnly === targetDigits;
    });
  }

  if (filters.GEs.length) {
    list = list.filter((c) =>
      filters.GEs.every((ge) => c.fulfillment_tags.includes(ge)),
    );
  }

  if (filters.units !== null) {
    list = list.filter((c) => c.units === filters.units);
  }

  // Apply average rating range if provided
  if (filters.averageRatingRange && Array.isArray(filters.averageRatingRange)) {
    const [minR, maxR] = filters.averageRatingRange;
    const lo = Math.min(minR ?? 1, maxR ?? 5);
    const hi = Math.max(minR ?? 1, maxR ?? 5);
    list = list.filter((c) => {
      const r = c.average_overall_rating;
      return typeof r === "number" && Number.isFinite(r) && r >= lo && r <= hi;
    });
  }

  // Apply average GPA range if provided
  if (filters.averageGpaRange && Array.isArray(filters.averageGpaRange)) {
    const [minG, maxG] = filters.averageGpaRange;
    const lo = Math.min(minG ?? 0, maxG ?? 4);
    const hi = Math.max(minG ?? 0, maxG ?? 4);
    list = list.filter((c) => {
      const g = c.average_gpa;
      return typeof g === "number" && Number.isFinite(g) && g >= lo && g <= hi;
    });
  }

  return list;
}

export function applyPostFiltersAndSort(list: Course[], filters: Filters) {
  let out = filters.offeredOnly ? list.filter((c) => c.offered) : list;

  if (filters.noPrereqsOnly) {
    out = out.filter(
      (c) => !c.prerequisites || c.prerequisites.trim().toUpperCase() === "N/A",
    );
  }

  if (filters.sort === "gpa") {
    return [...out].sort(
      (a, b) =>
        (b.average_gpa ?? 0) - (a.average_gpa ?? 0) ||
        (b.average_overall_rating ?? 0) - (a.average_overall_rating ?? 0),
    );
  }
  if (filters.sort === "rating") {
    return [...out].sort(
      (a, b) =>
        (b.average_overall_rating ?? 0) - (a.average_overall_rating ?? 0),
    );
  }
  return out;
}
