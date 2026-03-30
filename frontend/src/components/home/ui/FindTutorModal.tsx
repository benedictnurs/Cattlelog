import React, { useState } from "react";
import posthog from "posthog-js";
import TutorHelpfulFeedback from "./TutorHelpfulFeedback";

interface FindTutorModalProps {
  courseId: string | undefined;
}

const FindTutorModal: React.FC<FindTutorModalProps> = ({ courseId }) => {
  const [showTutorPopup, setShowTutorPopup] = useState(false);
  if (!courseId || !courseId.startsWith("ECS")) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => {
          posthog.capture("find_tutor_button_clicked", { course_id: courseId });
          setShowTutorPopup(true);
        }}
        className="ml-3 px-4 py-2.5 text-xs sm:text-sm font-bold text-white rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 shadow-md relative overflow-visible focus:outline-none transition-all duration-300 hover:from-green-400 hover:to-emerald-500 hover:scale-105 active:scale-100"
        style={{
          boxShadow: "0 2px 8px 0 #22c55e22",
        }}
      >
        <span className="z-10 relative">Find Tutor</span>
      </button>
      {showTutorPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative bg-white rounded-2xl p-8 w-[90%] max-w-md shadow-xl flex flex-col gap-4 border-2 border-green-400">
            <button
              onClick={() => {
                posthog.capture("find_tutor_popup_closed", {
                  course_id: courseId,
                });
                setShowTutorPopup(false);
              }}
              className="absolute top-4 right-4 text-gray-700 text-2xl font-bold hover:text-green-500"
              aria-label="Close tutor popup"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-green-700 mb-2">
              Find a Tutor
            </h2>
            <div
              className="flex flex-col gap-4 max-h-96 overflow-y-auto pr-2"
              style={{ scrollbarGutter: "stable" }}
            >
              <div className="rounded-lg border border-green-200 p-4 bg-green-50 shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-lg text-green-900">
                    CS Tutoring Club at UC Davis
                  </span>
                  <span className="text-green-700 font-bold">Free</span>
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  A free, peer-run service for UC Davis Students.
                </div>
                <a
                  href="https://cstutoringatdavis.com"
                  className="text-green-700 underline text-sm font-medium"
                >
                  cstutoringatdavis.com
                </a>
              </div>
            </div>
            <TutorHelpfulFeedback courseId={courseId} />
          </div>
        </div>
      )}
    </>
  );
};

export default FindTutorModal;
