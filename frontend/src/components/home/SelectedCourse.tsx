import React, { useState, useEffect, useMemo, useRef } from "react";
import { Course } from "../types/Course";
import { Link } from "react-router-dom";
import posthog from "posthog-js";
import { Tooltip } from "react-tooltip";
import FindTutorModal from "./ui/FindTutorModal";
import GradeButton from "./ui/GradeButton";
import { ratingBgColor, displayRating, parseRating } from "../../utils/rating";
import CourseTimeline from "./ui/CourseTimeline";

const FEATURES = {
  glowing_star_and_tooltip: false,
  tutorial_favorite_star: true,
};

interface SelectedCourseProps {
  selected: Course | null;
  onClose?: () => void;
}

export interface TeachingRecord {
  professor_id: string;
  professor_slug: string;
  course_id: string;
  is_teaching_this_quarter?: boolean;
}

const SelectedCourse: React.FC<SelectedCourseProps> = ({
  selected,
  onClose,
}) => {
  const [isFavorite, setFavorite] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const linkCopiedTimerRef = useRef<number | null>(null);
  const [showTutorialTooltip, setShowTutorialTooltip] = useState(false);
  const starClickCountRef = useRef(0);
  const tutorialHideTimerRef = useRef<number | null>(null);

  const displayCourse = selected
    ? {
        ...selected,
        description: selected.description || "N/A",
        prerequisites: selected.prerequisites ?? "N/A",
        average_overall_rating: selected.average_overall_rating ?? 0,
        overall_gpa: selected.average_gpa ?? null,
        fulfillment_tags: selected.fulfillment_tags ?? [],
        professors: selected.professors?.map((p) => ({
          ...p,
          slug: p.slug ?? p.id ?? "",
          review: p.review || "N/A",
          is_teaching: p.is_teaching || false,
        })),
      }
    : null;

  // memoised professor list
  const sortedProfessors = useMemo(() => {
    if (!displayCourse?.professors) return [];
    return [...displayCourse.professors]
      .filter((p) => !p.professor_name.includes("The Staff"))
      .sort((a, b) => {
        const aTeach = a.is_teaching ? 1 : 0;
        const bTeach = b.is_teaching ? 1 : 0;
        return bTeach - aTeach; // teaching first
      });
  }, [displayCourse?.professors]);

  const classRating = parseRating(displayCourse?.average_overall_rating);

  useEffect(() => {
    const favs: Course[] = JSON.parse(
      localStorage.getItem("favorites") || "[]",
    );
    setFavorite(favs.some((c) => c.course_id === selected?.course_id));
  }, [selected]);

  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem("hasVisitedSite");
    if (!hasVisitedBefore && selected) {
      localStorage.setItem("hasVisitedSite", "true");

      const showTimer = window.setTimeout(() => {
        setShowTutorialTooltip(true);
      }, 500);

      return () => {
        clearTimeout(showTimer);
        if (tutorialHideTimerRef.current) {
          clearTimeout(tutorialHideTimerRef.current);
          tutorialHideTimerRef.current = null;
        }
      };
    }
  }, [selected, FEATURES.tutorial_favorite_star]);

  const toggleFavorite = () => {
    if (!selected) return;

    if (showTutorialTooltip) {
      starClickCountRef.current += 1;
      if (starClickCountRef.current === 1) {
        if (tutorialHideTimerRef.current) {
          clearTimeout(tutorialHideTimerRef.current);
        }
        tutorialHideTimerRef.current = window.setTimeout(() => {
          setShowTutorialTooltip(false);
          tutorialHideTimerRef.current = null;
        }, 2000);
      } else if (starClickCountRef.current >= 2) {
        if (tutorialHideTimerRef.current) {
          clearTimeout(tutorialHideTimerRef.current);
          tutorialHideTimerRef.current = null;
        }
        setShowTutorialTooltip(false);
      }
    }

    const savedFavorites = JSON.parse(
      localStorage.getItem("favorites") || "[]",
    );
    if (isFavorite) {
      // Remove from favorites
      const updatedFavorites = savedFavorites.filter(
        (course: Course) => course.course_id !== selected.course_id,
      );
      localStorage.setItem("favorites", JSON.stringify(updatedFavorites));
      setFavorite(false);
      posthog.capture("course_removed_from_favorites", {
        course_id: selected.course_id,
        course_title: selected.course_title,
      });
    } else {
      // Add to favorites
      savedFavorites.push(selected);
      localStorage.setItem("favorites", JSON.stringify(savedFavorites));
      setFavorite(true);
      posthog.capture("course_added_to_favorites", {
        course_id: selected.course_id,
        course_title: selected.course_title,
      });
    }
  };

  const copyLinkToClipboard = () => {
    if (!selected) return;
    const url = `${window.location.origin}/course/${selected.course_id}?utm_source=share`;
    navigator.clipboard.writeText(url).then(() => {
      if (linkCopiedTimerRef.current) {
        clearTimeout(linkCopiedTimerRef.current);
        linkCopiedTimerRef.current = null;
      }
      setLinkCopied(true);
      linkCopiedTimerRef.current = window.setTimeout(() => {
        setLinkCopied(false);
        linkCopiedTimerRef.current = null;
      }, 1300);
    });
  };

  useEffect(() => {
    return () => {
      if (linkCopiedTimerRef.current) {
        clearTimeout(linkCopiedTimerRef.current);
        linkCopiedTimerRef.current = null;
      }
    };
  }, []);

  // Handler for recommended course clicks
  const handleRecommendedCourseClick = (courseName: string) => {
    posthog.capture("recommended_class_clicked", {
      class_name: courseName,
    });
  };

  if (!displayCourse) {
    return (
      <div className="p-8 text-gray-500 text-left w-full h-full">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Welcome to Davis Cattlelog!
        </h2>
        <p className="text-lg mb-6">
          Davis Cattlelog is a platform that helps students find courses and
          professor reviews at UC Davis. Easily browse professor reviews and
          access exclusive grade distributions for courses taken between Fall
          2022 and Fall 2024.
        </p>
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800">
            Recommended Courses:
          </h3>
          <div className="grid gap-4 max-w-2xl">
            <Link
              to="/course/ENG8"
              className="block"
              onClick={() =>
                handleRecommendedCourseClick("ENG8 - Intro to Entrepreneurship")
              }
            >
              <div className="p-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="#E7C756"
                        stroke="#E7C756"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        className="w-5 h-5"
                      >
                        <path d="M12 17.27l6.18 3.73-1.64-7.03L21 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73-1.64 7.03L12 17.27z" />
                      </svg>
                      ENG8 - Intro to Entrepreneurship
                    </h4>
                    <p className="text-gray-600">
                      Students from all majors will learn the processes involved
                      in modern entrepreneurship and identify an opportunity for
                      innovation.
                    </p>
                    <span className="inline-block bg-[#D9D9D9] px-2 py-1 text-xs mt-2 mx-2">
                      3 units
                    </span>
                    <span className="inline-block bg-[#D9D9D9] px-2 py-1 text-xs mt-2 mx-2">
                      SS
                    </span>
                  </div>
                </div>
              </div>
            </Link>
            <Link
              to="/course/ENG9"
              className="block"
              onClick={() =>
                handleRecommendedCourseClick("ENG9 - Startup Speaker Series")
              }
            >
              <div className="p-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="#E7C756"
                        stroke="#E7C756"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        className="w-5 h-5"
                      >
                        <path d="M12 17.27l6.18 3.73-1.64-7.03L21 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73-1.64 7.03L12 17.27z" />
                      </svg>
                      ENG9 - Startup Speaker Series
                    </h4>
                    <p className="text-gray-600">
                      Presentations from successful entrepreneurs about the
                      challenges of building a technology company, leadership,
                      barriers faced by underrepresented founders, and
                      professional resources to support student
                      entrepreneurship.
                    </p>
                    <span className="inline-block bg-[#D9D9D9] px-2 py-1 text-xs mt-2">
                      1 unit
                    </span>
                  </div>
                </div>
              </div>
            </Link>
            <Link
              to="/course/ENG108"
              className="block"
              onClick={() =>
                handleRecommendedCourseClick("ENG108 - Launching a Company")
              }
            >
              <div className="p-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="#E7C756"
                        stroke="#E7C756"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        className="w-5 h-5"
                      >
                        <path d="M12 17.27l6.18 3.73-1.64-7.03L21 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73-1.64 7.03L12 17.27z" />
                      </svg>
                      ENG108 - Launching a Company
                    </h4>
                    <p className="text-gray-600">
                      Technological innovation and product development. Working
                      as a team to turn ideas into companies through customer
                      development.
                    </p>
                    <span className="inline-block bg-[#D9D9D9] px-2 py-1 text-xs mt-2">
                      4 units
                    </span>
                  </div>
                </div>
              </div>
            </Link>
            <Link
              to="/course/ECS189L"
              className="block"
              onClick={() =>
                handleRecommendedCourseClick("ENG198 - Hacking for Climate")
              }
            >
              <div className="p-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="#E7C756"
                        stroke="#E7C756"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        className="w-5 h-5"
                      >
                        <path d="M12 17.27l6.18 3.73-1.64-7.03L21 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73-1.64 7.03L12 17.27z" />
                      </svg>
                      ENG198 - Hacking for Climate
                    </h4>
                    <p className="text-gray-600">
                      Identify real-life challenges in the sustainability
                      industry, and launch ventures to solve them.
                    </p>
                    <span className="inline-block bg-[#D9D9D9] px-2 py-1 text-xs mt-2">
                      4 units
                    </span>
                  </div>
                </div>
              </div>
            </Link>
            <br />
          </div>
        </div>
      </div>
    );
  }

  const grade_dist_clicked = () => {
    posthog.capture("grade_distribution_viewed", {
      course_id: selected!.course_id,
    });
  };

  return (
    <div className="h-full min-h-0">
      <div className="px-6 pb-1 pt-7 sm:px-[30px] sm:py-[24px]">
        <div className="w-full h-full">
          <div className="">
            <div className="flex justify-between w-full">
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">
                    {displayCourse.course_id}
                  </h2>
                  <div>
                    <div
                      onClick={toggleFavorite}
                      className="relative inline-flex items-center justify-center align-middle ml-1 -mt-1 h-6 w-6 cursor-pointer transition-all duration-200 ease-in-out"
                      data-favorite-star="true"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className={`w-6 h-6 align-middle ${FEATURES.glowing_star_and_tooltip ? "animate-glow" : ""}`}
                        style={{
                          display: "block",
                          fill: isFavorite ? "#E7C756" : "transparent",
                          stroke: "#E7C756",
                          strokeWidth: 2,
                          transition: "fill 250ms ease, transform 150ms ease",
                        }}
                      >
                        <polygon points="12,17.27 18.18,21 16.54,13.97 22,9.24 14.81,8.63 12,2 9.19,8.63 2,9.24 7.46,13.97 5.82,21" />
                      </svg>
                    </div>

                    <Tooltip id="favorite-tooltip" />

                    {FEATURES.tutorial_favorite_star && (
                      <Tooltip
                        id="favorite-tutorial-tooltip"
                        isOpen={showTutorialTooltip}
                        anchorSelect='[data-favorite-star="true"]'
                        place="right"
                        content={
                          isFavorite
                            ? "Click to remove from favorites"
                            : "Click to add to favorites"
                        }
                        delayShow={120}
                        delayHide={80}
                        offset={8}
                        className="z-50 pointer-events-none transition-all duration-200 ease-out"
                        style={{
                          backgroundColor: "#1f2937",
                          color: "#ffffff",
                          fontSize: "12px",
                          borderRadius: "6px",
                          padding: "6px 10px",
                          boxShadow: "0 8px 18px rgba(0,0,0,0.28)",
                          opacity: showTutorialTooltip ? 1 : 0,
                          transform: showTutorialTooltip
                            ? "translateX(0) scale(1)"
                            : "translateX(6px) scale(0.98)",
                          transition:
                            "opacity 200ms ease, transform 220ms ease",
                          willChange: "opacity, transform",
                        }}
                      />
                    )}
                  </div>
                </div>
                <h3 className="text-base sm:text-[19px] mt-2.5">
                  {displayCourse.course_title}
                </h3>
              </div>
              {/* Class rating and optional close button */}
              <div className="flex items-start gap-2 ml-4">
                <div
                  className={`w-14 lg:w-[70px] aspect-square flex items-center justify-center text-white font-bold leading-none rounded-[8px] sm:rounded-[12px] p-0 ${ratingBgColor(classRating)}`}
                >
                  <span className="text-xl md:text-2xl lg:text-3xl">
                    {displayRating(classRating)}
                  </span>
                </div>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="ml-3 rounded-md text-gray-600"
                  >
                    <svg
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                    >
                      <g clipPath="url(#clip0_1581_31251)">
                        <path
                          d="M15.2764 0.876465C15.7842 0.368798 16.6094 0.368667 17.1172 0.876465C17.6249 1.38427 17.6248 2.20943 17.1172 2.71729L11.1934 8.646L10.8408 9.00049L11.1943 9.354L17.123 15.2769C17.6305 15.7847 17.6307 16.6099 17.123 17.1177C16.6152 17.6255 15.7891 17.6255 15.2812 17.1177L9.35254 11.1938L8.99902 10.8413L8.64551 11.1948L2.72266 17.1235C2.21487 17.6311 1.38966 17.631 0.881836 17.1235C0.373973 16.6157 0.373973 15.7896 0.881836 15.2817L6.80469 9.35303L7.1582 8.99951L6.80469 8.646L0.875977 2.72314C0.368172 2.21532 0.368237 1.39019 0.875977 0.882324C1.38383 0.374468 2.20893 0.374481 2.7168 0.882324L8.64551 6.80518L9 7.15869L9.35352 6.80518L15.2764 0.876465Z"
                          fill="#18405A"
                          stroke="white"
                          strokeWidth=".8"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_1581_31251">
                          <rect width="18" height="18" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-5">
              <h3>
                <span className="font-bold">Description:</span>{" "}
                {displayCourse.description}
              </h3>
              <h3>
                <span className="font-bold">Prerequisites:</span>{" "}
                {displayCourse.prerequisites || "N/A"}
              </h3>
              <h3 className="text-gray-500">
                {displayCourse.overall_gpa
                  ? `Average GPA: ${displayCourse.overall_gpa.toFixed(2)}`
                  : "Average GPA: N/A"}
              </h3>
              <h3 className="text-gray-500 text-[14px] sm:text-[18px] pb-2 sm:pb-0">
                {displayCourse.units
                  ? `${displayCourse.units} units`
                  : "Units N/A"}
              </h3>
            </div>
          </div>
        </div>
        {/* Find Tutor Button Row */}
        <div className="flex justify-end pb-2 hidden sm:flex">
          <FindTutorModal courseId={selected?.course_id} />
        </div>
        {/* GE tags and grade distribution button */}
        <div className="flex pb-4 sm:pb-0">
          <div className="flex flex-wrap gap-2 lg:gap-3 justify-start items-center w-full">
            {displayCourse.fulfillment_tags?.map((type, index) => (
              <span key={index} className="bg-[#D9D9D9] p-1 text-[14px]">
                {type}
              </span>
            ))}
          </div>
          <div className="flex-shrink-0 ml-auto flex items-center">
            <div className="relative">
              {/* Link copied toast */}
              <div
                role="status"
                className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-md shadow-lg whitespace-nowrap flex items-center gap-2 transition-all duration-200 ${
                  linkCopied
                    ? "opacity-100 translate-y-0 bg-[#15374D] text-white"
                    : "opacity-0 translate-y-1 pointer-events-none bg-[#15374D] text-white"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.28 16.28a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 111.06-1.06l2.97 2.97 6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Link copied!</span>
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[#15374D]" />
              </div>
              <button
                onClick={copyLinkToClipboard}
                className="flex items-center justify-center ml-2 drop-shadow-lg p-2"
              >
                <div className="relative w-6 h-6">
                  {/* Default share icon */}
                  <img
                    src="/Vector.svg"
                    alt="Share Icon"
                    className={`absolute inset-0 w-6 h-6 transition-opacity duration-150 ${
                      linkCopied ? "opacity-0" : "opacity-100"
                    }`}
                  />
                  {/* Checkbox icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className={`absolute inset-0 w-6 h-6 transition-opacity duration-150 ${
                      linkCopied ? "opacity-100" : "opacity-0"
                    } text-[#15374D]`}
                  >
                    <path
                      d="M5 13l4 4L19 7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </button>
            </div>
            <div className="flex flex-col sm:flex-row items-start">
              <div className="relative ml-2">
                <GradeButton
                  courseId={selected?.course_id || ""}
                  onClick={grade_dist_clicked}
                ></GradeButton>
              </div>
            </div>
          </div>
        </div>
        <hr className="my-6 w-full border-t border-[#D9D9D9]" />
        {/*<CourseTimeline courseId={displayCourse.course_id} />*/}
        {/* Professors Information */}
        <div className="mt-4 mb-32 lg:mb-0">
          <h3 className="font-bold text-2xl sm:text-xl">Professors</h3>
          {sortedProfessors.length > 0 ? (
            sortedProfessors.map((professor, i) => {
              const ratingNum = parseRating(professor.overall_rating);
              const diffNum = parseRating(professor.overall_difficulty);
              const colorClass = ratingBgColor(ratingNum ?? null);
              const slug =
                professor.slug || professor.id || professor.professor_name;
              return (
                <Link
                  key={slug + i}
                  to={slug ? `/professor/${slug}` : "#"}
                  rel="noopener noreferrer"
                >
                  <div className="mt-5 py-6 px-7 rounded-2xl shadow-lg bg-gray-100 w-full hover:bg-gray-200 transition-colors duration-150">
                    <div className="flex w-full justify-between">
                      <div>
                        <h5 className="text-xl lg:text-2xl flex items-center gap-2">
                          {professor.professor_name}
                          {professor.is_teaching && (
                            <span
                              className="text-white text-xs px-2 py-1 mr-3 rounded-full"
                              style={{ backgroundColor: "#5FA3CF" }}
                            >
                              WQ26
                            </span>
                          )}
                        </h5>
                        <h6 className="text-gray-500">
                          Difficulty: {diffNum || "N/A"}
                        </h6>
                      </div>
                      <div
                        className={`flex-none w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center text-white font-bold leading-none rounded-[8px] sm:rounded-[12px] p-0 ${colorClass}`}
                      >
                        <span className="text-lg sm:text-2xl">
                          {displayRating(ratingNum)}
                        </span>
                      </div>
                    </div>
                    <div className="sm:flex sm:justify-between">
                      <p className="my-3 text-sm sm:max-w-96">
                        {professor.review || "N/A"}
                      </p>
                      <div className="flex sm:flex-col sm:w-fit w-full justify-center gap-3 sm:gap-2 mt-2">
                        {professor.common_tags?.map((tag, tagIndex) => (
                          <div
                            key={tagIndex}
                            className="flex justify-center items-center text-center sm:justify-end sm:items-end"
                          >
                            <h6 className="bg-tag_bg_color py-1 px-1.5 sm:py-1 sm:px-4 text-xs sm:text-sm rounded-3xl text-white">
                              {tag}
                            </h6>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <p className="text-gray-500 mt-4">No professors found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectedCourse;
