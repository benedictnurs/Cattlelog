import React, { useState } from "react";
import { Link } from "react-router-dom";
import posthog from "posthog-js";

interface GradeButtonProps {
  courseId: string;
  onClick?: () => void;
}

const GradeButton: React.FC<GradeButtonProps> = ({ courseId, onClick }) => {
  const [hovered, setHovered] = useState(false);

  const handleClick = () => {
    posthog.capture("grade_distribution_viewed", {
      course_id: courseId,
    });
    if (onClick) onClick();
  };

  const desktopButton = (
    <Link to={`/grade/${courseId}`} rel="noopener noreferrer">
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center justify-center whitespace-nowrap px-4 py-2.5 text-xs sm:text-sm text-white transition-all duration-200"
        style={{
          borderRadius: 10,
          background: hovered
            ? "linear-gradient(90deg, #2b6ef0 0%, #563ce8 100%)"
            : "linear-gradient(90deg, #2966EB 0%, #4E46E4 100%)",
          boxShadow: "0 4px 11px 0 rgba(0, 0, 0, 0.25)",
          filter: hovered ? "brightness(1.06)" : undefined,
          transition: "background 200ms ease, filter 180ms ease",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        View Grade Distributions
      </button>
    </Link>
  );

  // Mobile button (hidden on desktop)

  const alternateButton = (
    <Link
      to={`/grade/${courseId}`}
      rel="noopener noreferrer"
      className="hidden"
    >
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center justify-center whitespace-nowrap px-4 py-2 text-[14px] text-white rounded-lg bg-[#15374D] hover:bg-[#1e4a63] transition-all duration-200"
        style={{ boxShadow: "0 4px 11px 0 rgba(0, 0, 0, 0.25)" }}
      >
        View Grade Distributions
      </button>
    </Link>
  );

  return (
    <>
      {desktopButton}
      {alternateButton}
    </>
  );
};

export default GradeButton;
