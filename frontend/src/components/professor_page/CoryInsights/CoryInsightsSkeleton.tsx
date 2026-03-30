import React from "react";
import { Sparkles } from "lucide-react";

const CoryInsightsSkeleton: React.FC = () => {
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
              {/* Skeleton badge */}
              <div className="animate-pulse">
                <div className="h-6 w-32 bg-gray-300 rounded-md"></div>
              </div>
            </div>
          </div>

          {/* Skeleton Summary Text */}
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-300 rounded w-full"></div>
            <div className="h-4 bg-gray-300 rounded w-11/12"></div>
            <div className="h-4 bg-gray-300 rounded w-4/5"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoryInsightsSkeleton;
