/*  src/components/favorites_page/CourseCard.tsx  */
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Course } from "../types/Course";
import { motion, AnimatePresence } from "framer-motion";

export type TeachingStatus = Record<string, boolean>;

interface Props {
  course: Course;
  teachingStatus: TeachingStatus;
  toggleFavorite: (id: string) => void;
}

const CourseCard: React.FC<Props> = ({
  course,
  teachingStatus,
  toggleFavorite,
}) => {
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const nav = useNavigate();

  /* click‑outside to close */
  useEffect(() => {
    const close = (e: MouseEvent) =>
      cardRef.current &&
      !cardRef.current.contains(e.target as Node) &&
      setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const professors = course.professors ?? [];
  const offered = professors.some(
    (p) => teachingStatus[`${p.id}-${course.course_id}`],
  );

  return (
    <div ref={cardRef} className="relative w-full max-w-[364px]">
      {/* ---- Header (ID, star, title) ---- */}
      <div
        onClick={() => nav(`/course/${course.course_id}`)}
        className="bg-[#F6F6F6] p-5 cursor-pointer hover:bg-gray-200 transition rounded-t-2xl"
      >
        <div className="flex justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-700">
              {course.course_id}
            </h2>
            {offered && (
              <span className="bg-[#5FA3CF] text-white text-xs font-semibold px-2 py-1 rounded-full">
                WQ26
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(course.course_id);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="#E7C756"
              stroke="#E7C756"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className="w-6 h-6"
            >
              <path d="M12 17.27l6.18 3.73-1.64-7.03L21 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73-1.64 7.03L12 17.27z" />
            </svg>
          </button>
        </div>
        <h3 className="mt-2 text-gray-500">{course.course_title}</h3>
      </div>
      {/* Chevron handle */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="relative h-10 bg-white border-x-2 border-t-0 border-b-2 border-[#F6F6F6] flex items-center justify-center cursor-pointer hover:bg-gray-200 transition"
        style={{
          borderBottomLeftRadius: open ? 0 : "1rem",
          borderBottomRightRadius: open ? 0 : "1rem",
        }}
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          stroke="#001628"
          strokeWidth="2"
          viewBox="0 0 24 24"
          className="w-5 h-5"
          animate={{ rotate: open ? -180 : 0 }}
          transition={{ duration: 0.25 }}
        >
          <path
            d="M19 9l-7 7-7-7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </div>
      {/* Animated list */}
      <AnimatePresence initial={false}>
        {open && professors.length > 0 && (
          <motion.div
            key="prof-list"
            className="
                        absolute left-0 top-full w-full z-10
                        bg-white
                        border-2 border-t-0 border-[#F6F6F6]
                        rounded-b-2xl
                        overflow-hidden
                        shadow-lg
                      "
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {professors.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-start px-4 py-2 text-gray-700 border-b last:border-b-0 border-gray-200"
              >
                <Link
                  to={`/professor/${p.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="hover:underline"
                >
                  {p.professor_name}
                </Link>
                {teachingStatus[`${p.id}-${course.course_id}`] && (
                  <span className="ml-3 bg-[#5FA3CF] text-white text-xs font-semibold px-2 py-1 rounded-full">
                    WQ26
                  </span>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CourseCard;
