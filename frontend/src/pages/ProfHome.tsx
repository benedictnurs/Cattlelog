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
import { useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import {
  parseRating,
  displayRating as displayRatingUtil,
  ratingBgColor,
} from "../utils/rating";
import Footer from "../components/Footer";
import posthog from "posthog-js";
import { searchProfessors as searchProfessorsApi } from "../api/GetSearch";
import { fetchProfessor as fetchProfessorApi } from "../api/GetProfessor";

const FEATURES = {
  beta_mode: true,
};

// Types
interface Professor {
  professor_id: string;
  professor_slug: string;
  professor_name: string;
  department?: string;
  average_rating?: number;
  num_ratings?: number;
  courses_taught?: string[];
}

interface DetailedProfessor {
  professor_name: string;
  department: string;
  id: string;
  slug: string;
  overall_rating: number;
  level_of_difficulty: number;
  classes: {
    course_id: string;
    course_title: string;
    reviews: {
      quality_rating: number;
      difficulty_rating: number;
      tags: string[];
      review: string;
      grade: string;
      date: string;
      unique_review: boolean;
    }[];
  }[];
}

type Sort = "none" | "rating" | "alphabetical";

interface Filters {
  departments: string[];
  search: string;
  sort: Sort;
  highRatingOnly: boolean;
}

// API Functions (use shared helpers)
const searchProfessors = async (searchTerm: string) =>
  await searchProfessorsApi(searchTerm);

const fetchProfessorDetails = async (
  professorSlug: string,
): Promise<DetailedProfessor> => await fetchProfessorApi(professorSlug);

const fetchAllProfessors = async (): Promise<Professor[]> => {
  // Since there's no endpoint for all professors, we'll start with an empty array
  // In a real app, you might want to fetch from a different endpoint or cache search results
  return [];
};

// Filter Functions
const applyFilters = (
  professors: Professor[],
  filters: Filters,
  searchResults: Professor[],
): Professor[] => {
  let filtered = filters.search.trim() ? searchResults : professors;

  if (filters.departments.length > 0) {
    filtered = filtered.filter((p) =>
      filters.departments.includes(p.department || ""),
    );
  }

  if (filters.highRatingOnly) {
    filtered = filtered.filter(
      (p) => p.average_rating && p.average_rating >= 4.0,
    );
  }

  return filtered;
};

const applyPostFiltersAndSort = (
  professors: Professor[],
  filters: Filters,
): Professor[] => {
  let sorted = [...professors];

  switch (filters.sort) {
    case "rating":
      sorted.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
      break;
    case "alphabetical":
      sorted.sort((a, b) => a.professor_name.localeCompare(b.professor_name));
      break;
    default:
      break;
  }

  return sorted;
};

// Utility Hooks
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isDesktop;
};

// Updated hook to manage selected professor state
const useSelectedProfessor = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(
    null,
  );

  // Initialize from URL params
  useEffect(() => {
    const professorSlug = searchParams.get("professor");
    if (
      professorSlug &&
      (!selectedProfessor || selectedProfessor.professor_slug !== professorSlug)
    ) {
      // If we have a professor slug in URL but no selected professor or different professor
      // We'll need to find/load this professor - for now just clear if we can't find it
      if (
        !selectedProfessor ||
        selectedProfessor.professor_slug !== professorSlug
      ) {
        setSelectedProfessor(null);
      }
    } else if (!professorSlug && selectedProfessor) {
      // If no professor in URL but we have one selected, clear it
      setSelectedProfessor(null);
    }
  }, [searchParams, selectedProfessor]);

  const setSelected = useCallback(
    (professor: Professor | null) => {
      setSelectedProfessor(professor);

      // Update URL params
      const newSearchParams = new URLSearchParams(searchParams);
      if (professor) {
        newSearchParams.set("professor", professor.professor_slug);
      } else {
        newSearchParams.delete("professor");
      }
      setSearchParams(newSearchParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  return [selectedProfessor, setSelected] as const;
};

// Individual Professor Component
const ProfessorItem: React.FC<{
  name: string;
  department?: string;
  rating?: number | null;
  numRatings?: number;
  isSelected: boolean;
  onClick: () => void;
}> = ({ name, department, rating, numRatings, isSelected, onClick }) => {
  const ratingNum = parseRating(rating);
  const displayRating = displayRatingUtil(ratingNum, 1);
  const hasRatings = !!(numRatings && numRatings > 0 && ratingNum != null);
  const badgeClass = ratingBgColor(ratingNum);

  return (
    <div
      onClick={onClick}
      className={`
        cursor-pointer p-4 mx-2 mb-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-150
        ${isSelected ? "bg-blue-50 border-blue-300 shadow-sm" : "bg-white"}
      `}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-lg truncate mb-1">
            {name}
          </h3>

          {department && (
            <p className="text-sm text-gray-600 mb-2">{department}</p>
          )}

          <div className="flex items-center space-x-3">
            {hasRatings ? (
              <div className="flex items-center space-x-1">
                <div className="flex items-center">
                  <span className="text-yellow-500 text-sm">★</span>
                  <span className="text-sm font-medium text-gray-700 ml-1">
                    {displayRating}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  ({numRatings} rating{numRatings !== 1 ? "s" : ""})
                </span>
              </div>
            ) : (
              <span className="text-sm text-gray-500">No ratings yet</span>
            )}
          </div>
        </div>

        {hasRatings && (
          <div className="flex-shrink-0 ml-4">
            <div
              className={`${badgeClass} text-white text-xs font-medium px-2.5 py-1 rounded-full`}
            >
              {displayRating}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Skeleton Loading Component
const SkeletonProfessor: React.FC = () => (
  <div className="p-4 mx-2 mb-2 border border-gray-200 rounded-lg bg-white">
    <div className="animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
    </div>
  </div>
);

// Filter Component
const FilterPanel: React.FC<{
  searchTerm: string;
  sort: Sort;
  highRatingOnly: boolean;
  onSearchTermChange: (term: string) => void;
  onChangeSort: (sort: Sort) => void;
  onChangeHighRating: (value: boolean) => void;
  onClearFilters: () => void;
  isOpen?: boolean;
  onRequestClose?: () => void;
}> = ({
  searchTerm,
  sort,
  highRatingOnly,
  onSearchTermChange,
  onChangeSort,
  onChangeHighRating,
  onClearFilters,
  isOpen = true,
  onRequestClose,
}) => {
  if (!isOpen) return null;

  const handleFeedbackClick = () => {
    posthog.capture("feedback_link_clicked");
  };

  return (
    <div className="p-4 bg-white border-b lg:border-b-0 lg:border-r border-gray-200">
      <div className="space-y-4">
        {/* Search */}
        <div>
          {FEATURES.beta_mode ? (
            <p className="font-bold text-3xl pb-4">Demo Mode - (Beta)</p>
          ) : (
            <></>
          )}

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Professors
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder="Enter professor name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Sort */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={sort}
            onChange={(e) => onChangeSort(e.target.value as Sort)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="none">Default</option>
            <option value="rating">Highest Rated</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>

        {/* High Rating Filter */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={highRatingOnly}
              onChange={(e) => onChangeHighRating(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">
              High rated only (4.0+)
            </span>
          </label>
        </div>

        {/* Clear Filters */}
        <button
          onClick={onClearFilters}
          className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Clear Filters
        </button>

        {FEATURES.beta_mode ? (
          <>
            <p className="text-xl py-2">
              Hey! Either you happened to find this page or someone sent it to
              you. Welcome! Since this isn't formally launched yet, we'd love
              some{" "}
              <a
                href="https://airtable.com/appqLRpTDmd1BrR3s/shrHJaUItHhO3Ee27"
                className="text-blue-800 underline"
                onClick={handleFeedbackClick}
              >
                feedback
              </a>
              !
            </p>
            <p className="text-xl pb-4">
              This page hasn't fully met our standard for design or engineering,
              but we want you to have the functionality so we can get feedback
              to build the best Cattlelog we can.
            </p>

            <p className="text-xl pb-4">- Cory & Cattlelog team</p>
          </>
        ) : (
          <></>
        )}

        {/* Close button for mobile */}
        {onRequestClose && (
          <button
            onClick={() => {
              posthog.capture("mobile_filters_closed");
              onRequestClose();
            }}
            className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 lg:hidden"
          >
            Apply Filters
          </button>
        )}
      </div>
    </div>
  );
};

// Enhanced Selected Professor Detail Panel
const SelectedProfessorPanel: React.FC<{
  selected: Professor | null;
}> = ({ selected }) => {
  const {
    data: professorDetails,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["professor-details", selected?.professor_slug],
    queryFn: () => fetchProfessorDetails(selected!.professor_slug),
    enabled: !!selected?.professor_slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleCourseClick = (courseId: string) => {
    posthog.capture("course_link_clicked", {
      course_id: courseId,
      professor_name: selected?.professor_name,
    });
  };

  if (!selected) {
    return (
      <div className="p-8 text-center text-gray-500">
        <h3 className="text-lg font-medium mb-2">Select a Professor</h3>
        <p>Choose a professor from the list to view details</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        <h3 className="text-lg font-medium mb-2">Error Loading Details</h3>
        <p>Could not fetch professor information</p>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">
        {professorDetails?.professor_name || selected.professor_name}
      </h2>

      {professorDetails?.department && (
        <p className="text-lg text-gray-600 mb-4">
          {professorDetails.department}
        </p>
      )}

      {/* Ratings Section */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center mb-2">
              <span className="text-yellow-500 text-xl mr-2">★</span>
              <span
                className={`text-2xl font-bold ${ratingBgColor(professorDetails?.overall_rating)}`}
              >
                {displayRatingUtil(professorDetails?.overall_rating)}
              </span>
            </div>
            <p className="text-sm text-gray-600">Overall Rating</p>
          </div>
          <div>
            <div className="flex items-center mb-2">
              <span className="text-red-500 text-xl mr-2">📊</span>
              <span className="text-2xl font-bold">
                {displayRatingUtil(professorDetails?.level_of_difficulty)}
              </span>
            </div>
            <p className="text-sm text-gray-600">Difficulty Level</p>
          </div>
        </div>
      </div>

      {/* Courses Section */}
      {professorDetails?.classes && professorDetails.classes.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3 text-xl">
            Courses Taught
          </h3>
          <div className="space-y-4">
            {professorDetails.classes.map((course, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <a
                      href={
                        "https://daviscattlelog.com/course/" + course.course_id
                      }
                      onClick={() => handleCourseClick(course.course_id)}
                    >
                      <h4 className="font-medium text-gray-900">
                        {course.course_id}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {course.course_title}
                      </p>
                    </a>
                  </div>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                    {course.reviews.length} review
                    {course.reviews.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Recent Reviews */}
                {course.reviews.slice(0, 2).map((review, reviewIndex) => (
                  <div
                    key={reviewIndex}
                    className="bg-gray-50 rounded p-3 mt-3"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <span className="text-yellow-500 text-sm">★</span>
                          <span className="text-sm font-medium ml-1">
                            {review.quality_rating}/5
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-red-500 text-sm">📊</span>
                          <span className="text-sm font-medium ml-1">
                            {review.difficulty_rating}/5
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          Grade: {review.grade}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {review.date}
                      </span>
                    </div>

                    {/* Tags */}
                    {review.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {review.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Review Text */}
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {review.review}
                    </p>
                  </div>
                ))}

                {course.reviews.length > 2 && (
                  <p className="text-sm text-gray-500 mt-2">
                    + {course.reviews.length - 2} more review
                    {course.reviews.length - 2 !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Basic professor info if no detailed data */}
      {!professorDetails && (
        <div>
          {selected.average_rating && (
            <div className="flex items-center mb-4">
              <span className="text-yellow-500 text-lg mr-1">★</span>
              <span
                className={`text-lg font-medium ${ratingBgColor(selected.average_rating)}`}
              >
                {displayRatingUtil(selected.average_rating)}
              </span>
              {selected.num_ratings && (
                <span className="text-gray-500 ml-2">
                  ({selected.num_ratings} ratings)
                </span>
              )}
            </div>
          )}

          {selected.courses_taught && selected.courses_taught.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Courses Taught
              </h3>
              <div className="space-y-1">
                {selected.courses_taught.map((course, index) => (
                  <span
                    key={index}
                    className="inline-block bg-gray-100 text-gray-800 text-sm px-2 py-1 rounded mr-2 mb-1"
                  >
                    {course}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Constants
const ROW_H = 120;
const ROW_GAP = 5;
const HEADER_OFFSET = 70;
const CACHE_EXPIRY_TIME = 30 * 60 * 1000;

// Main Component
function ProfHome() {
  const { data, isFetching, isLoading } = useQuery({
    queryKey: ["professors"],
    queryFn: fetchAllProfessors,
    staleTime: CACHE_EXPIRY_TIME,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const professors = useMemo(() => data || [], [data]);
  const [searchParams, setSearchParams] = useSearchParams();

  const filtersRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const activeSearchId = useRef(0);

  const [filters, setFilters] = useState<Filters>(() => {
    const sortParam = searchParams.get("sort");
    const sort: Sort =
      sortParam === "rating"
        ? "rating"
        : sortParam === "alphabetical"
          ? "alphabetical"
          : "none";
    return {
      departments: searchParams.get("departments")?.split(",") || [],
      search: searchParams.get("search") || "",
      sort,
      highRatingOnly: searchParams.get("highrating") === "true",
    };
  });

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [selected, setSelected] = useSelectedProfessor();
  const [isSearching, setIsSearching] = useState(false);
  const [lastSettledQuery, setLastSettledQuery] = useState("");
  const [filtersH, setFiltersH] = useState(0);
  const [searchResults, setSearchResults] = useState<Professor[]>([]);
  const [viewportH, setViewportH] = useState(0);
  const [vh, setVh] = useState(0);

  const minPaneH = Math.max(filtersH, vh - HEADER_OFFSET, 0);
  const trimmedQuery = filters.search.trim();

  // Memoize professor map for quick lookups
  const professorMap = useMemo(() => {
    const m = new Map<string, Professor>();
    professors.forEach((p: Professor) => m.set(p.professor_id, p));
    return m;
  }, [professors]);

  // Calculate the number of skeletons to show based on viewport height
  const skeletonCount = useMemo(() => {
    const h = viewportH || minPaneH || 800;
    return Math.max(3, Math.floor((h + ROW_GAP) / (ROW_H + ROW_GAP)));
  }, [viewportH, minPaneH]);

  // Track page load
  useEffect(() => {
    posthog.capture("professor_page_loaded");
  }, []);

  // Resize observers
  useLayoutEffect(() => {
    if (!filtersRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setFiltersH(entry?.contentRect?.height ?? 0);
    });
    ro.observe(filtersRef.current);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const ro = new ResizeObserver(([entry]) => {
      setViewportH(entry?.contentRect?.height ?? 0);
    });
    const el = viewportRef.current;
    if (el) ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Viewport height tracking
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

  // Update URL params based on filters (excluding professor selection)
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams);

      if (filters.departments.length)
        params.set("departments", filters.departments.join(","));
      else params.delete("departments");

      if (filters.search.trim()) params.set("search", filters.search.trim());
      else params.delete("search");

      if (filters.sort === "rating") params.set("sort", "rating");
      else if (filters.sort === "alphabetical")
        params.set("sort", "alphabetical");
      else params.delete("sort");

      if (filters.highRatingOnly) params.set("highrating", "true");
      else params.delete("highrating");

      setSearchParams(params, { replace: true });
    }, 300);

    return () => clearTimeout(t);
  }, [filters, searchParams, setSearchParams]);

  // Professor search effect
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
        const searchResponse: {
          professor_id: string;
          professor_slug: string;
          professor_name: string;
        }[] = await searchProfessors(trimmed);

        if (myId !== activeSearchId.current) return;

        // Track search completion
        posthog.capture("search_completed", {
          query: trimmed,
          results_count: searchResponse.length,
        });

        // Match search results with full professor data
        const matched = searchResponse
          .map((searchItem) => {
            // Try to find in full professor list first
            const fullProfessor = professorMap.get(searchItem.professor_id);
            if (fullProfessor) {
              return fullProfessor;
            }
            // If not found in full list, create a basic professor object from search result
            return {
              professor_id: searchItem.professor_id,
              professor_slug: searchItem.professor_slug,
              professor_name: searchItem.professor_name,
              department: undefined,
              average_rating: undefined,
              num_ratings: undefined,
              courses_taught: undefined,
            } as Professor;
          })
          .filter(Boolean);

        console.log(
          `Search found ${searchResponse.length} results, matched ${matched.length} professors`,
        );
        setSearchResults(matched);
        setLastSettledQuery(trimmed);
      } catch (error) {
        console.error("Search error:", error);
        if (myId !== activeSearchId.current) return;
        setSearchResults([]);
      } finally {
        if (myId === activeSearchId.current) setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [filters.search, professorMap]);

  // Filter and sort professors
  const filteredProfessors = useMemo(
    () => applyFilters(professors, filters, searchResults),
    [professors, filters, searchResults],
  );

  const sortedProfessors = useMemo(
    () => applyPostFiltersAndSort(filteredProfessors, filters),
    [filteredProfessors, filters],
  );

  // Virtualizer
  const rowVirtualizer = useVirtualizer({
    count: sortedProfessors.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_H,
    overscan: 12,
    getItemKey: (index) => sortedProfessors[index]?.professor_id ?? index,
  });

  // Event handlers with PostHog tracking
  const handleClick = (professor: Professor) => {
    setSelected(professor);
    posthog.capture("professor_selected", {
      professor_name: professor.professor_name,
      department: professor.department,
    });
  };

  const handleSearchChange = useCallback((term: string) => {
    setFilters((f) => ({ ...f, search: term }));
    if (term.trim()) {
      posthog.capture("search_query", { search: term.trim() });
    }
  }, []);

  const handleSortChange = (sort: Sort) => {
    setFilters((f) => ({ ...f, sort }));
    posthog.capture("sort_changed", { sort_type: sort });
  };

  const handleHighRatingChange = (value: boolean) => {
    setFilters((f) => ({ ...f, highRatingOnly: value }));
    posthog.capture("high_rating_filter_toggled", { enabled: value });
  };

  const handleClearFilters = useCallback(() => {
    const hadFilters =
      filters.search || filters.highRatingOnly || filters.sort !== "none";

    setFilters((f) => ({
      ...f,
      departments: [],
      search: "",
      highRatingOnly: false,
    }));

    if (hadFilters) {
      posthog.capture("filters_cleared");
    }
  }, [filters]);

  const toggleMobileFilters = () => {
    const newState = !isMobileFilterOpen;
    setIsMobileFilterOpen(newState);
    posthog.capture("mobile_filters_toggled", { opened: newState });
  };

  // Track search with no results
  useEffect(() => {
    const trimmed = filters.search.trim();
    if (
      trimmed &&
      !isSearching &&
      lastSettledQuery === trimmed &&
      sortedProfessors.length === 0
    ) {
      posthog.capture("search_no_results", { query: trimmed });
    }
  }, [filters.search, isSearching, lastSettledQuery, sortedProfessors.length]);

  // Determine display states
  const isSettled = !isSearching && lastSettledQuery === trimmedQuery;
  const showInitialSkeleton =
    isLoading || (isFetching && professors.length === 0);
  const showSearchSkeleton =
    isSearching && trimmedQuery && lastSettledQuery !== trimmedQuery;
  const showEmptySearch =
    !showInitialSkeleton &&
    trimmedQuery.length > 0 &&
    isSettled &&
    sortedProfessors.length === 0;
  const showEmptyNoSearch =
    !showSearchSkeleton &&
    trimmedQuery.length === 0 &&
    filteredProfessors.length === 0;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <Header />

      {/* Main content area grid */}
      <div className="flex-1 lg:grid grid-cols-9 overflow-hidden">
        {/* Left Column: Filters */}
        <div
          ref={filtersRef}
          className="hidden lg:block col-span-2 border-r border-gray-200"
        >
          <FilterPanel
            searchTerm={filters.search}
            sort={filters.sort}
            highRatingOnly={filters.highRatingOnly}
            onSearchTermChange={handleSearchChange}
            onChangeSort={handleSortChange}
            onChangeHighRating={handleHighRatingChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Middle Column: List of professors */}
        <div className="col-span-2 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h2 className="font-bold text-xl">
              Professors ({sortedProfessors.length})
            </h2>

            <button
              onClick={toggleMobileFilters}
              className="lg:hidden px-3 py-2 text-sm border border-gray-300 rounded"
            >
              Filters
            </button>
          </div>

          {/* Mobile filter panel */}
          {isMobileFilterOpen && (
            <div className="lg:hidden">
              <FilterPanel
                searchTerm={filters.search}
                sort={filters.sort}
                highRatingOnly={filters.highRatingOnly}
                onSearchTermChange={handleSearchChange}
                onChangeSort={handleSortChange}
                onChangeHighRating={handleHighRatingChange}
                onClearFilters={handleClearFilters}
                isOpen={isMobileFilterOpen}
                onRequestClose={() => setIsMobileFilterOpen(false)}
              />
            </div>
          )}

          <div ref={viewportRef} className="flex-1 overflow-hidden">
            {showInitialSkeleton || showSearchSkeleton ? (
              <div className="p-2">
                {Array.from({ length: skeletonCount }, (_, i) => (
                  <SkeletonProfessor key={i} />
                ))}
              </div>
            ) : showEmptySearch ? (
              <div className="p-8 text-center text-gray-500">
                <p>No professors found for "{trimmedQuery}"</p>
              </div>
            ) : showEmptyNoSearch ? (
              <div className="p-8 text-center text-gray-500">
                <p>No professors available</p>
              </div>
            ) : (
              <div ref={parentRef} className="h-full overflow-y-auto">
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    position: "relative",
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const professor = sortedProfessors[virtualRow.index];
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
                        <ProfessorItem
                          name={professor.professor_name}
                          department={professor.department}
                          rating={professor.average_rating}
                          numRatings={professor.num_ratings}
                          isSelected={
                            selected?.professor_id === professor.professor_id
                          }
                          onClick={() => handleClick(professor)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected professor details */}
        <div className="hidden lg:block col-span-5 border-l border-gray-200">
          <SelectedProfessorPanel selected={selected} />
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default ProfHome;
