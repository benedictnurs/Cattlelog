import posthog from "posthog-js";
import { API_BASE_URL } from "./base";

// Create a cache object to store results of previous API calls
const teachingCache: Record<string, any> = {};

// API Helper Function
export const fetchIsTeaching = async (
  professor_ids: string[],
  course_id: string,
) => {
  // Generate a unique cache key
  const cacheKey = `${professor_ids.join(",")}-${course_id}`;

  // Check if the result is already in the cache
  if (teachingCache[cacheKey]) {
    console.log("Fetching teaching data from cache");
    posthog.capture("fetch_is_teaching_requested", {
      professor_ids,
      course_id,
      cache: true,
    });
    return teachingCache[cacheKey];
  }

  posthog.capture("fetch_is_teaching_requested", {
    professor_ids,
    course_id,
    cache: false,
  });

  try {
    const queryParams = professor_ids
      .map((id) => `identifiers=${encodeURIComponent(id)}`)
      .join("&");

    const response = await fetch(
      `${API_BASE_URL}/api/courses/${course_id}/is_teaching?${queryParams}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch data on teaching.");
    }

    const data = await response.json();
    // Store the result in the cache
    teachingCache[cacheKey] = data;
    return data;
  } catch (error) {
    console.error("Error fetching teaching data:", error);
    posthog.capture("failed_fetch_is_teaching_requested", {
      professor_ids,
      course_id,
    });
    throw error;
  }
};
