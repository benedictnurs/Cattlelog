import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { ActionMeta, MultiValue, SingleValue } from "react-select";
import { Slider } from "../ui/slider";
import getCourseCodes from "../utils/course_codes";
import { usePostHog } from "posthog-js/react";

// Mobile-specific Select styles
const MOBILE_SELECT_STYLES = {
  control: (base: any) => ({
    ...base,
    borderRadius: 6,
    backgroundColor: "#EBEBEB",
    border: "none",
    boxShadow: "none",
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: 6,
    backgroundColor: "#EBEBEB",
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
  placeholder: (base: any) => ({
    ...base,
    color: "#C7C7C7",
  }),
};

const MOBILE_UNIT_SELECT_STYLES = {
  control: (base: any) => ({
    ...base,
    backgroundColor: "#EBEBEB",
    border: "none",
    boxShadow: "none",
    borderRadius: 6,
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: "#EBEBEB",
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused ? "#d6d6d6" : "#EBEBEB",
  }),
  placeholder: (base: any) => ({
    ...base,
    color: "#C7C7C7",
  }),
  singleValue: (base: any) => ({
    ...base,
  }),
};

const MOBILE_GE_SELECT_STYLES = {
  menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
  control: (base: any) => ({
    ...base,
    backgroundColor: "#EBEBEB",
    border: "none",
    boxShadow: "none",
    borderRadius: 6,
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: "#EBEBEB",
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused ? "#d6d6d6" : "#EBEBEB",
  }),
  placeholder: (base: any) => ({
    ...base,
    color: "#888",
  }),
  multiValue: (base: any) => ({
    ...base,
    backgroundColor: "#d6d6d6",
    borderRadius: "0.375rem",
  }),
  multiValueLabel: (base: any) => ({
    ...base,
    fontWeight: "500",
  }),
  multiValueRemove: (base: any) => ({
    ...base,
    ":hover": { color: "white" },
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

const topicalBreadthOptions = [
  { value: "AH", label: "AH" },
  { value: "SS", label: "SS" },
  { value: "SE", label: "SE" },
];

const coreLiteraciesOptions = [
  { value: "ACGH", label: "ACGH" },
  { value: "DD", label: "DD" },
  { value: "OL", label: "OL" },
  { value: "QL", label: "QL" },
  { value: "SL", label: "SL" },
  { value: "VL", label: "VL" },
  { value: "WC", label: "WC" },
  { value: "WE", label: "WE" },
];

interface MobileFilterProps {
  isMobileFilter: boolean;
  onRequestClose?: () => void;

  selectedGEs: string[];
  selectedUnits: number | null;
  selectedCourseLevel: CourseLevel;
  selectedCourseNumber: string;
  selectedCoursePrefixOption: SelectOption[] | null;
  searchTerm: string;

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
  onSearchTermChange: (term: string) => void;
  onClearFilters: () => void;

  averageRatingRange: [number, number] | null;
  onChangeAverageRatingRange: (range: [number, number] | null) => void;
  averageGpaRange: [number, number] | null;
  onChangeAverageGpaRange: (range: [number, number] | null) => void;

  isMobileApplied: boolean;
}

const MobileFilter: React.FC<MobileFilterProps> = ({
  isMobileFilter,
  onRequestClose,
  selectedGEs,
  selectedUnits,
  selectedCourseLevel,
  selectedCourseNumber,
  selectedCoursePrefixOption,
  searchTerm,
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
  onSearchTermChange,
  onClearFilters,
  averageRatingRange,
  onChangeAverageRatingRange,
  averageGpaRange,
  onChangeAverageGpaRange,
  isMobileApplied,
}) => {
  const posthog = usePostHog();
  const touchStartY = useRef<number | null>(null);
  const touchLastY = useRef<number | null>(null);
  const TOUCH_THRESHOLD = 60; // px to trigger close on upward swipes
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const gestureStartAtBottom = useRef<boolean>(false);

  const unitOptionsWithAny: UnitOption[] = [
    { value: null, label: "-" },
    ...unitOptions,
  ];

  const mobileNumberOptions: { value: CourseLevel | ""; label: string }[] = [
    { value: "", label: "-" },
    ...levelOptions.map((o) => ({ value: o.value, label: o.label })),
  ];

  const selectedTopicalBreadth = topicalBreadthOptions.filter((opt) =>
    selectedGEs.includes(opt.value),
  );

  const selectedCoreLiteracies = coreLiteraciesOptions.filter((opt) =>
    selectedGEs.includes(opt.value),
  );

  const handleCoursePrefixChange = (selected: SingleValue<SelectOption>) => {
    onCoursePrefixChange(selected ? [selected] : null);
    posthog.capture("filters_course_prefix_change", { selected });
  };

  const onSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    posthog.capture("filters_search_changed", { value });
    onSearchTermChange(value);
  };

  const handleUnitChange = (opt: SingleValue<UnitOption>) => {
    onSelectedUnitsChange(opt ? opt.value : null);
  };

  const handleClearAll = () => {
    posthog.capture("filters_cleared");
    onChangeAverageRatingRange([1, 5]);
    onChangeAverageGpaRange([0, 4]);
    onChangeSort("none");
    onChangeOffered(false);
    onChangeNoPrereqs(false);
    onSelectedUnitsChange(null);
    onClearFilters();
    onSearchTermChange("");
    posthog.capture("filters_search_cleared", { source: "mobile_clear" });
  };

  const handleGESelectChange = (
    updatedOptions: MultiValue<SelectOption>,
    category: "topical" | "core",
  ) => {
    const otherValues =
      category === "topical"
        ? selectedGEs.filter(
            (v) => !topicalBreadthOptions.some((o) => o.value === v),
          )
        : selectedGEs.filter(
            (v) => !coreLiteraciesOptions.some((o) => o.value === v),
          );

    const newValues = [
      ...otherValues,
      ...updatedOptions.map((opt) => opt.value),
    ];
    onGEUnitsChange(newValues);
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

  return (
    <div className="block lg:hidden">
      <AnimatePresence initial={false}>
        {isMobileFilter && (
          <motion.div
            ref={scrollAreaRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-10 border-t"
            style={{
              maxHeight: "80dvh",
              overflowY: "auto",
              overflowX: "hidden",
              overscrollBehavior: "contain",
              touchAction: "pan-y",
            }}
            onTouchStart={(e) => {
              const y = e.touches[0]?.clientY ?? null;
              touchStartY.current = y;
              touchLastY.current = y;
              const el = scrollAreaRef.current;
              if (el) {
                const atBottomStart =
                  Math.ceil(el.scrollTop + el.clientHeight) >=
                  el.scrollHeight - 1;
                gestureStartAtBottom.current = atBottomStart;
              } else {
                gestureStartAtBottom.current = true;
              }
            }}
            onTouchMove={(e) => {
              touchLastY.current = e.touches[0]?.clientY ?? touchLastY.current;
            }}
            onTouchEnd={() => {
              const start = touchStartY.current;
              const end = touchLastY.current;
              const delta = start !== null && end !== null ? start - end : 0;
              if (
                start !== null &&
                end !== null &&
                delta > TOUCH_THRESHOLD &&
                gestureStartAtBottom.current
              ) {
                onRequestClose?.();
              }
              // reset
              touchStartY.current = null;
              touchLastY.current = null;
              gestureStartAtBottom.current = false;
            }}
          >
            <div className="pt-6">
              {/* Mobile search + Clear */}
              <div className="flex justify-between items-center space-x-11">
                <input
                  type="text"
                  inputMode="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={onSearchInput}
                  className="p-2 w-full placeholder-[#C7C7C7] bg-[#EBEBEB] rounded-[6px] text-[14px] border focus:outline-none focus:border-gray-500"
                />
                <button
                  onClick={handleClearAll}
                  className={` self-start text-[14px] ${
                    isMobileApplied ? "text-header_primary" : "text-black"
                  } font-normal`}
                >
                  Clear
                </button>
              </div>

              <label className="block text-gray-800 font-normal mb-1.5 mt-4">
                Course Filters
              </label>

              {/* Prefix, Number, Units */}
              <div className="grid grid-cols-[.35fr_.4fr_.25fr] gap-3">
                {/* Prefix */}
                <div>
                  <label className="block text-[#747474] text-sm mb-1.5">
                    Prefix
                  </label>
                  <Select
                    id="m-course-prefix"
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
                    styles={MOBILE_SELECT_STYLES}
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
                        ? `m-num-${selectedCourseNumber}`
                        : `m-lvl-${selectedCourseLevel}`
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
                      const alnum = raw
                        .replace(/[^0-9a-z]/gi, "")
                        .toUpperCase();
                      const digits = alnum.replace(/[^0-9]/g, "");
                      if (!digits) return;
                      const n = parseInt(digits, 10);
                      // Map typed number to a level when in range
                      if (!Number.isNaN(n)) {
                        if (n >= 1 && n <= 99)
                          onCourseLevelChange("lower division");
                        else if (n >= 100 && n <= 199)
                          onCourseLevelChange("upper division");
                        else if (n >= 200 && n <= 299)
                          onCourseLevelChange("grad");
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
                    styles={MOBILE_SELECT_STYLES}
                  />
                </div>

                {/* Units */}
                <div>
                  <label className="block text-[#747474] text-sm mb-1.5">
                    Units
                  </label>
                  <Select
                    key={
                      selectedUnits == null
                        ? "m-units-null"
                        : `m-units-${selectedUnits}`
                    }
                    className="w-full"
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
                    isSearchable={false}
                    placeholder="#"
                    styles={MOBILE_UNIT_SELECT_STYLES}
                  />
                </div>
              </div>

              {/* Average Rating & GPA */}
              <div className="grid grid-cols-1 gap-4 mt-4">
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
              {/* GE Options */}
              <h2 className="mt-3">GE Filters</h2>
              <div className="flex justify-between flex-row space-x-5 mt-2">
                {/* Topical Breadth */}
                <div className="w-[150px]">
                  <label className="block text-[#747474] text-sm mb-2">
                    Topical Breadth
                  </label>
                  <Select
                    isMulti
                    options={topicalBreadthOptions}
                    value={selectedTopicalBreadth}
                    onChange={(opts) => handleGESelectChange(opts, "topical")}
                    placeholder=""
                    menuPortalTarget={document.body}
                    isSearchable={false}
                    styles={MOBILE_GE_SELECT_STYLES}
                  />
                </div>

                {/* Core Literacies */}
                <div className="w-[150px]">
                  <label className="block text-[#747474] text-sm mb-2">
                    Core Literacies
                  </label>
                  <Select
                    isMulti
                    options={coreLiteraciesOptions}
                    value={selectedCoreLiteracies}
                    onChange={(opts) => handleGESelectChange(opts, "core")}
                    placeholder=""
                    menuPortalTarget={document.body}
                    isSearchable={false}
                    styles={MOBILE_GE_SELECT_STYLES}
                  />
                </div>
              </div>

              {/* Sort and Filter Options */}
              <div className="mt-3 text-sm mb-3">
                <div className="space-y-3">
                  {/* Sort by Highest Rating */}
                  <label className="flex items-center text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sort === "rating"}
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        onChangeSort(
                          enabled
                            ? "rating"
                            : sort === "rating"
                              ? "none"
                              : sort,
                        );
                        posthog.capture("sort_changed", {
                          sort: enabled ? "rating" : "none",
                        });
                      }}
                      className="mr-3 appearance-none w-4 h-4 rounded-none bg-gray-200 checked:bg-gray-600 cursor-pointer transition"
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
                        onChangeSort(
                          enabled ? "gpa" : sort === "gpa" ? "none" : sort,
                        );
                        posthog.capture("sort_changed", {
                          sort: enabled ? "gpa" : "none",
                        });
                      }}
                      className="mr-3 appearance-none w-4 h-4 rounded-none bg-gray-200 checked:bg-gray-600 cursor-pointer transition"
                    />
                    Sort by Highest GPA
                  </label>

                  {/* Show Fall 2025 Classes */}
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
                      className="mr-3 appearance-none w-4 h-4 rounded-none bg-gray-200 checked:bg-gray-600 cursor-pointer transition"
                    />
                    Show Fall 2025 Classes
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
                      className="mr-3 appearance-none w-4 h-4 rounded-none bg-gray-200 checked:bg-gray-600 cursor-pointer transition"
                    />
                    Show Classes with No Prerequisites
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileFilter;
