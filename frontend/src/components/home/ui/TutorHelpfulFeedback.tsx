import React, { useState } from "react";
import posthog from "posthog-js";

interface TutorHelpfulFeedbackProps {
  courseId: string;
}

const TutorHelpfulFeedback: React.FC<TutorHelpfulFeedbackProps> = ({
  courseId,
}) => {
  const [feedback, setFeedback] = useState<null | "up" | "down">(null);
  return (
    <div className="flex flex-col items-center mt-6">
      <span className="text-base font-semibold mb-2">Was this helpful?</span>
      {feedback ? (
        <span className="text-green-700 font-medium">
          Thank you for your feedback!
        </span>
      ) : (
        <div className="flex gap-4">
          <button
            aria-label="Thumbs up"
            className="p-2 rounded-full bg-green-100 hover:bg-green-200 text-green-700 text-2xl transition"
            onClick={() => {
              posthog.capture("find_tutor_helpful", { course_id: courseId });
              setFeedback("up");
            }}
          >
            <span role="img" aria-label="Thumbs up">
              👍
            </span>
          </button>
          <button
            aria-label="Thumbs down"
            className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-700 text-2xl transition"
            onClick={() => {
              posthog.capture("find_tutor_not_helpful", {
                course_id: courseId,
              });
              setFeedback("down");
            }}
          >
            <span role="img" aria-label="Thumbs down">
              👎
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default TutorHelpfulFeedback;
