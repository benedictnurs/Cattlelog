export const colors: string[] = [
  "#987CDB",
  "#E56B6F",
  "#6F98DB",
  "#F5B971",
  "#77DD77",
  "#FFB347",
  "#AEC6CF",
  "#B39EB5",
  "#FF6961",
  "#779ECB",
  "#FF99C8",
  "#C23B22",
  "#03C03C",
  "#966FD6",
  "#CB99C9",
  "#B19CD9",
  "#F49AC2",
  "#C2B280",
  "#B0E57C",
  "#FFBF00",
  "#E0B0FF",
  "#F5DEB3",
  "#99E1D9",
  "#FFD1DC",
  "#A9A9A9",
  "#DEA5A4",
  "#F7CAC9",
  "#98FB98",
  "#FFDAB9",
  "#FFB3BA",
];

/** Convert a GPA number into a letter grade, if you need it. */
export function getLetterGrade(gpa: number | null | undefined): string {
  if (gpa == null || gpa < 0) return "";
  if (gpa >= 4.0) return "A";
  if (gpa >= 3.7) return "A-";
  if (gpa >= 3.3) return "B+";
  if (gpa >= 3.0) return "B";
  if (gpa >= 2.7) return "B-";
  if (gpa >= 2.3) return "C+";
  if (gpa >= 2.0) return "C";
  if (gpa >= 1.7) return "C-";
  if (gpa >= 1.3) return "D+";
  if (gpa >= 1.0) return "D";
  if (gpa >= 0.7) return "D-";
  return "F";
}

/**
 * Given an ordered list of series-keys (quarter IDs or professor IDs),
 * return a map from key → color (cycling through your palette).
 */
export function makeColorMap(keys: string[]): Record<string, string> {
  return keys.reduce<Record<string, string>>((map, key, i) => {
    map[key] = colors[i % colors.length];
    return map;
  }, {});
}

export interface SeriesRow {
  id: string;
  grades: Record<string, number>;
}

/**
 * Builds the chart data array for Recharts.
 *
 * It expects `quarterData` (or professor items) each having:
 *    quarterItem.grades     => { "A": num, "B": num, ... }
 *    quarterItem.id  => unique string key
 */
export function buildChartData(
  courseGrades: { [grade: string]: number } | null,
  series: SeriesRow[],
): Array<Record<string, number | string>> {
  // Sum up all overall counts
  let overallTotal = 0;
  if (courseGrades) {
    for (const g of Object.keys(courseGrades)) {
      overallTotal += courseGrades[g];
    }
  }

  // For each quarter, sum up its total of all letter grades
  const quarterTotals: Record<string, number> = {};
  series.forEach((item) => {
    let sum = 0;
    if (item.grades) {
      for (const g of Object.keys(item.grades)) {
        sum += item.grades[g];
      }
    }
    quarterTotals[item.id] = sum;
  });

  // For each letter grade, build a row with "default" = fraction of total
  // plus each quarter's fraction
  return Object.keys(courseGrades || {}).map((grade) => {
    const row: Record<string, number | string> = { name: grade };
    const courseGradeCount = courseGrades?.[grade] || 0;

    // Normalized fraction for the entire course
    row.default = overallTotal > 0 ? courseGradeCount / overallTotal : 0;

    // Normalized fraction for each quarter
    series.forEach((item) => {
      const countForThisQuarter = item.grades?.[grade] || 0;
      const totalForThisQuarter = quarterTotals[item.id] || 0;
      row[item.id] =
        totalForThisQuarter > 0 ? countForThisQuarter / totalForThisQuarter : 0;
    });

    return row;
  });
}
