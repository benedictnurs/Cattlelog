import "./../App.css";
import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useSearchParams, useNavigate } from "react-router-dom";
import posthog from "posthog-js";

import Header from "../components/Header";

import Courses from "../components/home/CourseList";
import SelectedCourse from "../components/home/SelectedCourse";
import Filter from "../components/home/Filter";

import {
  applyFilters,
  applyPostFiltersAndSort,
} from "../components/home/lib/courseFilters";

import SkeletonCoursesList from "../components/home/ui/Skeletons";

import HomeHelmet from "../components/home/utils/HomeHelmet";
import { useSelectedCourseFromParams } from "../components/home/utils/useSelectedCourse";
import MobileExpandingModal from "../components/home/utils/MobileModal";
import { useIsDesktop } from "../components/home/utils/useIsDesktop";
import FaqJsonLd from "../components/home/utils/FaqJsonLd";
import { FAQ_ITEMS } from "../components/home/utils/FaqContent";

import { searchCourses } from "../api/GetSearch";
import { fetchAllCourses } from "../api/GetAllCourses";

import { Course } from "./../components/types/Course";
import OldSearch from "../pages/OldSearch";

type Sort = "none" | "rating" | "gpa";

type Filters = {
  prefixes: string[];
  level: "" | "lower division" | "upper division" | "grad";
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

interface SelectOption {
  value: string;
  label: string;
}

const ROW_H = 140;
const ROW_GAP = 5;
const HEADER_OFFSET = 70;
const CACHE_EXPIRY_TIME = 30 * 60 * 1000;
const FEATURES = { show_landing_page: false };

function Home() {
  const { data, isFetching, isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: fetchAllCourses,
    staleTime: CACHE_EXPIRY_TIME,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const courses = useMemo(() => data || [], [data]);

  const isDesktop = useIsDesktop();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const filtersRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const activeSearchId = useRef(0);

  const [filters, setFilters] = useState<Filters>(() => {
    const sortParam = searchParams.get("sort");
    const sort: Sort =
      sortParam === "gpa" ? "gpa" : sortParam === "highest" ? "rating" : "none";
    return {
      prefixes: searchParams.get("prefixes")?.split(",") || [],
      level: (searchParams.get("level") as Filters["level"]) || "",
      GEs: searchParams.get("ges")?.split(",") || [],
      units: searchParams.get("units")
        ? Number(searchParams.get("units"))
        : null,
      courseNumber: searchParams.get("num") || "",
      search: searchParams.get("search") || "",
      sort,
      offeredOnly: searchParams.get("offered") === "true",
      noPrereqsOnly: searchParams.get("nopreq") === "true",
      // initialize ranges from URL if provided (format: "min-max")
      averageRatingRange: (() => {
        const s = searchParams.get("ratingRange");
        if (!s) return null;
        const [a, b] = s.split("-").map(Number);
        return Number.isFinite(a) && Number.isFinite(b)
          ? ([a, b] as [number, number])
          : null;
      })(),
      averageGpaRange: (() => {
        const s = searchParams.get("gpaRange");
        if (!s) return null;
        const [a, b] = s.split("-").map(Number);
        return Number.isFinite(a) && Number.isFinite(b)
          ? ([a, b] as [number, number])
          : null;
      })(),
    };
  });
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selected, setSelected] = useSelectedCourseFromParams(courses);
  const [isSearching, setIsSearching] = useState(false);
  const [lastSettledQuery, setLastSettledQuery] = useState("");
  const [filtersH, setFiltersH] = useState(0);
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [viewportH, setViewportH] = useState(0);
  const [vh, setVh] = useState(0);
  const minPaneH = Math.max(filtersH, vh - HEADER_OFFSET, 0);
  const trimmedQuery = filters.search.trim();

  // Memoize course map for quick lookups
  const courseMap = useMemo(() => {
    const m = new Map<string, Course>();
    courses.forEach((c: Course) => m.set(c.course_id, c));
    return m;
  }, [courses]);

  // Memoize selected prefixes for performance
  const selectedPrefixOptions = useMemo(
    () => filters.prefixes.map((p) => ({ value: p, label: p })),
    [filters.prefixes],
  );

  // Calculate the number of skeletons to show based on viewport height
  const skeletonCount = useMemo(() => {
    const h = viewportH || minPaneH || 800;
    return Math.max(3, Math.floor((h + ROW_GAP) / (ROW_H + ROW_GAP)));
  }, [viewportH, minPaneH]);

  // Resize observer to adjust the height of the left filters pane
  useLayoutEffect(() => {
    if (!filtersRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setFiltersH(entry?.contentRect?.height ?? 0);
    });
    ro.observe(filtersRef.current);
    return () => ro.disconnect();
  }, []);

  // Resize observer to adjust the middle viewport height
  useLayoutEffect(() => {
    const ro = new ResizeObserver(([entry]) => {
      setViewportH(entry?.contentRect?.height ?? 0);
    });
    const el = viewportRef.current;
    if (el) ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const oldSearch = searchParams.get("oldSearch");
  if (oldSearch === "true") {
    return <OldSearch />;
  }

  // tracks and responds to viewport height changes on mobile
  useLayoutEffect(() => {
    const read = () =>
      setVh(window.visualViewport?.height ?? window.innerHeight);
    read();
    window.visualViewport?.addEventListener("resize", read);
    window.addEventListener("resize", read);
    window.addEventListener("orientationchange", read);
    return () => {
      window.visualViewport?.removeEventListener("resize", read);
      window.removeEventListener("resize", read);
      window.removeEventListener("orientationchange", read);
    };
  }, []);

  // Update url params based on filters
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();

      if (filters.prefixes.length)
        params.set("prefixes", filters.prefixes.join(","));
      if (filters.level) params.set("level", filters.level);
      if (filters.GEs.length) params.set("ges", filters.GEs.join(","));
      if (filters.units !== null) params.set("units", String(filters.units));
      if (filters.courseNumber && filters.courseNumber.trim())
        params.set("num", filters.courseNumber.trim());
      if (filters.search.trim()) params.set("search", filters.search.trim());
      if (filters.sort === "gpa") params.set("sort", "gpa");
      if (filters.sort === "rating") params.set("sort", "highest");
      if (filters.offeredOnly) params.set("offered", "true");
      if (filters.noPrereqsOnly) params.set("nopreq", "true");
      if (
        filters.averageRatingRange &&
        filters.averageRatingRange.length === 2
      ) {
        params.set(
          "ratingRange",
          `${filters.averageRatingRange[0]}-${filters.averageRatingRange[1]}`,
        );
      }
      if (filters.averageGpaRange && filters.averageGpaRange.length === 2) {
        params.set(
          "gpaRange",
          `${filters.averageGpaRange[0]}-${filters.averageGpaRange[1]}`,
        );
      }

      setSearchParams(params, { replace: true });
    }, 300);

    return () => clearTimeout(t);
  }, [filters, setSearchParams]);

  // searches for courses based on the search term
  // handles excessive API calls w/ debouncing
  // ensures that only the latest search is considered
  useEffect(() => {
    const trimmed = filters.search.trim();
    if (!trimmed) {
      setIsSearching(false);
      setLastSettledQuery("");
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const myId = ++activeSearchId.current;

    const t = setTimeout(async () => {
      try {
        const sanitized = trimmed
          .replace(/\s+/g, "")
          .replace(/(^|\D)0+(\d)/g, "$1$2");
        posthog.capture("search_query", { search: trimmed, sanitized });
        const idsWithScore: { course_id: string; score: number | null }[] =
          await searchCourses(sanitized);

        if (myId !== activeSearchId.current) return;

        const matched = idsWithScore
          .map((i) => courseMap.get(i.course_id))
          .filter(Boolean) as Course[];

        setSearchResults(matched);
        setLastSettledQuery(trimmed);
      } catch {
        if (myId !== activeSearchId.current) return;
        setSearchResults([]);
      } finally {
        if (myId === activeSearchId.current) setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [filters.search, courseMap]);

  // filter courses based on selected criteria
  const filteredCourses = useMemo(
    () => applyFilters(courses, filters, searchResults),
    [courses, filters, searchResults],
  );

  // apply sorting filters
  const sortedCourses = useMemo(
    () => applyPostFiltersAndSort(filteredCourses, filters),
    [filteredCourses, filters],
  );

  // Virtualizer for rendering courses efficiently
  // This allows us to render only the visible courses in the list
  // VERY important for performance
  const rowVirtualizer = useVirtualizer({
    count: sortedCourses.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_H,
    overscan: 12,
    getItemKey: (index) => sortedCourses[index]?.course_id ?? index,
  });

  // Handle course click to select and navigate
  const handleClick = (course: Course) => {
    setSelected(course);
    posthog.capture("course_selected", { course_id: course.course_id });
    navigate(`/course/${course.course_id}${window.location.search}`);
  };

  // below are functions that handle filter changes
  const handleSearchChange = useCallback((term: string) => {
    setFilters((f) => ({ ...f, search: term }));
  }, []);

  const handleSelectedUnitsChange = useCallback((u: number | null) => {
    setFilters((f) => ({ ...f, units: u }));
  }, []);

  const handleCourseNumberChange = useCallback((num: string | null) => {
    setFilters((f) => ({ ...f, courseNumber: num || "" }));
  }, []);

  const handleCoursePrefixChange = useCallback(
    (options: SelectOption[] | null) => {
      setFilters((f) => ({
        ...f,
        prefixes: options ? options.map((o) => o.value) : [],
      }));
    },
    [],
  );

  const handleCourseLevelChange = useCallback((level: Filters["level"]) => {
    setFilters((f) => ({ ...f, level }));
  }, []);

  const handleGEUnitsChange = useCallback((selectedGE: string[]) => {
    setFilters((f) => ({ ...f, GEs: selectedGE }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters((f) => ({
      ...f,
      GEs: [],
      units: null,
      level: "",
      prefixes: [],
      courseNumber: "",
      offeredOnly: false,
      noPrereqsOnly: false,
      sort: "none",
      averageRatingRange: null,
      averageGpaRange: null,
    }));
    setSelected(null);
    navigate(`/home`);
    posthog.capture("filters_cleared");
  }, []);

  // Determine if we should show skeletons or empty states
  const isSettled = !isSearching && lastSettledQuery === trimmedQuery;
  const showInitialSkeleton = isLoading || (isFetching && courses.length === 0);
  const showSearchSkeleton =
    isSearching && trimmedQuery && lastSettledQuery !== trimmedQuery;
  const showEmptySearch =
    !showInitialSkeleton &&
    trimmedQuery.length > 0 &&
    isSettled &&
    sortedCourses.length === 0;
  const showEmptyNoSearch =
    !showSearchSkeleton &&
    trimmedQuery.length === 0 &&
    filteredCourses.length === 0;

  return (
    <>
      {/* SEO structured data */}
      <HomeHelmet showLanding={FEATURES.show_landing_page} />
      <FaqJsonLd items={FAQ_ITEMS} />
      <Header
        showSearch
        searchTerm={filters.search}
        onSearchTermChange={handleSearchChange}
        onClearFilters={handleClearFilters}
      />
      <MobileExpandingModal selected={selected} setSelected={setSelected} />

      {/* Main content area grid */}
      <div className="lg:grid w-full h-full grid-cols-9">
        {/* Left Column: Filters */}
        <div ref={filtersRef} className="hidden lg:block col-span-2">
          <div className="h-full">
            <Filter
              isMobileFilter={isMobileFilterOpen}
              selectedGEs={filters.GEs}
              selectedUnits={filters.units}
              selectedCourseLevel={filters.level}
              selectedCourseNumber={filters.courseNumber || ""}
              selectedCoursePrefixOption={selectedPrefixOptions}
              searchTerm={filters.search}
              sort={filters.sort}
              onChangeSort={(s) => {
                setFilters((f) => ({ ...f, sort: s }));
              }}
              offeredOnly={filters.offeredOnly}
              onChangeOffered={(v) =>
                setFilters((f) => ({ ...f, offeredOnly: v }))
              }
              noPrereqsOnly={filters.noPrereqsOnly}
              onChangeNoPrereqs={(v) =>
                setFilters((f) => ({ ...f, noPrereqsOnly: v }))
              }
              onSearchTermChange={handleSearchChange}
              onGEUnitsChange={handleGEUnitsChange}
              onSelectedUnitsChange={handleSelectedUnitsChange}
              onCourseLevelChange={handleCourseLevelChange}
              onCourseNumberChange={handleCourseNumberChange}
              onCoursePrefixChange={handleCoursePrefixChange}
              onClearFilters={handleClearFilters}
              // wire ranges (desktop)
              averageRatingRange={filters.averageRatingRange ?? null}
              onChangeAverageRatingRange={(range) =>
                setFilters((f) => ({ ...f, averageRatingRange: range }))
              }
              averageGpaRange={filters.averageGpaRange ?? null}
              onChangeAverageGpaRange={(range) =>
                setFilters((f) => ({ ...f, averageGpaRange: range }))
              }
            />
          </div>
        </div>
        {/* Middle Column: List of courses */}
        <div className="col-span-2 sm:w-full flex">
          <div
            className="w-full bg-[#FFFFFF] flex flex-col overflow-hidden"
            style={{ minHeight: minPaneH }}
          >
            <div className="flex justify-between items-center m-4 mx-5 sm:mx-5 sm:my-4">
              <h2 className="font-bold text-[24px]">Courses</h2>

              {/* Mobile filter button */}
              <button
                onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                className="block lg:hidden relative w-[20px] h-[20px] transition-transform duration-200 ease-in-out hover:scale-110"
              >
                {/* Search icon */}
                <img
                  src="/magnifying-glass-solid 1.svg"
                  alt="Filter"
                  className={`absolute inset-0 w-[20px] h-[20px] transition-all duration-300 ease-in-out ${
                    isMobileFilterOpen
                      ? "opacity-0 rotate-90 scale-0"
                      : "opacity-100 rotate-0 scale-100"
                  }`}
                />
                {/* X icon */}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`absolute inset-0 w-[20px] h-[20px] transition-all duration-300 ease-in-out ${
                    isMobileFilterOpen
                      ? "opacity-100 rotate-0 scale-100"
                      : "opacity-0 rotate-90 scale-0"
                  }`}
                >
                  <path
                    d="M18 6L6 18M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* Filter displays below courses ONLY on mobile */}
            <div className="block lg:hidden">
              <Filter
                isMobileFilter={isMobileFilterOpen}
                selectedGEs={filters.GEs}
                selectedUnits={filters.units}
                selectedCourseLevel={filters.level}
                selectedCourseNumber={filters.courseNumber || ""}
                selectedCoursePrefixOption={selectedPrefixOptions}
                searchTerm={filters.search}
                sort={filters.sort}
                onChangeSort={(s) => {
                  setFilters((f) => ({ ...f, sort: s }));
                }}
                offeredOnly={filters.offeredOnly}
                onChangeOffered={(v) =>
                  setFilters((f) => ({ ...f, offeredOnly: v }))
                }
                noPrereqsOnly={filters.noPrereqsOnly}
                onChangeNoPrereqs={(v) =>
                  setFilters((f) => ({ ...f, noPrereqsOnly: v }))
                }
                onSearchTermChange={handleSearchChange}
                onGEUnitsChange={handleGEUnitsChange}
                onSelectedUnitsChange={handleSelectedUnitsChange}
                onCourseLevelChange={handleCourseLevelChange}
                onCourseNumberChange={handleCourseNumberChange}
                onCoursePrefixChange={handleCoursePrefixChange}
                onClearFilters={handleClearFilters}
                onRequestClose={() => setIsMobileFilterOpen(false)}
                // wire ranges (mobile)
                averageRatingRange={filters.averageRatingRange ?? null}
                onChangeAverageRatingRange={(range) =>
                  setFilters((f) => ({ ...f, averageRatingRange: range }))
                }
                averageGpaRange={filters.averageGpaRange ?? null}
                onChangeAverageGpaRange={(range) =>
                  setFilters((f) => ({ ...f, averageGpaRange: range }))
                }
              />
            </div>

            <div ref={viewportRef} className="relative flex-1">
              {showInitialSkeleton || showSearchSkeleton ? (
                <SkeletonCoursesList count={skeletonCount} estimate={145} />
              ) : showEmptySearch ? (
                <p className="text-center text-gray-500 mt-4">
                  No results found.
                </p>
              ) : showEmptyNoSearch ? (
                <p className="text-center text-gray-500 mt-4">
                  No courses available
                </p>
              ) : (
                <>
                  {/* Scrollable container for courses */}
                  <div
                    ref={parentRef}
                    className="absolute inset-0 overflow-y-auto"
                  >
                    <div
                      style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        position: "relative",
                      }}
                    >
                      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const course = sortedCourses[virtualRow.index];
                        const displayRating =
                          course.average_overall_rating &&
                          course.average_overall_rating > 0
                            ? course.average_overall_rating
                            : null;

                        return (
                          <div
                            key={virtualRow.key}
                            data-index={virtualRow.index}
                            ref={rowVirtualizer.measureElement}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              transform: `translateY(${virtualRow.start}px)`,
                            }}
                          >
                            <Courses
                              code={course.course_id}
                              title={course.course_title}
                              ge={course.fulfillment_tags}
                              units={course.units}
                              rating={displayRating}
                              isSelected={
                                selected?.course_id === course.course_id
                              }
                              onClick={() => handleClick(course)}
                              overall_gpa={course.average_gpa}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Selected course details */}
        <div className="hidden lg:flex col-span-5 min-h-0">
          <div className="relative flex-1 min-h-0">
            <div className="absolute inset-0 overflow-y-auto">
              <SelectedCourse selected={selected} />
            </div>
          </div>
        </div>
      </div>
      {isDesktop}
    </>
  );
}

export default Home;
