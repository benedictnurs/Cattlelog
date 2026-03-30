import React, { useEffect, useState } from "react";
import DesktopFilter from "./filter_components/DesktopFilter";
import MobileFilter from "./filter_components/MobileFilter";

interface SelectOption {
  value: string;
  label: string;
}

type CourseLevel = "" | "lower division" | "upper division" | "grad";

type Sort = "none" | "rating" | "gpa";

interface FilterProps {
  isMobileFilter: boolean;

  selectedGEs: string[];
  selectedUnits: number | null;
  selectedCourseLevel: CourseLevel;
  selectedCourseNumber: string;
  selectedCoursePrefixOption: SelectOption[] | null;
  searchTerm: string;

  // Sort & extra toggles
  sort: Sort;
  onChangeSort: (s: Sort) => void;
  offeredOnly: boolean;
  onChangeOffered: (v: boolean) => void;
  noPrereqsOnly: boolean;
  onChangeNoPrereqs: (v: boolean) => void;

  // Mobile interactions
  onRequestClose?: () => void;

  onGEUnitsChange: (selectedGE: string[]) => void;
  onSelectedUnitsChange: (units: number | null) => void;
  onCourseLevelChange: (level: CourseLevel) => void;
  onCourseNumberChange: (num: string | null) => void;
  onCoursePrefixChange: (prefixes: SelectOption[] | null) => void;
  onSearchTermChange: (term: string) => void;
  onClearFilters: () => void;

  // min average metrics
  averageRating?: number | null;
  onChangeAverageRating?: (n: number | null) => void;
  averageGpa?: number | null;
  onChangeAverageGpa?: (n: number | null) => void;
  averageRatingRange?: [number, number] | null;
  onChangeAverageRatingRange?: (range: [number, number] | null) => void;
  averageGpaRange?: [number, number] | null;
  onChangeAverageGpaRange?: (range: [number, number] | null) => void;
}

const Filter: React.FC<FilterProps> = ({
  isMobileFilter,
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
  onRequestClose,
  averageRating,
  onChangeAverageRating,
  averageGpa,
  onChangeAverageGpa,
  averageRatingRange,
  onChangeAverageRatingRange,
  averageGpaRange,
  onChangeAverageGpaRange,
}) => {
  const [localAvgRating, setLocalAvgRating] = useState<number | null>(
    typeof averageRating === "number" ? averageRating : null,
  );
  const [localAvgGpa, setLocalAvgGpa] = useState<number | null>(
    typeof averageGpa === "number" ? averageGpa : null,
  );
  const [localAvgRatingRange, setLocalAvgRatingRange] = useState<
    [number, number] | null
  >(averageRatingRange ?? null);
  const [localAvgGpaRange, setLocalAvgGpaRange] = useState<
    [number, number] | null
  >(averageGpaRange ?? null);

  // keep local state in sync when parent updates
  useEffect(() => {
    if (averageRating !== undefined) setLocalAvgRating(averageRating);
  }, [averageRating]);
  useEffect(() => {
    if (averageGpa !== undefined) setLocalAvgGpa(averageGpa);
  }, [averageGpa]);
  useEffect(() => {
    if (averageRatingRange !== undefined)
      setLocalAvgRatingRange(averageRatingRange ?? null);
  }, [averageRatingRange]);
  useEffect(() => {
    if (averageGpaRange !== undefined)
      setLocalAvgGpaRange(averageGpaRange ?? null);
  }, [averageGpaRange]);

  const currentRatingRange = averageRatingRange ?? localAvgRatingRange ?? null;
  const currentGpaRange = averageGpaRange ?? localAvgGpaRange ?? null;
  const ratingRangeIsDefault = !currentRatingRange;
  const gpaRangeIsDefault = !currentGpaRange;

  const isFilterApplied =
    !!selectedUnits ||
    !!selectedCourseLevel ||
    !!selectedCourseNumber ||
    (selectedCoursePrefixOption && selectedCoursePrefixOption.length > 0) ||
    (selectedGEs && selectedGEs.length > 0) ||
    sort !== "none" ||
    offeredOnly ||
    noPrereqsOnly ||
    typeof (averageRating ?? localAvgRating) === "number" ||
    typeof (averageGpa ?? localAvgGpa) === "number" ||
    !ratingRangeIsDefault ||
    !gpaRangeIsDefault;

  const isSearchApplied = (searchTerm ?? "").trim().length > 0;
  const isMobileApplied = isFilterApplied || isSearchApplied;

  const handleClearAll = () => {
    setLocalAvgRating(null);
    setLocalAvgGpa(null);
    onChangeAverageRating?.(null);
    onChangeAverageGpa?.(null);
    setLocalAvgRatingRange(null);
    setLocalAvgGpaRange(null);
    onChangeAverageRatingRange?.(null);
    onChangeAverageGpaRange?.(null);
    onChangeSort("none");
    onChangeOffered(false);
    onChangeNoPrereqs(false);
    onSelectedUnitsChange(null);
    onClearFilters();
  };

  const handleDesktopClearAll = () => {
    handleClearAll();
  };

  const handleAverageRatingRangeChange = (range: [number, number] | null) => {
    setLocalAvgRatingRange(range);
    onChangeAverageRatingRange?.(range);
  };

  const handleAverageGpaRangeChange = (range: [number, number] | null) => {
    setLocalAvgGpaRange(range);
    onChangeAverageGpaRange?.(range);
  };

  return (
    <>
      <DesktopFilter
        selectedGEs={selectedGEs}
        selectedUnits={selectedUnits}
        selectedCourseLevel={selectedCourseLevel}
        selectedCourseNumber={selectedCourseNumber}
        selectedCoursePrefixOption={selectedCoursePrefixOption}
        sort={sort}
        onChangeSort={onChangeSort}
        offeredOnly={offeredOnly}
        onChangeOffered={onChangeOffered}
        noPrereqsOnly={noPrereqsOnly}
        onChangeNoPrereqs={onChangeNoPrereqs}
        onGEUnitsChange={onGEUnitsChange}
        onSelectedUnitsChange={onSelectedUnitsChange}
        onCourseLevelChange={onCourseLevelChange}
        onCourseNumberChange={onCourseNumberChange}
        onCoursePrefixChange={onCoursePrefixChange}
        onClearFilters={handleDesktopClearAll}
        averageRatingRange={currentRatingRange}
        onChangeAverageRatingRange={handleAverageRatingRangeChange}
        averageGpaRange={currentGpaRange}
        onChangeAverageGpaRange={handleAverageGpaRangeChange}
        isFilterApplied={isFilterApplied}
      />

      <MobileFilter
        isMobileFilter={isMobileFilter}
        onRequestClose={onRequestClose}
        selectedGEs={selectedGEs}
        selectedUnits={selectedUnits}
        selectedCourseLevel={selectedCourseLevel}
        selectedCourseNumber={selectedCourseNumber}
        selectedCoursePrefixOption={selectedCoursePrefixOption}
        searchTerm={searchTerm}
        sort={sort}
        onChangeSort={onChangeSort}
        offeredOnly={offeredOnly}
        onChangeOffered={onChangeOffered}
        noPrereqsOnly={noPrereqsOnly}
        onChangeNoPrereqs={onChangeNoPrereqs}
        onGEUnitsChange={onGEUnitsChange}
        onSelectedUnitsChange={onSelectedUnitsChange}
        onCourseLevelChange={onCourseLevelChange}
        onCourseNumberChange={onCourseNumberChange}
        onCoursePrefixChange={onCoursePrefixChange}
        onSearchTermChange={onSearchTermChange}
        onClearFilters={onClearFilters}
        averageRatingRange={currentRatingRange}
        onChangeAverageRatingRange={handleAverageRatingRangeChange}
        averageGpaRange={currentGpaRange}
        onChangeAverageGpaRange={handleAverageGpaRangeChange}
        isMobileApplied={isMobileApplied}
      />
    </>
  );
};

export default Filter;
