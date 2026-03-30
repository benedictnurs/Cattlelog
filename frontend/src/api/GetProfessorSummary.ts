import posthog from "posthog-js";
import { API_BASE_URL } from "./base";

// Create a cache object to store results of previous API calls
const professorSummaryCache: Record<string, any> = {};

/**
 * Generate AI summary from professor data by sending it to the backend.
 * This function accepts the raw professor data from fetchProfessor() and extracts
 * the necessary information to send to the summarization endpoint.
 *
 * @param professorData - The complete professor data object from fetchProfessor()
 * @returns Promise containing the AI-generated summary
 */
export const fetchProfessorSummary = async (professorData: any) => {
  if (!professorData) {
    return { summary: null };
  }

  const identifier = professorData.professor_id || professorData.professor_slug;

  // Check if the result is already in the cache
  if (professorSummaryCache[identifier]) {
    posthog.capture("professor_summary_requested", {
      identifier,
      cache: true,
    });
    return professorSummaryCache[identifier];
  }

  posthog.capture("professor_summary_requested", {
    identifier,
    cache: false,
  });

  try {
    // Extract professor info for the AI
    const professorInfo = {
      name: professorData.professor_name,
      department: professorData.department,
      overall_rating: professorData.overall_rating,
      level_of_difficulty: professorData.level_of_difficulty,
    };

    // Extract all review texts from all classes
    const reviews: string[] = [];
    if (professorData.classes && Array.isArray(professorData.classes)) {
      professorData.classes.forEach((classItem: any) => {
        if (classItem.reviews && Array.isArray(classItem.reviews)) {
          classItem.reviews.forEach((review: any) => {
            if (review.review && typeof review.review === "string") {
              reviews.push(review.review);
            }
          });
        }
      });
    }

    // If no reviews, return early
    if (reviews.length === 0) {
      const noReviewsResult = { summary: null };
      professorSummaryCache[identifier] = noReviewsResult;
      return noReviewsResult;
    }

    // Send POST request to the summarization endpoint
    const response = await fetch(
      `${API_BASE_URL}/api/professors/summarize_professor`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          professor_info: professorInfo,
          reviews: reviews,
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to generate professor summary.");
    }

    const data = await response.json();

    // Store the result in the cache
    professorSummaryCache[identifier] = data;

    return data;
  } catch (error) {
    console.error("Error generating professor summary:", error);
    posthog.capture("failed_professor_summary_requested", {
      identifier,
      error_message: error,
    });
    throw error;
  }
};
