import { gunzipSync, strFromU8 } from "fflate";
import posthog from "posthog-js";
import { API_ALL_COURSES_URL } from "./base";

export async function fetchAllCourses() {
  posthog.capture("fetch_courses_requested", { API_ALL_COURSES_URL });

  try {
    const response = await fetch(API_ALL_COURSES_URL);

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    // First, try the easy path: assume it was auto-decompressed
    try {
      return await response.json();
    } catch {
      console.warn(
        "Normal JSON parsing failed, attempting manual decompression.",
      );
      // If that failed, manually decompress
      const arrayBuffer = await response.arrayBuffer();
      const compressed = new Uint8Array(arrayBuffer);
      const decompressed = gunzipSync(compressed);
      const jsonString = strFromU8(decompressed);

      return JSON.parse(jsonString);
    }
  } catch (error) {
    console.error("Fetch error:", error);
    posthog.capture("failed_fetch_courses_requested", { error_message: error });

    throw error;
  }
}
