export interface Seating {
  open: number;
  reserved: number;
  waitlisted: number;
}

export interface Professor {
  professor_name: string;
  id: string;
  slug: string;
  overall_rating: string;
  overall_difficulty: string;
  review: string;
  common_tags: string[];
  is_teaching: boolean;
}

export interface Course {
  course_id: string;
  course_title: string;
  description: string;
  prerequisites: string;
  fulfillment_tags: string[];
  units: number;
  availability: Seating;
  average_overall_rating: number;
  highest_overall_rating: number;
  professors: Professor[];
  offered: boolean;
  average_gpa?: number;
}
