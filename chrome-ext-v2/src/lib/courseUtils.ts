import { Course } from '@/popup/App';
import { QUARTER_DATES } from './constants';

declare global {
  var cachedProfessors: any[];
}

globalThis.cachedProfessors = [];

chrome.runtime.sendMessage({ action: 'fetchProfessors' }, (response) => {
  globalThis.cachedProfessors = response;
});

// Finds professor data by matching first initial and last name
// Example name: "S. Saltzen"
export function getProfessor(name: string) {
  if (!name.includes('. ')) return null;

  let [firstInitial, lastName] = name.split('. ');
  if (lastName.includes(' ')) {
    const lastNameParts = lastName.split(' ');
    lastName = lastNameParts[lastNameParts.length - 1];
  }
  firstInitial = firstInitial.toLowerCase();
  lastName = lastName.toLowerCase();

  const professor = globalThis.cachedProfessors.find((p: any) => {
    const pNames = p.professor_name.split(' ');
    const pFirstInitial = pNames[0][0].toLowerCase();
    const pLastName = pNames[pNames.length - 1].toLowerCase();
    return pFirstInitial === firstInitial && pLastName === lastName;
  });
  return professor;
}

// Calculates estimated weekly study hours for a course
export function calculateWeeklyHours(
  course: Course,
  academicTerm: string | null
) {
  const courseUnits = parseInt(course.units);

  const hoursPerUnit = 3; // Carnegie Unit suggests 3 hours/week per unit
  const termLength = getTermLength(course, academicTerm);
  const hoursPerUnitPerTerm = hoursPerUnit * termLength;

  const courseLevel = getCourseLevel(course);
  const profFactor = calculateProfessorFactor(course);

  const weeklyHours =
    ((courseUnits * hoursPerUnitPerTerm) / termLength) *
    courseLevel *
    profFactor;

  return weeklyHours;
}

// Gets the number of weeks in the academic term
function getTermLength(course: Course, academicTerm: string | null): number {
  // Get number of weeks in term
  let termStartDate: Date;
  let termEndDate: Date;
  if (academicTerm && academicTerm in QUARTER_DATES) {
    termStartDate = new Date(
      QUARTER_DATES[academicTerm as keyof typeof QUARTER_DATES].start +
        'T00:00:00'
    );
    termEndDate = new Date(
      QUARTER_DATES[academicTerm as keyof typeof QUARTER_DATES].end +
        'T00:00:00'
    );
  } else {
    termStartDate = new Date();
    termEndDate = new Date(course.finalExamDate);
  }

  return (
    (termEndDate.getTime() - termStartDate.getTime()) /
    (1000 * 60 * 60 * 24 * 7)
  );
}

// Returns difficulty multiplier based on course level (100s, 200s, 300s)
function getCourseLevel(course: Course): number {
  let [dept, classCode, secCode] = course.shortTitle.split(' ');
  const classCodeNum = parseInt(classCode);

  if (classCodeNum < 100) return 1; // 100-199 are lower division
  if (classCodeNum < 200) return 1.1; // 200-299 are upper division
  return 1.3; // 300-399 are graduate level
}

// Adjusts workload based on professor rating (lower rating = more work)
function calculateProfessorFactor(course: Course) {
  const low = 0.85;
  const high = 1.25;
  if (!course.instructorRating) return (low + high) / 2;
  return clamp(1 + 0.08 * (3.5 - course.instructorRating), low, high);
}

// Keeps a number between min and max values
function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}