export type GradeCounts = Record<string, number>;

export type ColorMap = Record<string, string>;

export interface QuarterInfo {
  courseId?: string;
  id: string;
  quarter_id: string;
  quarter: string;
  year: string;
  grades: GradeCounts;
  average_gpa: number | null;
  professor_name?: string;
  slug?: string;
}

export interface ProfessorInfo {
  slug: string;
  professor_name: string;
  id: string;
  average_gpa: number | null;
  grades: GradeCounts | null;
  professor_quarter_data: QuarterInfo[];
}

export interface CourseInfo {
  course_title: string;
  grades: Record<string, number> | null;
  overall_gpa: number | null;
  professors: ProfessorInfo[];
  quarters?: QuarterInfo[];
}

export interface LandingCourseInfo {
  course_id: string;
  course_title: string;
  units: number;
  fulfillment_tags: string[];
  overall_grades: GradeCounts;
  overall_gpa: number;
  overall_enrolled: number;
  available_quarters: string[];
  professors: ProfessorInfo[];
  quarters?: QuarterInfo[];
}

export interface ProfessorCardsProps {
  courseOverallGpa: number | null;
  quarters: QuarterInfo[];
  selectedQuarterIds: string[];
  professorColorMap: ColorMap;
  courseId?: string;
}
