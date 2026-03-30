import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchCourseGrades } from "../api/GetCourseGrades";
import ContentLocker from "../components/grade_distribution/course_grade_distribution/ContentLocker";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { Loading } from "../components/Loading";

import {
  CourseInfo,
  ProfessorInfo,
} from "../components/grade_distribution/gradeDistributionTypes";

import { ProfessorCards } from "../components/grade_distribution/course_grade_distribution/ProfessorCards";
import {
  buildChartData,
  makeColorMap,
} from "../components/grade_distribution/gradeDistributionUtils";
import ProfessorAccordion from "../components/grade_distribution/course_grade_distribution/ProfessorAccordion";
import ChartSection from "../components/grade_distribution/ChartSection";

import { ChevronDown, ChevronLeft } from "lucide-react";
import QRCode from "qrcode";

import posthog from "posthog-js";
import { Helmet } from "react-helmet";

const FEATURES = {
  content_locker: false,
};

/* -------------------------------------------------------------------------- */
/*                                QR  helper                                  */
/* -------------------------------------------------------------------------- */
function QRCODE({ visible }: { visible: boolean }) {
  const [qrCode, setQrCode] = useState("");
  const { courseId } = useParams();

  async function generate_qr(text: string) {
    try {
      const a = await QRCode.toDataURL(text);
      setQrCode(a);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    generate_qr(
      "daviscattlelog.com/grade/" + courseId + "?utm_source=grade_qr_code",
    );
  }, []);

  if (!visible) return null;

  return (
    <div className="mt-4 flex flex-col items-start gap-2">
      <img src={qrCode} alt="QR Code" className="w-40 h-40" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Main component                               */
/* -------------------------------------------------------------------------- */

const getColumnCount = () => {
  if (typeof window === "undefined") return 1;
  const w = window.innerWidth;
  if (w >= 1830) return 4; // lg and up
  if (w >= 1400) return 3; // md
  if (w >= 980) return 2; // sm
  return 1; // xs
};

const GradeDistPage: React.FC = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  // Data State
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // column count resizing
  const [columnCount, setColumnCount] = useState(getColumnCount());
  useEffect(() => {
    const onResize = () => setColumnCount(getColumnCount());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // UI Selections
  const [chartType, setChartType] = useState<"line" | "bar">("bar");
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]); // quarter IDs
  const [showQr, setShowQr] = useState(false);
  const [_, setOpenPanels] = useState<Record<string, boolean>>({});

  /* ------------------------------ content locker ------------------------------ */
  const [variant, setVariant] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(() => {
    return localStorage.getItem("grade_dist_unlocked") === "true";
  });

  useEffect(() => {
    posthog.onFeatureFlags(() => {
      const flag = posthog.getFeatureFlag("content-locker");
      console.log("Loaded variant:", flag);
      if (typeof flag === "string") {
        setVariant(flag);
      } else {
        setVariant(null);
      }
    });
  }, []);

  /* ────────────────────────────── analytics ─────────────────────────────── */
  useEffect(() => {
    posthog.capture("grade_dist_view", { courseId });
  }, [courseId]);

  const seriesKeys = selectedSeries.length ? selectedSeries : ["default"];
  const colorMap = useMemo(() => makeColorMap(seriesKeys), [seriesKeys]);

  /* ────────────────────────────── data fetch ────────────────────────────── */
  useEffect(() => {
    async function load() {
      if (!courseId) return;
      try {
        const rawData = await fetchCourseGrades(courseId);
        const processed: CourseInfo = {
          course_title: rawData.course_title || "Unknown",
          grades: rawData.overall_grades || null,
          overall_gpa: rawData.overall_gpa || null,
          professors: (rawData.professors || []).map((p: any) => {
            const totalEntry = p.professor_quarter_data?.Total;
            const profOverallGpa = totalEntry?.quarter_average_gpa ?? null;

            return {
              id: p.professor_name,
              slug: p.professor_slug,
              professor_name: p.professor_name,
              average_gpa: profOverallGpa,
              grades: p.professor_total_grades,
              professor_quarter_data: p.professor_quarter_data
                ? Object.entries(p.professor_quarter_data).map(
                    ([quarterId, data]: [string, any]) => {
                      const [rawQuarter, rawYear] = quarterId.split("_");
                      const quarterFormatted =
                        rawQuarter.toLowerCase() === "total"
                          ? "OVERALL"
                          : `${rawQuarter.toUpperCase()} ${rawYear}`;
                      return {
                        professor_name: p.professor_name,
                        quarter: quarterFormatted,
                        year: "",
                        slug: p.professor_slug,
                        id: `${p.professor_name} ${quarterId.replace(
                          /_/g,
                          " ",
                        )}`,
                        quarter_id: quarterId,
                        grades: data.quarter_grade_distribution,
                        average_gpa: data.quarter_average_gpa,
                      };
                    },
                  )
                : [],
            };
          }),
        } as CourseInfo;
        processed.quarters = processed.professors!.flatMap(
          (p) => p.professor_quarter_data!,
        );
        setCourse(processed);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId]);

  useEffect(() => {
    posthog.capture("page_view", { page: "GradeDistPage" });
  }, []);

  const profList = course?.professors ?? [];

  /* ----------------------------- show more logic --------------------------- */
  const VISIBLE_PROFS = 12; // how many to show before “Show more”
  const [showAllProfs, setShowAllProfs] = useState(false);
  const displayedProfs = showAllProfs
    ? profList
    : profList.slice(0, VISIBLE_PROFS);

  // Split professors into N columns for display
  const columns = useMemo<ProfessorInfo[][]>(() => {
    const cols: ProfessorInfo[][] = Array.from(
      { length: columnCount },
      () => [],
    );
    displayedProfs.forEach((prof, i) => {
      cols[i % columnCount].push(prof);
    });
    return cols;
  }, [displayedProfs, columnCount]);

  const prValue = (() => {
    const c = getColumnCount();
    return c === 4 ? 40 : c === 3 ? 0 : c === 2 ? 40 : 20;
  })();

  /* ------------------------------- early exit ------------------------------ */
  if (loading) return <Loading />;
  if (!course) return <p>Course not found.</p>;

  // detect “no grade distribution” (both overall and per‑professor)
  const noOverall =
    !course.grades || Object.values(course.grades).every((cnt) => cnt === 0);
  const noProfQuarters =
    !course.quarters?.length ||
    course.quarters.every(
      (q) => !q.grades || Object.values(q.grades).every((cnt) => cnt === 0),
    );
  const noData = noOverall && noProfQuarters;

  /* ----------------------------- derived data ----------------------------- */
  const chartData = buildChartData(course.grades, course.quarters ?? []);
  const quartersFiltered = (course.quarters ?? []).filter(
    (q) => selectedSeries.length === 0 || selectedSeries.includes(q.id),
  );

  /* ---------------------------------  UI  --------------------------------- */
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{course.course_title}</title>
        <link
          rel="canonical"
          href={`https://daviscattlelog.com/course/${courseId}`}
        />
      </Helmet>

      <Header />

      <main className="flex-1">
        {FEATURES.content_locker && !unlocked && (
          <ContentLocker
            variant={variant as "email-required" | "email-with-exit"}
            onUnlock={() => {
              posthog.capture("content-locker-unlocked", {
                variant,
                course_id: courseId,
              });
              setUnlocked(true);
            }}
            onDismiss={
              variant === "email-with-exit"
                ? () => {
                    posthog.capture("content-locker-dismissed", {
                      variant,
                      course_id: courseId,
                    });
                    setUnlocked(true);
                  }
                : undefined
            }
          />
        )}

        {noData ? (
          <div className="mt-12 text-center text-gray-600">
            <h2 className="text-2xl font-semibold mb-2">
              No grade distribution found
            </h2>
            <p>This course doesn’t have any grade distribution data yet.</p>
          </div>
        ) : (
          <div
            className="pl-[10px] sm:pl-[20px] md:pl-[46px] pr-[20px] py-[24px]"
            style={{ paddingRight: `${prValue}px` }}
          >
            {/* back + heading */}
            <div className="flex items-center">
              <button
                onClick={() =>
                  window.history.length > 1 ? navigate(-1) : navigate("/")
                }
              >
                <ChevronLeft className="size-10 stroke-1" />
              </button>
              <div className="flex text-[14px] [@media(min-width:800px)]:text-[20px] flex-col sm:flex-row gap-1 ml-2">
                <h1 className="font-bold">Grade Distribution&nbsp;–&nbsp;</h1>
                <div className="flex items-end gap-1">
                  <h1 className="font-bold">
                    {(courseId ?? "Unknown").toUpperCase()}:
                  </h1>
                  <h1>{course.course_title}</h1>
                </div>
              </div>
            </div>

            {/* professor accordions */}
            <div
              className={`
                mt-5 flex flex-wrap gap-6 pl-4 overflow-hidden
                transition-all duration-500 ease-in-out
                ${showAllProfs ? "max-h-[40000px]" : "max-h-[3000px]"}
              `}
            >
              {columns.map((col, i) => (
                <div key={i} className="flex-1 flex flex-col gap-6">
                  {col.map((prof) => (
                    <ProfessorAccordion
                      key={prof.id}
                      professors={[prof]}
                      selectedSeries={selectedSeries}
                      toggleQuarter={(q) =>
                        setSelectedSeries((s) =>
                          s.includes(q) ? s.filter((x) => x !== q) : [...s, q],
                        )
                      }
                      toggleProfessorAll={(id, qs) => {
                        const all = qs.every((q) => selectedSeries.includes(q));
                        setSelectedSeries((s) =>
                          all
                            ? s.filter((x) => !qs.includes(x))
                            : [...s, ...qs],
                        );
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* show more / show less button */}
            {profList.length > VISIBLE_PROFS && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setShowAllProfs((s) => !s)}
                  className="text-[#1A5276] hover:underline flex flex-col items-center mx-auto"
                >
                  {showAllProfs
                    ? "Show less"
                    : `Show ${profList.length - VISIBLE_PROFS} more`}
                  <ChevronDown
                    className={`w-6 h-6 transition-transform duration-300 ${
                      showAllProfs ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>
              </div>
            )}

            {/* chart controls */}
            <div className="mx-4 mt-3 border-t pt-7">
              <button
                onClick={() =>
                  setChartType((p) => (p === "line" ? "bar" : "line"))
                }
                className="px-4 py-2 bg-[#1A5276] text-white rounded-lg text-xs"
              >
                {chartType === "line" ? "Bar" : "Line"} Chart
              </button>
            </div>

            {/* Show when content_locker feature is off, (or when it's one AND it's unlocked) */}
            {!FEATURES.content_locker ||
            (FEATURES.content_locker && unlocked) ? (
              <>
                {/* chart + cards section */}
                <div className="flex flex-col lg:flex-row gap-4 mt-4">
                  {/* chart */}

                  <div className="flex-1 w-full min-h-[300px] md:h-[400px] bg-white">
                    <ChartSection
                      chartData={chartData}
                      chartType={chartType}
                      selectedSeries={selectedSeries}
                      colorMap={colorMap}
                      mode={"course"}
                    />
                    <h3 className="text-[#7B7B7B] ml-12 text-md">
                      <em>
                        Sourced directly from UC Davis — only on
                        DavisCattlelog.com
                      </em>
                    </h3>
                  </div>

                  {/* professor cards */}
                  <div className="[@media(max-width:639px)]:mr-5 mt-5 ml-8 md:ml-5 md:mt-2 flex-1 max-h-[400px] overflow-y-auto flex flex-wrap gap-10 justify-evenly md:justify-start">
                    <ProfessorCards
                      courseOverallGpa={course.overall_gpa}
                      quarters={quartersFiltered}
                      selectedQuarterIds={selectedSeries}
                      professorColorMap={colorMap}
                    />
                  </div>
                </div>
              </>
            ) : (
              <></>
            )}

            {/* QR section */}
            <div className="mt-6 mx-4">
              <button
                onClick={() => setShowQr((p) => !p)}
                className="px-4 py-2 bg-[#1A5276] text-white rounded-lg text-xs"
              >
                {showQr ? "Hide QR" : "Show QR"}
              </button>
              <QRCODE visible={showQr} />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default GradeDistPage;
