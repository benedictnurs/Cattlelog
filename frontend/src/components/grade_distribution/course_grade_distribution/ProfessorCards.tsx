import React, { FC } from "react";
import { ProfessorCardsProps } from "../gradeDistributionTypes";
import { getLetterGrade } from "../gradeDistributionUtils";

export const ProfessorCards: FC<ProfessorCardsProps> = ({
  courseOverallGpa,
  quarters,
  selectedQuarterIds,
  professorColorMap,
}) => {
  // If nothing selected, show Overall card
  if (selectedQuarterIds.length === 0) {
    const letter = getLetterGrade(courseOverallGpa);
    const displayGPA =
      courseOverallGpa != null ? `(${courseOverallGpa.toFixed(2)})` : "(N/A)";
    const borderColor = professorColorMap["default"] ?? "#987CDB";

    return (
      <div
        className="w-full [@media(min-width:600px)]:w-[250px] self-start rounded-lg overflow-visible flex-shrink-0 bg-[#EFEFEF]"
        style={{ borderColor }}
      >
        <div className="p-[16px]">
          {/* top label */}
          <h2
            className="font-bold text-[14px] -my-[2px] brightness-[0.75]"
            style={{ color: borderColor }}
          >
            OVERALL
          </h2>
          {/* center title */}
          <div className="font-bold text-[20px] -my-[3px]">Course Average</div>
          {/* bottom badge */}
          <div
            className="px-[16px] py-[10px] mt-[8px] rounded-[6px] brightness-[1.5]"
            style={{ backgroundColor: borderColor }}
          >
            <h2
              className="font-bold text-[14px] -my-[2px] brightness-[0.6]"
              style={{ color: borderColor }}
            >
              GRADE
            </h2>
            <h3 className="font-[600] text-[20px] -mt-[3px] -mb-[1px]">
              {letter} {displayGPA}
            </h3>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, show each selected professor
  return (
    <>
      {quarters
        .filter((q) => selectedQuarterIds.includes(q.id))
        .map((q) => {
          const borderColor = professorColorMap[q.id] || "#987CDB";
          const letter = getLetterGrade(q.average_gpa);
          const displayGPA =
            q.average_gpa != null ? `(${q.average_gpa.toFixed(2)})` : "(N/A)";
          const displayQuarter = q.quarter;
          const displayName = `${q.professor_name}`;

          return (
            <div
              key={q.id}
              className="w-full [@media(min-width:600px)]:w-[250px] self-start flex-shrink-0 rounded-lg overflow-visible bg-[#EFEFEF] hover:brightness-[.96] transition-all duration-130"
              style={{ borderColor }}
            >
              <a href={`/professor/${q.slug}`}>
                <div className="p-[16px]">
                  <h2
                    className="font-bold text-[14px] -my-[2px] brightness-[0.75] uppercase"
                    style={{ color: borderColor }}
                  >
                    {displayQuarter}
                  </h2>
                  <div className="text-inherit flex justify-between items-center">
                    <div className="font-bold text-[20px] -my-[3px] mr-2">
                      {displayName}
                    </div>
                    <img
                      src="/arrow-up-right-from-square-solid 1.svg"
                      alt="Open professor page"
                      width={16}
                      height={16}
                      className="inline-block"
                    />
                  </div>
                  <div
                    className="px-[16px] py-[10px] mt-[8px] rounded-[6px] brightness-[1.5]"
                    style={{ backgroundColor: borderColor }}
                  >
                    <h2
                      className="font-bold text-[14px] -my-[2px] brightness-[0.6]"
                      style={{ color: borderColor }}
                    >
                      COURSE AVERAGE
                    </h2>
                    <h3 className="font-[600] text-[20px] -mt-[3px] -mb-[1px]">
                      {letter} {displayGPA}
                    </h3>
                  </div>
                </div>
              </a>
            </div>
          );
        })}
    </>
  );
};
