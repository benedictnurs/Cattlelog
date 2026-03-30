import { FC } from "react";
import { ProfessorCardsProps } from "../../grade_distribution/gradeDistributionTypes";
import { getLetterGrade } from "../gradeDistributionUtils";

export const LandingGradeProfessorCards: FC<ProfessorCardsProps> = ({
  courseId,
  courseOverallGpa,
  quarters,
  selectedQuarterIds,
  professorColorMap,
}) => {
  // If nothing selected, show UC Davis average card
  if (quarters.length === 0) {
    const letter = getLetterGrade(courseOverallGpa);
    const displayGPA =
      courseOverallGpa != null && typeof courseOverallGpa === "number"
        ? `(${courseOverallGpa.toFixed(2)})`
        : "(N/A)";
    const borderColor = professorColorMap["default"] ?? "#987CDB";

    return (
      <div
        className="w-full [@media(min-width:600px)]:w-[250px] self-start flex-shrink-0 rounded-lg overflow-visible bg-[#EFEFEF]"
        style={{ borderColor }}
      >
        <div className="p-[16px]">
          <h2
            className="font-bold text-[14px] -my-[2px] brightness-[0.75]"
            style={{ color: borderColor }}
          >
            OVERALL
          </h2>
          <div className="font-bold text-[20px] -my-[3px]">
            UC Davis Average
          </div>
          <div
            className="px-[16px] py-[10px] mt-[8px] rounded-[6px] brightness-[1.5]"
            style={{ backgroundColor: borderColor }}
          >
            <h2
              className="font-bold text-[14px] -my-[2px] brightness-[0.6]"
              style={{ color: borderColor }}
            >
              GPA
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
            typeof q.average_gpa === "number"
              ? `(${q.average_gpa.toFixed(2)})`
              : "(N/A)";
          const displayName = q.professor_name;

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
                    {q.courseId?.toUpperCase()}
                  </h2>
                  <div className="flex justify-between items-center">
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
                      OVERALL AVERAGE
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
