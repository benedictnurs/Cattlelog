import React, { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronUpIcon, TrashIcon } from "@heroicons/react/24/outline";
import { LandingCourseInfo } from "../gradeDistributionTypes";
import { Sparkline } from "../Sparkline";

interface Props {
  courseId: string;
  course: LandingCourseInfo;
  onRemove: () => void;
  onSelectChange?: (selectedIds: string[]) => void;
}

const MultiCourseAccordion: React.FC<Props> = ({
  courseId,
  course,
  onRemove,
  onSelectChange,
}) => {
  /* ---- ui state ---- */
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    onSelectChange?.(selected);
  }, [selected]);

  const professors = useMemo(() => {
    return course.professors.map((p) => {
      const id = `${courseId}-${p.slug}`;
      const totalEntry = (p.professor_quarter_data as Record<string, any>)[
        "Total"
      ];
      const gpa = totalEntry?.quarter_average_gpa ?? null;
      return {
        id,
        name: p.professor_name,
        gpa,
        grades: totalEntry?.quarter_grade_distribution || {},
      };
    });
  }, [course, courseId]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      return next;
    });

  return (
    <div className="relative w-full lg:w-[420px]">
      <div
        role="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-4 border-2
                   border border-gray-200 px-4 py-3 bg-gray-50 hover:bg-gray-100
                   transition-all ${open ? "rounded-t-2xl" : "rounded-2xl"}`}
      >
        <div className="truncate text-[16px] font-semibold text-gray-700 flex-1 min-w-0">
          {courseId.toUpperCase()} – {course.course_title}
        </div>
        <div className="flex gap-3 items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="text-gray-400 hover:text-red-500"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
          <ChevronUpIcon
            className={`w-5 h-5 text-gray-500 transition-transform ${
              open ? "rotate-0" : "rotate-180"
            }`}
          />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="border-x border-b border-gray-200 border-b-2 border-x-2 bg-white p-4 rounded-b-2xl"
          >
            <ul className="space-y-3">
              {professors.map((prof) => {
                const isChecked = selected.includes(prof.id);
                return (
                  <li key={prof.id}>
                    <label className="flex justify-between items-center gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggle(prof.id)}
                          className="sr-only"
                        />
                        <div
                          className={`h-5 w-5 flex-none shrink-0 rounded-sm border-2 transition-colors ${
                            isChecked
                              ? "bg-[#1A5276] border-[#1A5276]"
                              : "bg-white border-gray-300"
                          }`}
                        />
                        <span className="text-sm font-medium text-gray-700 truncate">
                          {prof.name}
                        </span>
                        <div className="ml-5">
                          {/* Display the sparkline for the professor's grades */}
                          {/* optional, I thought it was kinda cool though */}
                          <Sparkline grades={prof.grades} />
                        </div>
                      </div>
                      {prof.gpa != null && (
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          GPA {prof.gpa.toFixed(2)}
                        </span>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default MultiCourseAccordion;
