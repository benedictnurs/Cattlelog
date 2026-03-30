import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchGradeCourses } from "../../../api/GetSearch";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onSelect: (courseId: string) => void;
}
const DEBOUNCE_MS = 400;

const CoursePicker: React.FC<Props> = ({ onSelect }) => {
  const [term, setTerm] = useState("");
  const [searchKey, setSearchKey] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  /* debounce the input */
  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    if (!term.trim()) {
      setSearchKey(null);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(() => {
      setSearchKey(term.trim());
      setOpen(true);
    }, DEBOUNCE_MS);

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, [term]);

  /* fetch just the course IDs */
  const { data: ids = [], isFetching } = useQuery<string[]>({
    queryKey: ["gradePicker", searchKey],
    enabled: !!searchKey,
    queryFn: async () => {
      try {
        const sanitized = searchKey!
          .replace(/\s+/g, "") // Remove all spaces
          .replace(/(^|\D)0+(\d)/g, "$1$2"); // Remove leading zeros from numbers
        return await searchGradeCourses(sanitized);
      } catch {
        return [];
      }
    },
    staleTime: 30_000,
  });

  /* close dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (cid: string) => {
    onSelect(cid);
    setTerm("");
    setSearchKey(null);
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative w-full max-w-lg mx-auto">
      <div className="flex items-center bg-white border border-gray-300 rounded-xl shadow-sm focus-within:ring-1 focus-within:ring-blue-400 transition">
        <svg
          className="w-5 h-5 text-gray-400 ml-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
          />
        </svg>
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search courses..."
          type="text"
          className="flex-1 px-4 py-2 rounded-xl focus:outline-none"
        />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute left-0 top-full mt-2 w-full bg-white rounded-3xl p-3 text-left text-black shadow-lg max-h-60 z-20 overflow-hidden border border-gray-200"
          >
            <div className="overflow-y-auto max-h-[15rem] py-2 pr-1">
              {isFetching && (
                <p className="text-center text-gray-500 italic">Searching…</p>
              )}

              {!isFetching && ids.length > 0 && (
                <motion.ul>
                  <AnimatePresence initial={false}>
                    {ids.map((course_id) => (
                      <motion.li
                        key={course_id}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                        className="rounded-md"
                      >
                        <button
                          type="button"
                          onClick={() => select(course_id)}
                          className="block w-full text-left rounded-md px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        >
                          <span className="font-medium text-gray-900">
                            {course_id}
                          </span>
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </motion.ul>
              )}

              {!isFetching && ids.length === 0 && (
                <p className="text-center text-gray-500 italic">
                  No matches found
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CoursePicker;
