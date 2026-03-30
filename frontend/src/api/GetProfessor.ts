import posthog from "posthog-js";
import { API_BASE_URL } from "./base";
// API Helper Function
export const fetchProfessor = async (identifier: string) => {
  posthog.capture("fetch_professor_requested", { identifier });
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/professors/${identifier}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch professor data.");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching professor data:", error);
    posthog.capture("failed_fetch_professor_requested", { identifier });
    throw error;
  }
};
