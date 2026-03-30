import React, { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronUpIcon } from "@heroicons/react/24/outline";
import { ProfessorInfo } from "../gradeDistributionTypes";
import posthog from "posthog-js";

interface ProfessorAccordionProps {
  professors: ProfessorInfo[];
  selectedSeries: string[];
  toggleQuarter: (id: string) => void;
  toggleProfessorAll: (profId: string, quarters: string[]) => void;
}

const ProfessorAccordion: React.FC<ProfessorAccordionProps> = ({
  professors,
  selectedSeries,
  toggleQuarter,
  toggleProfessorAll,
}) => {
  const [openPanels, setOpenPanels] = useState<Record<string, boolean>>({});
  const checkboxZone = useRef<HTMLLabelElement>(null);

  return (
    <div className="flex flex-wrap gap-y-8">
      {professors.map((prof) => {
        const qids = prof.professor_quarter_data?.map((q) => q.id) || [];
        const allSelected = qids.every((id) => selectedSeries.includes(id));
        const open = !!openPanels[prof.id];
        const onHeaderClick = (e: React.MouseEvent) => {
          if (checkboxZone.current?.contains(e.target as Node)) {
            return;
          }
          const nextOpen = !open;
          posthog.capture("grade_dist_toggle_panel", {
            profId: prof.id,
            open: nextOpen,
          });
          setOpenPanels((p) => ({ ...p, [prof.id]: !p[prof.id] }));
        };
        const someSelected = qids.some((id) => selectedSeries.includes(id));
        const isIndeterminate = someSelected && !allSelected;

        return (
          <div
            key={prof.id}
            className="relative bg-100 rounded-lg bg-white border-gray-100 w-full lg:w-[405px] p-3"
          >
            <button
              type="button"
              onClick={onHeaderClick}
              className={`w-full flex items-center bg-gray-100 justify-between p-4 cursor-pointer
              ${open ? "rounded-t-lg" : "rounded-lg"}`}
            >
              <div className="flex items-center gap-2">
                <label
                  ref={checkboxZone}
                  onClick={(e) => e.stopPropagation()}
                  className="flex"
                >
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation();
                      posthog.capture(
                        allSelected
                          ? "grade_dist_deselect_professor"
                          : "grade_dist_select_professor",
                        { profId: prof.id, quarters: qids },
                      );
                      toggleProfessorAll(prof.id, qids);
                      setOpenPanels((prev) => ({
                        ...prev,
                        [prof.id]: !allSelected,
                      }));
                    }}
                    className="sr-only peer"
                  />
                  <div
                    className={`
                      w-5 h-5 flex-shrink-0 flex
                      relative overflow-hidden
                      border-2 rounded-sm
                      border-gray-300 bg-white
                      peer-checked:border-[#1A5276] peer-checked:bg-[#1A5276]
                      transition-colors duration-150
                    `}
                  >
                    <span
                      className={`
                        absolute bottom-0 right-0 w-full h-full
                        opacity-0 transition-opacity duration-200 ease-out
                        ${isIndeterminate ? "opacity-100" : ""}
                      `}
                      style={{
                        clipPath: "polygon(100% 100%, 100% 0, 0 100%)",
                        backgroundColor: "#1A5276",
                      }}
                    />
                  </div>
                </label>
                <span className="pl-3 text-[14px] sm:text-[16px] font-[600] text-gray-700">
                  {prof.professor_name}
                </span>
              </div>
              <ChevronUpIcon
                className={`w-5 h-5 transform transition-transform ${
                  open ? "" : "rotate-180"
                }`}
              />
            </button>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  key={`panel-${prof.id}`}
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="border-2 rounded-b-lg border-gray-100 px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-gray-700"
                >
                  {prof.professor_quarter_data?.map((q) => {
                    const displayQuarter = q.quarter
                      .toLowerCase()
                      .split(" ")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1),
                      )
                      .join(" ");

                    const isChecked = selectedSeries.includes(q.id);

                    return (
                      <label
                        key={q.id}
                        className="inline-flex items-center text-sm cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            posthog.capture(
                              isChecked
                                ? "grade_dist_deselect_quarter"
                                : "grade_dist_select_quarter",
                              { quarterId: q.id },
                            );
                            toggleQuarter(q.id);
                          }}
                          className="sr-only peer"
                        />
                        <div
                          className={`
                            w-5 h-5 flex-shrink-0 flex items-center justify-center
                            border-2 rounded-sm
                            border-gray-300 bg-white
                            peer-checked:border-[#1A5276] peer-checked:bg-[#1A5276]
                            transition-colors duration-150
                          `}
                        />
                        <span className="font-[550] pl-2">
                          {displayQuarter}
                        </span>
                      </label>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default ProfessorAccordion;
