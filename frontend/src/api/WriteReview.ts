import posthog from "posthog-js";
import { API_BASE_URL } from "./base";

export async function writeReview(
  course_id: string,
  professor_name: string,
  term: string | null = null,
  email: string | null = null,
  quality_rating: number,
  difficulty_rating: number,
  review: string,
  tags: string[] | null = null,
  date: string | null = null,
  grade: string | null = null,
) {
  posthog.capture("write_review_requested", {
    course_id,
    professor_name,
    term,
    email,
    quality_rating,
    difficulty_rating,
    review,
    tags,
    date,
    grade,
  });

  try {
    const response = await fetch(`${API_BASE_URL}/api/reviews/cattlelog`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        course_id,
        professor_name,
        term: term || null,
        email: email || null,
        quality_rating,
        difficulty_rating,
        review,
        tags: tags || [],
        date: date || new Date().toISOString(),
        grade: grade || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error writing review: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error in writeReview:", error);
    posthog.capture("failed_write_review_requested");
    throw error;
  }
}
