import posthog from "posthog-js";
import { API_BASE_URL } from "./base";

// Create a cache object to store results of previous API calls
const courseSummaryCache: Record<string, any> = {};

// API Helper Function
export const fetchCourseInfo = async (course_id: string) => {
  // Check if the result is already in the cache
  if (courseSummaryCache[course_id]) {
    posthog.capture("course_info_requested", {
      course_id,
      cache: true,
    });
    return courseSummaryCache[course_id];
  }

  posthog.capture("course_info_requested", {
    course_id,
    cache: false,
  });
  try {
    const response = await fetch(`${API_BASE_URL}/api/courses/${course_id}`);

    if (!response.ok) {
      throw new Error("Failed to fetch course data.");
    }

    const data = await response.json();
    // Store the result in the cache
    courseSummaryCache[course_id] = data;
    return data;
  } catch (error) {
    console.error("Error fetching course data:", error);
    posthog.capture("failed_course_info_requested", {
      error_message: error,
    });
    throw error;
  }
};
