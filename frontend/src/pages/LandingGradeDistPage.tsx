import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";

import Header from "../components/Header";
import Footer from "../components/Footer";

import CoursePicker from "../components/grade_distribution/landing_grade_distribution/CoursePicker";
import MultiCourseAccordion from "../components/grade_distribution/landing_grade_distribution/MultiCourseAccordion";
import ViewToggle from "../components/grade_distribution/landing_grade_distribution/ViewToggle";
import { LandingGradeProfessorCards } from "../components/grade_distribution/landing_grade_distribution/LandingGradeProfessorCards";

import ChartSection from "../components/grade_distribution/ChartSection";

import { fetchCourseGrades } from "../api/GetCourseGrades";

import {
  buildChartData,
  SeriesRow,
  makeColorMap,
} from "../components/grade_distribution/gradeDistributionUtils";

import {
  LandingCourseInfo,
  QuarterInfo,
} from "../components/grade_distribution/gradeDistributionTypes";

type LandingQuarterTotal = {
  quarter_grade_distribution: Record<string, number>;
  quarter_average_gpa: number | null;
};
interface QuarterDataHolder {
  professor_quarter_data?: Record<string, LandingQuarterTotal>;
}

function SkeletonCard() {
  return (
    <div className="w-full lg:w-[420px] p-4 rounded-lg bg-white border">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-full bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export default function LandingGradeDistPage() {
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [courseProfSel, setCourseProfSel] = useState<Record<string, string[]>>(
    {},
  );
  const [view, setView] = useState<"distribution" | "trend">("distribution");
  const [searchParams, setSearchParams] = useSearchParams();
  // Random fun easter egg, but this is the average grade distribution of the entire campus thought it was pretty neat
  const CAMPUS_DISTRIBUTION: Record<string, number> = {
    "A+": 363881,
    A: 720817,
    "A-": 330906,
    "B+": 249437,
    B: 283992,
    "B-": 148535,
    "C+": 117308,
    C: 138992,
    "C-": 65542,
    "D+": 26678,
    D: 40350,
    "D-": 13565,
    F: 54411,
  };
  // Campus GPA trend data, this is the average GPA per quarter
  const CAMPUS_GPA_TREND: Record<string, number> = {
    F2022: 3.31,
    W2023: 3.26,
    S2023: 3.27,
    SU2023: 3.72,
    F2023: 3.26,
    W2024: 3.29,
    S2024: 3.31,
    SU2024: 3.73,
    F2024: 3.27,
    W2025: 3.28,
    S2025: 3.28,
  };
  // Season order for sorting GPA trends
  const SEASON_ORDER: Record<string, number> = { W: 1, S: 2, SU: 3, F: 4 };
  const CAMPUS_GPA = 3.28;

  const toCSV = (arr: string[]) => arr.join(",");

  // Convert campus GPA trend to rows for the chart
  function campusTrendToRows(map: Record<string, number>) {
    const rx = /^(F|W|S|SU)(\d{4})$/;
    const entries = Object.entries(map).filter(
      ([k, v]) => rx.test(k) && Number.isFinite(v),
    );
    const sorted = entries
      .sort(([a], [b]) => {
        const ma = a.match(rx)!;
        const mb = b.match(rx)!;
        const ya = Number(ma[2]);
        const yb = Number(mb[2]);
        if (ya !== yb) return ya - yb;
        return SEASON_ORDER[ma[1]] - SEASON_ORDER[mb[1]];
      })
      .map(([k, gpa]) => ({ name: k, default: gpa }));
    return sorted;
  }

  // Fetch course data for each selected course
  const courseQueries = useQueries({
    queries: selectedCourses.map((cid) => ({
      queryKey: ["landingCourse", cid],
      queryFn: () => fetchCourseGrades(cid),
      staleTime: 60_000,
    })),
  });

  useEffect(() => {
    const qpCourses = searchParams.get("courses");
    if (qpCourses) {
      const list = qpCourses.split(",").filter(Boolean);
      if (list.length) setSelectedCourses(list);
    }
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (selectedCourses.length) params.set("courses", toCSV(selectedCourses));

    const next = params.toString();
    const current = searchParams.toString();
    if (next !== current) setSearchParams(params, { replace: true });
  }, [selectedCourses, searchParams, setSearchParams]);

  // Collect all course data into a single object
  const coursesData = useMemo<Record<string, LandingCourseInfo>>(() => {
    const m: Record<string, LandingCourseInfo> = {};
    courseQueries.forEach((q, i) => {
      if (q.data) {
        const profs = q.data.professors.map((p: { professor_slug: any }) => ({
          ...p,
          slug: p.professor_slug,
        }));
        m[selectedCourses[i]] = { ...q.data, professors: profs };
      }
    });
    return m;
  }, [courseQueries, selectedCourses]);

  // Handle selection changes for professors
  const onSelectChange = useCallback(
    (cid: string) => (ids: string[]) =>
      setCourseProfSel((prev) => ({ ...prev, [cid]: ids })),
    [],
  );

  // Collect all selected professors' overall data
  function collectProfessorOveralls(
    courses: Record<string, LandingCourseInfo>,
    courseProfSel: Record<string, string[]>,
  ): QuarterInfo[] {
    return Object.entries(courses).flatMap(([courseId, course]) => {
      const selected = new Set(courseProfSel[courseId] ?? []);

      return course.professors
        .filter((prof) => {
          const id = `${courseId}-${prof.slug}`;
          return selected.has(id);
        })
        .map<QuarterInfo | null>((prof) => {
          const raw = (prof as unknown as QuarterDataHolder)
            .professor_quarter_data;
          const total = raw && !Array.isArray(raw) ? raw["Total"] : undefined;
          if (!total) return null;
          const hist = total.quarter_grade_distribution;
          if (Object.values(hist).every((n) => n === 0)) return null;

          return {
            courseId,
            id: `${courseId}-${prof.slug}`,
            quarter_id: "Total",
            quarter: "OVERALL",
            year: "",
            grades: hist,
            average_gpa: total.quarter_average_gpa,
            professor_name: prof.professor_name,
            slug: prof.slug,
          };
        })
        .filter((q): q is QuarterInfo => q !== null);
    });
  }

  // Collect all selected professors' overall data
  const allProfessorOveralls = useMemo(
    () => collectProfessorOveralls(coursesData, courseProfSel),
    [coursesData, courseProfSel],
  );

  // Get all selected professor IDs
  const selectedProfessorIds = useMemo(
    () =>
      allProfessorOveralls.length === 0
        ? []
        : allProfessorOveralls.map((r) => r.id),
    [allProfessorOveralls],
  );

  // GPA trend quarter by quarter data
  const trendData = useMemo(() => {
    if (selectedProfessorIds.length === 0) {
      return campusTrendToRows(CAMPUS_GPA_TREND);
    }

    type TrendRow = { name: string; [seriesId: string]: number | string };
    const rows: Record<string, TrendRow> = {};
    const qOrder: Record<string, number> = {
      winter: 1,
      spring: 2,
      summer: 3,
      fall: 4,
    };

    Object.entries(coursesData).forEach(([courseId, course]) => {
      const picked = new Set(courseProfSel[courseId] ?? []);
      course.professors.forEach((p) => {
        const id = `${courseId}-${p.slug}`;
        if (!picked.has(id)) return;

        const quarterData = (p as unknown as QuarterDataHolder)
          .professor_quarter_data;
        if (!quarterData || Array.isArray(quarterData)) return;
        Object.entries(quarterData).forEach(([qk, qv]) => {
          if (qk === "Total") return;
          const [seasonRaw, yearRaw] = qk.split("_");
          const season = (seasonRaw || "").toLowerCase();
          const year = yearRaw || "";
          const ord = qOrder[season];
          const gpa = Number(qv?.quarter_average_gpa);
          if (!year || !ord || !Number.isFinite(gpa)) return;

          const key = `${year}-${String(ord).padStart(2, "0")}`;
          const name =
            season === "summer"
              ? `SU${year}`
              : season === "winter"
                ? `W${year}`
                : season === "spring"
                  ? `S${year}`
                  : `F${year}`;

          if (!rows[key]) rows[key] = { name };
          rows[key][id] = gpa;
        });
      });
    });

    const sorted = Object.entries(rows)
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([, r]) => r);
    return sorted;
  }, [selectedProfessorIds, coursesData, courseProfSel]);

  // Compute average GPA for each professor
  const avgMap = useMemo<Record<string, number>>(() => {
    const profPairs = allProfessorOveralls
      .filter((r) => typeof r.average_gpa === "number")
      .map((r) => [r.id, r.average_gpa as number] as const);

    const maybeDefault =
      selectedProfessorIds.length === 0
        ? [["default", CAMPUS_GPA] as const]
        : [];

    return Object.fromEntries([...profPairs, ...maybeDefault]);
  }, [allProfessorOveralls, selectedProfessorIds]);

  // If no professors selected, use campus-wide distribution (easter egg!!)
  const aggregatedGrades = useMemo<Record<string, number>>(() => {
    if (allProfessorOveralls.length === 0) {
      return CAMPUS_DISTRIBUTION;
    }
    const agg: Record<string, number> = {};
    allProfessorOveralls.forEach((row) =>
      Object.entries(row.grades).forEach(
        ([grade, cnt]) => (agg[grade] = (agg[grade] || 0) + cnt),
      ),
    );
    return agg;
  }, [allProfessorOveralls]);

  // Build chart data based on the selected view
  const chartData = useMemo(
    () =>
      view === "trend"
        ? trendData
        : buildChartData(aggregatedGrades, allProfessorOveralls as SeriesRow[]),
    [view, trendData, aggregatedGrades, allProfessorOveralls],
  );

  // Series name map for tooltips
  const seriesNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    const manySeries = selectedProfessorIds.length > 8;
    Object.entries(coursesData).forEach(([courseId, course]) => {
      course.professors.forEach((p) => {
        const id = `${courseId}-${p.slug}`;
        const parts = p.professor_name.trim().split(/\s+/);
        const last = parts.pop() ?? "";
        const first = parts.shift() ?? "";
        const initial = first ? `${first[0]}.` : "";
        // Simplify legend labels when many series are shown
        m[id] = manySeries
          ? `${courseId.toUpperCase()} – ${last}`
          : `${courseId.toUpperCase()} – ${last}, ${initial}`;
      });
    });
    m["default"] = "UC Davis Average";
    return m;
  }, [coursesData, selectedProfessorIds.length]);

  const colorMap = useMemo(
    () =>
      selectedProfessorIds.length === 0
        ? makeColorMap(["default"])
        : makeColorMap(selectedProfessorIds),
    [selectedProfessorIds],
  );

  const chartSeries = useMemo(() => {
    if (view === "trend" && selectedProfessorIds.length === 0) {
      return ["default"];
    }
    return selectedProfessorIds;
  }, [view, selectedProfessorIds]);

  // Overall GPA for the course, if no professors selected, use campus GPA
  const courseOverallGpa =
    allProfessorOveralls.length === 0 ? CAMPUS_GPA : null;

  return (
    <>
      <Header />
      <div className="text-center pt-6 md:pt-8 px-4">
        <h1 className="text-2xl md:text-3xl font-bold">
          UC Davis Grade Distribution
        </h1>
        <p className="mt-2 text-gray-600">
          Explore grade distributions between individual courses & professors.
        </p>
      </div>

      <div className="max-w-3xl mx-auto p-4 md:px-10">
        <CoursePicker
          onSelect={(cid) =>
            setSelectedCourses((prev) =>
              prev.includes(cid) ? prev : [...prev, cid],
            )
          }
        />
      </div>
      <div className="min-h-[85px]">
        {selectedCourses.length === 0 && (
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center text-gray-600 bg-white">
              <p className="font-medium">Search a course to get started</p>
              <p className="text-sm">Try "ECS 032A" or "MAT 021A".</p>
            </div>
          </div>
        )}

        <div className="px-4 md:px-8 lg:px-12 flex flex-wrap gap-x-6 gap-y-5">
          {selectedCourses.map((cid) => {
            const course = coursesData[cid];
            if (!course) return <SkeletonCard key={cid} />;
            return (
              <MultiCourseAccordion
                key={cid}
                courseId={cid}
                course={course}
                onRemove={() =>
                  setSelectedCourses((prev) => prev.filter((c) => c !== cid))
                }
                onSelectChange={onSelectChange(cid)}
              />
            );
          })}
        </div>
      </div>
      {/* Distribution/GPA Trend Toggle */}
      <div className="pt-6 md:pt-8">
        <ViewToggle view={view} setView={setView} />
      </div>
      <section className="px-4 md:px-8 lg:px-12 pb-8 md:pb-10">
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          <div className="flex-1 bg-white rounded-xl lg:mr-4">
            <ChartSection
              chartData={chartData}
              chartType={view === "trend" ? "line" : "bar"}
              selectedSeries={chartSeries}
              colorMap={colorMap}
              mode={view === "trend" ? "trend" : "landing"}
              seriesNameMap={seriesNameMap}
              avgMap={avgMap}
            />
          </div>
          <div className="flex-1 max-h-[420px] overflow-y-auto bg-white rounded-xl p-3 md:p-4">
            <div className="flex flex-wrap gap-4 md:gap-6">
              <LandingGradeProfessorCards
                courseId={selectedCourses.join(", ")}
                courseOverallGpa={courseOverallGpa}
                quarters={allProfessorOveralls}
                selectedQuarterIds={selectedProfessorIds}
                professorColorMap={colorMap}
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
