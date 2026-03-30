import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchCourseGrades } from "../../../api/GetCourseGrades";

interface ProfessorQuarterData {
  quarter_grade_distribution: Record<string, number>;
  quarter_average_gpa: number;
  quarter_enrolled: number;
}

interface Professor {
  professor_name: string;
  professor_slug: string;
  professor_quarter_data: Record<string, ProfessorQuarterData>;
}

interface CourseGradeData {
  course_id: string;
  course_title: string;
  available_quarters: string[];
  professors: Professor[];
}

interface TimelineItem {
  quarter: string;
  quarterDisplay: string;
  professorName: string;
  type: "past" | "current" | "future";
  blurLevel: number;
}

interface CourseTimelineProps {
  courseId: string;
}

const CourseTimeline: React.FC<CourseTimelineProps> = ({ courseId }) => {
  const [timelineData, setTimelineData] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to convert quarter format
  const formatQuarter = (quarter: string): string => {
    const [season, year] = quarter.split("_");
    const seasonMap: Record<string, string> = {
      Fall: "F",
      Winter: "W",
      Spring: "S",
      Summer: "U",
    };
    return `${seasonMap[season] || season}${year.slice(-2)}`;
  };

  // Helper function to sort quarters chronologically
  const sortQuarters = (quarters: string[]): string[] => {
    return quarters.sort((a, b) => {
      const [seasonA, yearA] = a.split("_");
      const [seasonB, yearB] = b.split("_");

      if (yearA !== yearB) {
        return parseInt(yearA) - parseInt(yearB);
      }

      const seasonOrder: Record<string, number> = {
        Winter: 0,
        Spring: 1,
        Summer: 2,
        Fall: 3,
      };

      return seasonOrder[seasonA] - seasonOrder[seasonB];
    });
  };

  useEffect(() => {
    const fetchTimelineData = async () => {
      try {
        setLoading(true);
        const data: CourseGradeData = await fetchCourseGrades(courseId);

        // Sort quarters chronologically
        const sortedQuarters = sortQuarters(data.available_quarters);

        // Find which professor taught each quarter
        const quarterProfMap: Record<string, string> = {};

        data.professors.forEach((prof) => {
          Object.keys(prof.professor_quarter_data).forEach((quarter) => {
            if (quarter !== "Total") {
              quarterProfMap[quarter] = prof.professor_name;
            }
          });
        });

        // Create timeline items
        const timeline: TimelineItem[] = [];

        // Add past quarters (blurred, up to 3)
        const pastQuarters = sortedQuarters.slice(0, -1).slice(-3);
        pastQuarters.forEach((quarter, index) => {
          const blurLevel = pastQuarters.length - index;
          timeline.push({
            quarter,
            quarterDisplay: formatQuarter(quarter),
            professorName: quarterProfMap[quarter] || "Unknown",
            type: "past",
            blurLevel,
          });
        });

        // Add current quarter (most recent)
        if (sortedQuarters.length > 0) {
          const currentQuarter = sortedQuarters[sortedQuarters.length - 1];
          timeline.push({
            quarter: currentQuarter,
            quarterDisplay: formatQuarter(currentQuarter),
            professorName: quarterProfMap[currentQuarter] || "Unknown",
            type: "current",
            blurLevel: 0,
          });
        }

        // Add future quarter prediction
        timeline.push({
          quarter: "future",
          quarterDisplay: "F25", // Placeholder for next quarter
          professorName: "Predict Professor",
          type: "future",
          blurLevel: 0,
        });

        setTimelineData(timeline);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchTimelineData();
    }
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5FA3CF]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-[#E05346] text-center py-4">
        Error loading timeline: {error}
      </div>
    );
  }

  return (
    <div className="my-8">
      <h3 className="font-bold text-xl mb-6">Teaching Timeline</h3>

      <div className="relative">
        {/* Timeline line */}

        <div className="flex items-center justify-between relative z-10">
          {timelineData.map((item, index) => (
            <div
              key={`${item.quarter}-${index}`}
              className="flex flex-col items-center"
            >
              {/* Timeline dot */}
              <div
                className={`w-4 h-4 rounded-full border-2 mb-4 ${
                  item.type === "current"
                    ? "bg-[#5FA3CF] border-[#5FA3CF] shadow-lg shadow-[#5FA3CF]/50"
                    : item.type === "future"
                      ? "bg-[#7B7B7B] border-[#7B7B7B]"
                      : "bg-white border-[#7B7B7B]"
                }`}
              ></div>

              {/* Content above timeline */}
              <div className="text-center mb-2">
                {item.type === "past" ? (
                  <Link
                    to="/quarter-timeline"
                    className="text-[#5FA3CF] hover:text-[#15374D] transition-colors"
                  >
                    <div
                      className={`text-sm font-semibold ${
                        item.blurLevel === 3
                          ? "blur-sm opacity-40"
                          : item.blurLevel === 2
                            ? "blur-[1px] opacity-60"
                            : item.blurLevel === 1
                              ? "opacity-80"
                              : ""
                      }`}
                    >
                      {item.quarterDisplay}
                    </div>
                    <div
                      className={`text-xs text-[#7B7B7B] mt-1 ${
                        item.blurLevel === 3
                          ? "blur-sm opacity-40"
                          : item.blurLevel === 2
                            ? "blur-[1px] opacity-60"
                            : item.blurLevel === 1
                              ? "opacity-80"
                              : ""
                      }`}
                    >
                      {item.professorName.split(" ").slice(-1)[0]}
                    </div>
                  </Link>
                ) : item.type === "current" ? (
                  <div>
                    <div className="text-sm font-semibold text-[#5FA3CF]">
                      {item.quarterDisplay}
                    </div>
                    <div className="text-xs text-[#181818] mt-1 font-medium">
                      {item.professorName.split(" ").slice(-1)[0]}
                    </div>
                  </div>
                ) : (
                  <div className="cursor-pointer hover:text-[#5FA3CF] transition-colors">
                    <div className="text-sm font-semibold text-[#7B7B7B]">
                      {item.quarterDisplay}
                    </div>
                    <div className="text-xs text-[#7B7B7B] mt-1">
                      Predict Prof
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Timeline line - positioned to go through the center of the dots */}
        <div className="absolute top-2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#7B7B7B] via-[#5FA3CF] to-[#7B7B7B]"></div>

        {/* Labels below timeline */}
        <div className="flex justify-between mt-2 text-xs text-[#7B7B7B]">
          <Link
            to="/quarter-timeline"
            className="hover:text-[#5FA3CF] transition-colors"
          >
            View Previous Quarters
          </Link>
          <span className="cursor-pointer hover:text-[#5FA3CF] transition-colors">
            Predict Next Quarter
          </span>
        </div>
      </div>
    </div>
  );
};

export default CourseTimeline;
