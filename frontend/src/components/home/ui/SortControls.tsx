type Sort = "none" | "rating" | "gpa";

type SortControlsProps = {
  sort: Sort;
  onChangeSort: (s: Sort) => void;
  offeredOnly: boolean;
  onChangeOffered: (v: boolean) => void;
  noPrereqsOnly: boolean;
  onChangeNoPrereqs: (v: boolean) => void;
};

export default function SortControls({
  sort,
  onChangeSort,
  offeredOnly,
  onChangeOffered,
  noPrereqsOnly,
  onChangeNoPrereqs,
}: SortControlsProps) {
  return (
    <div className="overflow-hidden space-y-3 sm:space-y-2.5 transition-all duration-300 mb-4">
      {/* Sorting toggle: Highest Rating */}
      <div className="flex items-center px-0 lg:px-5">
        <label className="flex items-center gap-3 lg:gap-2 text-[15px] lg:text-sm text-gray-700">
          <input
            type="checkbox"
            checked={sort === "rating"}
            onChange={(e) => {
              const enabled = e.target.checked;
              onChangeSort(
                enabled ? "rating" : sort === "rating" ? "none" : sort,
              );
            }}
            className="appearance-none w-[19px] h-[19px] sm:w-4 sm:h-4 rounded-none bg-gray-100 checked:bg-gray-600 cursor-pointer hover:brightness-[0.96] transition duration-100"
          />
          Sort by Highest Rating
        </label>
      </div>

      {/* Sorting toggle: Highest GPA */}
      <div className="flex items-center px-0 lg:px-5">
        <label className="flex items-center gap-3 lg:gap-2 text-[15px] lg:text-sm text-gray-700">
          <input
            type="checkbox"
            checked={sort === "gpa"}
            onChange={(e) => {
              const enabled = e.target.checked;
              onChangeSort(enabled ? "gpa" : sort === "gpa" ? "none" : sort);
            }}
            className="appearance-none w-[19px] h-[19px] sm:w-4 sm:h-4 rounded-none bg-gray-100 checked:bg-gray-600 cursor-pointer hover:brightness-[0.96] transition duration-100"
          />
          Sort by Highest GPA
        </label>
      </div>

      {/* Offered-only toggle */}
      <div className="flex items-center px-0 lg:px-5">
        <label className="flex items-center gap-3 lg:gap-2 text-[15px] lg:text-sm text-gray-700">
          <input
            type="checkbox"
            checked={offeredOnly}
            onChange={(e) => onChangeOffered(e.target.checked)}
            className="appearance-none w-[19px] h-[19px] sm:w-4 sm:h-4 rounded-none bg-gray-100 checked:bg-gray-600 cursor-pointer hover:brightness-[0.96] transition duration-100"
          />
          Show Winter 2026 Classes
        </label>
      </div>

      {/* No-prereqs toggle */}
      <div className="flex items-center px-0 lg:px-5">
        <label className="flex items-center gap-3 lg:gap-2 text-[15px] lg:text-sm text-gray-700">
          <input
            type="checkbox"
            checked={noPrereqsOnly}
            onChange={(e) => onChangeNoPrereqs(e.target.checked)}
            className="appearance-none w-[19px] h-[19px] sm:w-4 sm:h-4 rounded-none bg-gray-100 checked:bg-gray-600 cursor-pointer hover:brightness-[0.96] transition duration-100"
          />
          Show Classes with No Prerequisites
        </label>
      </div>
    </div>
  );
}
