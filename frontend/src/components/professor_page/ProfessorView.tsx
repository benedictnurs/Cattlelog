import React, { FC, useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { parseRating, ratingBgColor, displayRating } from "../../utils/rating";

export interface ReviewProps {
  quality_rating: string;
  difficulty_rating: string;
  tags: string[];
  date_written: string;
  review: string;
  term?: string;
  unique_review: boolean;
}

export interface ClassInfoProps {
  course_id: string;
  course_title: string;
  reviews: ReviewProps[];
}

export interface GeneralInfo {
  professor_name: string;
  dept: string;
  summary: string;
  overall_rating: number;
  level_of_difficulty: number;
  class_info: ClassInfoProps[];
}

const REVIEW_LIMIT = 3;

const ProfessorView: FC<{ course: ClassInfoProps }> = ({ course }) => {
  const [expanded, setExpanded] = useState(false);

  const visibleReviews = expanded
    ? course.reviews
    : course.reviews.slice(0, REVIEW_LIMIT);

  return (
    <div key={course.course_id} className="mb-4 sm:mb-10">
      <div className="flex items-center justify-between gap-4 pr-14">
        <h1 className="text-[16px] sm:text-[18px]">
          <a
            href={`/course/${course.course_id}`}
            className="hover:underline text-inherit"
          >
            <span className="font-bold">{course.course_id}</span>:{" "}
            {course.course_title}
          </a>
        </h1>
        <a
          href={`/grade/${course.course_id}`}
          className="hidden md:inline-flex items-center rounded-lg bg-sky-950 px-9 font-[400] py-2 text-[16px] text-white hover:bg-sky-800 hover:shadow-gray-400 transition-all duration-200 whitespace-nowrap shadow-md shadow-gray-300"
        >
          View Grade Distributions
        </a>
      </div>

      <div className="pt-6 pb-4 sm:pb-0 sm:px-9 md:pr-24 border-b border-slate-200 sm:border-none">
        {course.reviews.length === 0 ? (
          <p className="text-center text-gray-500 italic py-6">
            No reviews for this course.
          </p>
        ) : (
          <>
            <motion.ul>
              <AnimatePresence initial={false}>
                {visibleReviews.map((review, index) => (
                  <motion.li
                    key={`${review.date_written}-${index}`}
                    layout
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="bg-gray-100 rounded-3xl p-3 sm:p-5 mb-6 sm:mb-7 sm:pt-6 pl-6 sm:pl-8 pb-4 sm:pb-5">
                      <div className="flex justify-between w-full">
                        <div>
                          <div className="flex gap-8 items-center sm:mb-3 text-base">
                            <span className="text-gray-500 text-[14px] sm:text-[17px]">
                              {review.date_written}
                            </span>
                            {review.unique_review && review.term && (
                              <span className="text-sky-950 font-semibold text-[13px] sm:text-[14px]">
                                {review.term.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <p className="text-[13px] sm:text-[16px] mr-5 sm:mr-20 pt-2">
                            {review.review}
                          </p>
                        </div>
                        <div className="flex flex-col items-end flex-none pr-3">
                          <h1
                            className={`text-white w-[47px] h-[47px] sm:w-20 sm:h-20 flex justify-center items-center rounded-xl text-[18px] sm:text-[40px] font-bold ${ratingBgColor(
                              review.quality_rating,
                            )}`}
                          >
                            {displayRating(
                              parseRating(review.quality_rating),
                              0,
                            )}
                          </h1>
                          <h4 className="mt-3 text-[13px] sm:text-[16px] text-gray-500">
                            Difficulty:{" "}
                            {displayRating(review.difficulty_rating, 0)}
                          </h4>
                        </div>
                      </div>
                      <ul className="flex flex-wrap gap-3 sm:gap-5 items-start w-full h-full mt-3">
                        {review.tags.map((tag, i) => (
                          <li
                            key={`${course.course_id}-tag-${i}`}
                            className="bg-tag_bg_color text-center py-1 px-4 sm:py-1 sm:px-4 text-[13px] sm:text-[15px] rounded-3xl text-white"
                          >
                            {tag}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>

            {course.reviews.length > REVIEW_LIMIT && (
              <div className="text-center">
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="text-[#1A5276] hover:underline flex flex-col items-center mx-auto"
                >
                  {expanded ? "View Less" : "View More"}
                  <ChevronDown
                    className={`w-6 h-6 transition-transform duration-300 ${
                      expanded ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProfessorView;
