import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

export function CourseSkeletonRow() {
  return (
    <div className="my-[2.5px]">
      <div className="h-[140px] rounded-xl bg-white px-6 animate-pulse">
        <div className="flex items-start justify-between gap-4 h-full">
          <div className="flex-1 space-y-3 self-center">
            <div className="h-4 w-28 rounded bg-gray-200" />
            <div className="h-5 w-4/5 rounded bg-gray-200" />
            <div className="flex gap-2">
              <div className="h-4 w-16 rounded bg-gray-200" />
              <div className="h-4 w-20 rounded bg-gray-200" />
            </div>
          </div>
          <div className="h-9 w-9 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

export default function SkeletonCoursesList({
  count = 12,
  estimate = 145,
  className = "",
}: {
  count?: number;
  estimate?: number;
  className?: string;
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimate,
    overscan: 12,
  });

  return (
    <div
      ref={parentRef}
      className={["absolute inset-0 overflow-y-auto", className].join(" ")}
      aria-busy="true"
      aria-live="polite"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((v) => (
          <div
            key={v.key}
            data-index={v.index}
            ref={rowVirtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${v.start}px)`,
            }}
          >
            <CourseSkeletonRow />
          </div>
        ))}
      </div>
    </div>
  );
}
