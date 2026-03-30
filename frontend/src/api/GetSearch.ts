import posthog from "posthog-js";
import { API_BASE_URL } from "./base";

// Fetches professors based on a search term
export async function searchProfessors(searchTerm: string) {
  posthog.capture("fetch_professors_requested", { searchTerm });
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/search/professors?search_term=${encodeURIComponent(searchTerm)}`,
    );
    if (!response.ok) {
      throw new Error(`Error fetching professors: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch error in searchProfessors:", error);
    throw error; // Rethrow error for caller to handle
  }
}

// Fetches courses based on a search term
export async function searchCourses(searchTerm: string) {
  posthog.capture("fetch_courses_requested", { searchTerm });
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/search/courses?search_term=${encodeURIComponent(searchTerm)}`,
    );
    if (!response.ok) {
      throw new Error(`Error fetching courses: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch error in searchCourses:", error);
    throw error; // Rethrow error for caller to handle
  }
}

// Fetches grade courses based on a search term
export async function searchGradeCourses(searchTerm: string) {
  posthog.capture("fetch_grade_courses_requested", { searchTerm });
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/search/grades/courses?search_term=${encodeURIComponent(searchTerm)}`,
    );
    if (!response.ok) {
      throw new Error(`Error fetching grade courses: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Fetch error in searchGradeCourses:", error);
    throw error; // Rethrow error for caller to handle
  }
}
