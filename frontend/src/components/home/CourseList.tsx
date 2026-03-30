import React from "react";
import { parseRating, ratingBgColor, displayRating } from "../../utils/rating";

interface CoursesProps {
  code: string;
  title: string;
  ge: string[];
  units: number;
  rating: number | null;
  isSelected: boolean;
  onClick: () => void;
  overall_gpa?: number | null;
}

const Courses: React.FC<CoursesProps> = ({
  code,
  title,
  ge,
  units,
  rating,
  isSelected,
  onClick,
  overall_gpa,
}) => {
  const ratingNum = parseRating(rating);
  const ratingClass = ratingBgColor(rating);
  const text = displayRating(ratingNum, 1);
  const geList = Array.isArray(ge) ? ge : [];

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer transition duration-100 hover:brightness-[.96] my-[2.5px] ${
        isSelected ? "bg-[#D9D9D9]" : "bg-[#F6F6F6]"
      }`}
    >
      <div className="flex w-full justify-between py-[13px] px-10 sm:py-4 sm:px-6">
        <div className="mr-3">
          <h1 className="font-bold">{code}</h1>
          <p className="text-[13px] py-1">{title}</p>
          {overall_gpa != null && Number.isFinite(overall_gpa) && (
            <p className="text-xs text-gray-600">
              Average GPA: {overall_gpa.toFixed(2)}
            </p>
          )}
          <div className="flex gap-0.5">
            {geList.map((type, index) => (
              <span key={index} className="text-black text-opacity-50 text-xs">
                {type}
                {index < geList.length - 1 ? "," : ""}
              </span>
            ))}
          </div>
          <p className="text-black text-opacity-50 text-xs">{units} units</p>
        </div>
        <div
          className={`w-9 h-9 flex items-center justify-center text-white font-semibold leading-none rounded-[4px] sm:rounded-md p-0 flex-shrink-0 ${ratingClass}`}
        >
          <span className="text-[18px] sm:text-base">{text}</span>
        </div>
      </div>
    </div>
  );
};

export default Courses;
