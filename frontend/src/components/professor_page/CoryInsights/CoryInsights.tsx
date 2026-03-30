import React, { useMemo } from "react";
import { Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";

interface CorysInsightsProps {
  summary?: string;
  onFeedback?: (isPositive: boolean) => void;
  feedbackGiven?: boolean | null;
  showFeedback?: boolean;
}

export const useParseSummary = (summary?: string) => {
  return useMemo(() => {
    const summaryText = summary || "";

    // Split summary into sentences
    const sentences = summaryText.split(/\.\s+/);
    if (sentences.length === 0) {
      return { badge: null, text: summaryText, color: "yellow" as const };
    }

    const firstSentence = sentences[0].trim();
    const remainingText = sentences.slice(1).join(". ").trim();

    // Determine badge color based on recommendation
    const lowerFirst = firstSentence.toLowerCase();
    let badgeColor: "green" | "red" | "yellow";

    if (lowerFirst.startsWith("recommended")) {
      badgeColor = "green";
    } else if (
      lowerFirst.startsWith("not recommended") ||
      lowerFirst.startsWith("avoid")
    ) {
      badgeColor = "red";
    } else if (lowerFirst.startsWith("consider")) {
      badgeColor = "yellow";
    } else {
      // If no recommendation keyword found, show full summary without badge
      return { badge: null, text: summaryText, color: "yellow" as const };
    }

    return {
      badge: firstSentence,
      text: remainingText,
      color: badgeColor,
    };
  }, [summary]);
};

export const CorysInsights: React.FC<CorysInsightsProps> = ({
  summary,
  onFeedback,
  feedbackGiven = null,
  showFeedback = false,
}) => {
  const parsedSummary = useParseSummary(summary);

  if (!parsedSummary.badge && !parsedSummary.text) {
    return null;
  }

  return (
    <div className="mt-6 w-full">
      <div className="bg-gray-100 rounded-3xl border-t-4 border-t-transparent bg-clip-padding relative overflow-hidden">
        {/* Gradient top border */}
        <div
          className="absolute top-0 left-0 right-0 h-2"
          style={{
            background:
              "linear-gradient(90deg, rgb(26, 82, 118) 0%, rgb(84, 162, 180) 33%, rgb(62, 141, 64) 67%, rgb(228, 180, 61) 100%)",
          }}
        />

        <div className="p-5 px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div className="flex flex-wrap items-center gap-1">
              <Sparkles
                className="h-5 w-5 bg-clip-text text-transparent"
                fill="url(#cory-insights-star-gradient)"
              />
              <svg width="0" height="0">
                <defs>
                  <linearGradient
                    id="cory-insights-star-gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="rgb(26, 82, 118)" />
                    <stop offset="33%" stopColor="rgb(84, 162, 180)" />
                    <stop offset="67%" stopColor="rgb(62, 141, 64)" />
                    <stop offset="100%" stopColor="rgb(228, 180, 61)" />
                  </linearGradient>
                </defs>
              </svg>
              <h3 className="text-md font-semibold text-gray-900 mr-1">
                Cory's Insights:
              </h3>
              {parsedSummary.badge && (
                <span
                  className={`inline-flex items-center rounded-md px-3 py-1 text-xs font-semibold text-white ${
                    parsedSummary.color === "green"
                      ? "bg-rating_green"
                      : parsedSummary.color === "red"
                        ? "bg-rating_red"
                        : "bg-rating_yellow"
                  }`}
                >
                  {parsedSummary.badge}
                </span>
              )}
            </div>

            {/* Helpful buttons - hidden on mobile, shown on desktop when enabled */}
            {showFeedback && onFeedback && (
              <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-600 whitespace-nowrap">
                  Was this helpful?
                </span>
                <button
                  onClick={() => onFeedback(true)}
                  disabled={feedbackGiven !== null}
                  className={`flex items-center justify-center w-10 h-8 rounded-xl transition-colors ${
                    feedbackGiven === true
                      ? "bg-green-800"
                      : feedbackGiven === false
                        ? "opacity-50 cursor-not-allowed bg-rating_green"
                        : "bg-rating_green hover:bg-green-600"
                  }`}
                  aria-label="Helpful"
                >
                  <ThumbsUp className="h-4 w-4 text-white" fill="white" />
                </button>
                <button
                  onClick={() => onFeedback(false)}
                  disabled={feedbackGiven !== null}
                  className={`flex items-center justify-center w-10 h-8 rounded-xl transition-colors ${
                    feedbackGiven === false
                      ? "bg-red-800"
                      : feedbackGiven === true
                        ? "opacity-50 cursor-not-allowed bg-rating_red"
                        : "bg-rating_red hover:bg-red-600"
                  }`}
                  aria-label="Not helpful"
                >
                  <ThumbsDown className="h-4 w-4 text-white" fill="white" />
                </button>
              </div>
            )}
          </div>

          {/* Summary Text */}
          {parsedSummary.text && (
            <p className="text-[13px] sm:text-[16px] pb-1 text-gray-700 leading-relaxed">
              {parsedSummary.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
