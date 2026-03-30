import React from "react";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { ActionMeta, SingleValue } from "react-select";
import { Slider } from "../ui/slider";
import getCourseCodes from "../utils/course_codes";
import { usePostHog } from "posthog-js/react";

// Shared Select component styles
const SELECT_STYLES = {
  control: (base: any) => ({
    ...base,
    borderRadius: 6,
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: 6,
  }),
  menuList: (base: any) => ({ ...base, borderRadius: 6 }),
  dropdownIndicator: (base: any) => ({
    ...base,
    padding: "1px",
  }),
  clearIndicator: (base: any) => ({
    ...base,
    display: "none",
  }),
};

interface SelectOption {
  value: string;
  label: string;
}

interface UnitOption {
  value: number | null;
  label: string;
}

const unitOptions: UnitOption[] = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5" },
];

type CourseLevel = "" | "lower division" | "upper division" | "grad";

type Sort = "none" | "rating" | "gpa";

const levelOptions: { value: CourseLevel; label: string }[] = [
  { value: "lower division", label: "001-099" },
  { value: "upper division", label: "100-199" },
  { value: "grad", label: "200-299" },
];

interface DesktopFilterProps {
  selectedGEs: string[];
  selectedUnits: number | null;
  selectedCourseLevel: CourseLevel;
  selectedCourseNumber: string;
  selectedCoursePrefixOption: SelectOption[] | null;

  sort: Sort;
  onChangeSort: (s: Sort) => void;
  offeredOnly: boolean;
  onChangeOffered: (v: boolean) => void;
  noPrereqsOnly: boolean;
  onChangeNoPrereqs: (v: boolean) => void;

  onGEUnitsChange: (selectedGE: string[]) => void;
  onSelectedUnitsChange: (units: number | null) => void;
  onCourseLevelChange: (level: CourseLevel) => void;
  onCourseNumberChange: (num: string | null) => void;
  onCoursePrefixChange: (prefixes: SelectOption[] | null) => void;
  onClearFilters: () => void;

  averageRatingRange: [number, number] | null;
  onChangeAverageRatingRange: (range: [number, number] | null) => void;
  averageGpaRange: [number, number] | null;
  onChangeAverageGpaRange: (range: [number, number] | null) => void;

  isFilterApplied: boolean;
}

const DesktopFilter: React.FC<DesktopFilterProps> = ({
  selectedGEs,
  selectedUnits,
  selectedCourseLevel,
  selectedCourseNumber,
  selectedCoursePrefixOption,
  sort,
  onChangeSort,
  offeredOnly,
  onChangeOffered,
  noPrereqsOnly,
  onChangeNoPrereqs,
  onGEUnitsChange,
  onSelectedUnitsChange,
  onCourseLevelChange,
  onCourseNumberChange,
  onCoursePrefixChange,
  onClearFilters,
  averageRatingRange,
  onChangeAverageRatingRange,
  averageGpaRange,
  onChangeAverageGpaRange,
  isFilterApplied,
}) => {
  const posthog = usePostHog();

  const unitOptionsWithAny: UnitOption[] = [
    { value: null, label: "-" },
    ...unitOptions,
  ];

  const mobileNumberOptions: { value: CourseLevel | ""; label: string }[] = [
    { value: "", label: "-" },
    ...levelOptions.map((o) => ({ value: o.value, label: o.label })),
  ];

  const handleCoursePrefixChange = (selected: SingleValue<SelectOption>) => {
    onCoursePrefixChange(selected ? [selected] : null);
    posthog.capture("filters_course_prefix_change", { selected });
  };

  const handleUnitChange = (opt: SingleValue<UnitOption>) => {
    onSelectedUnitsChange(opt ? opt.value : null);
  };

  const handleNumberSelectChange = (
    opt: SingleValue<{ value: string; label: string }>,
    meta: ActionMeta<{ value: string; label: string }>,
  ) => {
    // Handle clear or no selection
    if (meta.action === "clear" || !opt || opt.value === "") {
      onCourseLevelChange("");
      onCourseNumberChange(null);
      posthog.capture(
        opt?.value === ""
          ? "filters_number_any_selected"
          : "filters_number_cleared",
      );
      return;
    }

    const v = opt.value;
    if (v === "lower division" || v === "upper division" || v === "grad") {
      onCourseLevelChange(v as CourseLevel);
      onCourseNumberChange(null);
      posthog.capture("filters_level_changed", { opt });
    } else {
      const raw = opt.label || v;
      const alnum = (raw || "").replace(/[^0-9a-z]/gi, "").toUpperCase();
      onCourseNumberChange(alnum);
      posthog.capture("filters_number_selected_specific", {
        value: raw,
        alnum,
      });
    }
  };

  const handleGEChange = (option: string) => {
    const updatedGEs = selectedGEs.includes(option)
      ? selectedGEs.filter((ge) => ge !== option)
      : [...selectedGEs, option];

    onGEUnitsChange(updatedGEs);
    posthog.capture("filters_ge_changed", { option });
  };

  return (
    <div
      className="hidden lg:block h-full p-6 transition-transform duration-300 ease-in-out"
      style={{ backgroundColor: "#ebebeb" }}
    >
      <div className="flex justify-between items-center mb-3.5">
        <h2 className="text-xl font-semibold">Filter</h2>
        <button
          onClick={onClearFilters}
          className={`${
            isFilterApplied ? "text-header_primary" : "text-black"
          } font-normal`}
        >
          Clear
        </button>
      </div>
      <label className="block text-gray-800 font-normal mb-2">
        Course Filters
      </label>
      <div className="space-y-4">
        <div className="grid grid-cols-[.35fr_.4fr_.25fr] gap-2">
          {/* Prefix */}
          <div>
            <label className="block text-[#747474] text-sm mb-1.5">
              Prefix
            </label>
            <Select
              id="course-prefix"
              value={selectedCoursePrefixOption}
              onChange={handleCoursePrefixChange}
              options={getCourseCodes().map((code) => ({
                value: code,
                label: code,
              }))}
              isSearchable={true}
              isClearable={true}
              placeholder="XXX"
              className="text-sm"
              styles={SELECT_STYLES}
            />
          </div>

          {/* Number (Course Level) */}
          <div>
            <label className="block text-[#747474] text-sm mb-1.5">
              Number
            </label>
            <CreatableSelect
              key={
                selectedCourseNumber
                  ? `num-${selectedCourseNumber}`
                  : `lvl-${selectedCourseLevel}`
              }
              value={
                selectedCourseNumber
                  ? {
                      value: selectedCourseNumber,
                      label: selectedCourseNumber,
                    }
                  : selectedCourseLevel
                    ? (mobileNumberOptions.find(
                        (option) => option.value === selectedCourseLevel,
                      ) ?? null)
                    : null
              }
              onChange={handleNumberSelectChange}
              onCreateOption={(input) => {
                const raw = (input || "").trim();
                if (!raw) return;
                // alphanumeric for search (ex 122A), digits only for level mapping
                const alnum = raw.replace(/[^0-9a-z]/gi, "").toUpperCase();
                const digits = alnum.replace(/[^0-9]/g, "");
                if (!digits) return;
                const n = parseInt(digits, 10);
                // Map typed number to a level when in range
                if (!Number.isNaN(n)) {
                  if (n >= 1 && n <= 99) onCourseLevelChange("lower division");
                  else if (n >= 100 && n <= 199)
                    onCourseLevelChange("upper division");
                  else if (n >= 200 && n <= 299) onCourseLevelChange("grad");
                }
                onCourseNumberChange(alnum);
                posthog.capture("filters_number_created_specific", {
                  input: raw,
                  alnum,
                  digits,
                });
              }}
              options={mobileNumberOptions}
              isClearable={true}
              isSearchable={true}
              placeholder="###"
              formatCreateLabel={(input) => `Search "${input}"`}
              className="text-sm"
              styles={SELECT_STYLES}
            />
          </div>

          {/* Units */}
          <div>
            <label className="block text-[#747474] text-sm mb-1.5">Units</label>
            <Select
              key={
                selectedUnits == null ? "units-null" : `units-${selectedUnits}`
              }
              value={
                selectedUnits == null
                  ? null
                  : (unitOptionsWithAny.find(
                      (option) => option.value === selectedUnits,
                    ) ?? null)
              }
              onChange={handleUnitChange}
              options={unitOptionsWithAny}
              isClearable={false}
              isSearchable={true}
              placeholder="#"
              className="text-sm"
              styles={SELECT_STYLES}
            />
          </div>
        </div>

        {/* Average Rating & GPA */}
        <div className="grid grid-cols-1 gap-2">
          {/* GPA */}
          <div>
            <label className="block text-[#747474] text-sm">
              Average Course GPA
            </label>
            <div className="flex items-center gap-3 pl-1">
              <Slider
                min={0}
                max={4}
                step={0.1}
                value={averageGpaRange ?? [0, 4]}
                formatValue={(n) => n.toFixed(1)}
                onValueChange={(vals) => {
                  const a = Math.min(4, Math.max(0, vals[0] ?? 0));
                  const b = Math.min(4, Math.max(0, vals[1] ?? 4));
                  const v = [
                    Math.round(a * 10) / 10,
                    Math.round(b * 10) / 10,
                  ] as [number, number];
                  onChangeAverageGpaRange(v);
                  posthog.capture("filter_avg_gpa_range_changed", {
                    value: v,
                  });
                }}
              />
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-[#747474] text-sm">
              Average Course Rating
            </label>
            <div className="flex items-center gap-3 pl-1">
              <Slider
                min={1}
                max={5}
                step={0.1}
                value={averageRatingRange ?? [1, 5]}
                formatValue={(n) => n.toFixed(1)}
                onValueChange={(vals) => {
                  const v = [
                    Math.min(5, Math.max(1, vals[0] ?? 1)),
                    Math.min(5, Math.max(1, vals[1] ?? 5)),
                  ] as [number, number];
                  onChangeAverageRatingRange(v);
                  posthog.capture("filter_avg_rating_range_changed", {
                    value: v,
                  });
                }}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Sort and Filter Options */}
      <div className="mt-3 text-sm">
        <div className="space-y-3">
          {/* Sort by Highest Rating */}
          <label className="flex items-center text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={sort === "rating"}
              onChange={(e) => {
                const enabled = e.target.checked;
                onChangeSort(
                  enabled ? "rating" : sort === "rating" ? "none" : sort,
                );
                posthog.capture("sort_changed", {
                  sort: enabled ? "rating" : "none",
                });
              }}
              className="mr-2 flex-none shrink-0 appearance-none w-4 h-4 border border-gray-300 bg-white cursor-pointer transition
                            checked:bg-gray-700 checked:border-gray-700
                            [&:not(:checked):hover]:border-gray-400"
            />
            Sort by Highest Rating
          </label>

          {/* Sort by Highest GPA */}
          <label className="flex items-center text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={sort === "gpa"}
              onChange={(e) => {
                const enabled = e.target.checked;
                onChangeSort(enabled ? "gpa" : sort === "gpa" ? "none" : sort);
                posthog.capture("sort_changed", {
                  sort: enabled ? "gpa" : "none",
                });
              }}
              className="mr-2 flex-none shrink-0 appearance-none w-4 h-4 border border-gray-300 bg-white cursor-pointer transition
                            checked:bg-gray-700 checked:border-gray-700
                            [&:not(:checked):hover]:border-gray-400"
            />
            Sort by Highest GPA
          </label>

          {/* Show Current Taught Classes */}
          <label className="flex items-center text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={offeredOnly}
              onChange={(e) => {
                onChangeOffered(e.target.checked);
                posthog.capture("filter_offered_changed", {
                  value: e.target.checked,
                });
              }}
              className="mr-2 flex-none shrink-0 appearance-none w-4 h-4 border border-gray-300 bg-white cursor-pointer transition
                            checked:bg-gray-700 checked:border-gray-700
                            [&:not(:checked):hover]:border-gray-400"
            />
            Show Winter 2026 Classes
          </label>

          {/* Show Classes with No Prerequisites */}
          <label className="flex items-center text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={noPrereqsOnly}
              onChange={(e) => {
                onChangeNoPrereqs(e.target.checked);
                posthog.capture("filter_no_prereqs_changed", {
                  value: e.target.checked,
                });
              }}
              className="mr-2 flex-none shrink-0 appearance-none w-4 h-4 border border-gray-300 bg-white cursor-pointer transition
                            checked:bg-gray-700 checked:border-gray-700
                            [&:not(:checked):hover]:border-gray-400"
            />
            Show Classes with No Prerequisites
          </label>
        </div>
      </div>

      {/* GE filters */}
      <div className="mt-4 space-y-2">
        <label className="block text-gray-800 font-normal">GE Filters</label>
        <label className="block text-[#747474] text-sm">Topical Breadth</label>

        <div className="grid [grid-template-columns:repeat(auto-fit,minmax(80px,1fr))] gap-x-4 gap-y-3 text-sm">
          {["AH", "SS", "SE"].map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 text-gray-700 min-w-[80px]"
            >
              <input
                type="checkbox"
                className="flex-none shrink-0 appearance-none w-4 h-4 border border-gray-300 bg-white cursor-pointer transition
                            checked:bg-gray-700 checked:border-gray-700
                            [&:not(:checked):hover]:border-gray-400"
                checked={selectedGEs.includes(option)}
                onChange={() => handleGEChange(option)}
              />

              {option}
            </label>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <label className="block text-[#747474] text-sm">Core Literacies</label>
        <div className="grid [grid-template-columns:repeat(auto-fit,minmax(80px,1fr))] gap-x-4 gap-y-3 text-sm">
          {["ACGH", "DD", "OL", "QL", "SL", "VL", "WC", "WE"].map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 text-gray-700 min-w-[80px]"
            >
              <input
                type="checkbox"
                className="flex-none shrink-0 appearance-none w-4 h-4 border border-gray-300 bg-white cursor-pointer transition-colors
                            checked:bg-gray-700 checked:border-gray-700
                            [&:not(:checked):hover]:border-gray-400"
                checked={selectedGEs.includes(option)}
                onChange={() => handleGEChange(option)}
              />
              {option}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DesktopFilter;
