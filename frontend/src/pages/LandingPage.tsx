import React, { useState, useRef, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import Footer from "../components/Footer";
import Popup from "../components/landing_page/Popup";
import { Helmet } from "react-helmet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { searchCourses, searchProfessors } from "../api/GetSearch";
import { usePostHog } from "posthog-js/react";
import { fetchAllCourses } from "../api/GetAllCourses";
import { motion, AnimatePresence } from "framer-motion";
import AboutSection from "../components/AboutSection";
import { Search, Sparkles } from "lucide-react";

const FEATURES = { referral_code: false, chat_mode: false };

const CACHE_EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes

interface CourseHit {
  course_id: string;
  course_title: string;
}
interface ProfessorHit {
  professor_id: string;
  professor_slug: string;
  professor_name: string;
}
interface SearchResult {
  courses: CourseHit[];
  profs: ProfessorHit[];
}

const DEBOUNCE_MS = 400;

const LandingPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Prefetch courses
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ["courses"],
      queryFn: fetchAllCourses,
      staleTime: CACHE_EXPIRY_TIME,
    });
  }, [queryClient]);

  // Referral (feature gated)
  let join_code: string | undefined;
  if (FEATURES.referral_code) {
    const { refId } = useParams<{ refId: string }>();
    const q = new URLSearchParams(window.location.search).get("join");
    join_code = q ?? refId;
  }

  const [term, setTerm] = useState("");
  const [searchKey, setSearchKey] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(true);
  const boxRef = useRef<HTMLDivElement>(null);
  const posthog = usePostHog();

  // Background swap on resize
  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Debounce search
  useEffect(() => {
    const h = setTimeout(() => {
      if (term.trim() && isSearchMode) {
        setSearchKey(term.trim());
        setOpen(true);
      } else {
        setSearchKey(null);
        setOpen(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(h);
  }, [term, isSearchMode]);

  // Query
  const {
    data = { courses: [], profs: [] },
    isFetching,
    isSuccess,
  } = useQuery<SearchResult>({
    queryKey: ["search", searchKey],
    enabled: !!searchKey && isSearchMode,
    queryFn: async ({ queryKey }) => {
      const [, key] = queryKey as [string, string | null];
      if (!key) return { courses: [], profs: [] };
      const profsP = searchProfessors(key)
        .then((raw) =>
          raw.map((p: any) => ({
            professor_id: p.professor_id,
            professor_slug: p.professor_slug,
            professor_name: p.professor_name,
          })),
        )
        .catch(() => [] as ProfessorHit[]);
      const coursesP = searchCourses(key).catch(() => [] as CourseHit[]);
      const [profs, courses] = await Promise.all([profsP, coursesP]);
      return { courses, profs };
    },
  });
  const hasResults = data.profs.length + data.courses.length > 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAboutClick = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
  ) => {
    e.preventDefault();
    const el = document.getElementById("about");
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  const handleToggle = (mode: boolean) => {
    setIsSearchMode(mode);
    setTerm("");
    setOpen(false);
  };

  return (
    <div>
      <div
        className="relative flex flex-col min-h-[100svh] sm:min-h-screen"
        style={{
          backgroundImage: `url('${isMobile ? "/landing-mobile.svg" : "/landing-3.svg"}'), ${
            isMobile
              ? "linear-gradient(46deg, #2C75A5 1.03%, #0F293A 84.68%)"
              : "var(--bg, linear-gradient(46deg, #2C75A5 1.03%, #0F293A 84.68%))"
          }`,
          backgroundSize: "cover, cover",
          backgroundPosition: "center, center",
          backgroundRepeat: "no-repeat, no-repeat",
        }}
      >
        <Helmet>
          <meta
            name="description"
            content="Discover the best professors and plan your academic schedule with ease."
          />
          <link rel="canonical" href="https://daviscattlelog.com/" />
        </Helmet>
        <main className="flex flex-col flex-grow items-center justify-center pt-14 gap-1 text-center mx-4">
          {FEATURES.referral_code && join_code && <Popup />}
          <div className="flex flex-col items-center w-full max-w-[315px] sm:max-w-[900px]">
            <div className="flex items-center justify-center gap-6">
              <img
                src="/landing-logo.svg"
                alt="Cattlelog Logo"
                className="w-[clamp(120px,22vw,196px)] h-auto object-contain transition-[width] duration-300 ease-out"
                loading="lazy"
              />
              <div className="flex flex-col select-none text-left">
                <span className="block text-transparent bg-clip-text bg-[linear-gradient(90deg,#FFF_0%,#E4B43D_112.3%)] font-bold tracking-[-1.6px] font-[Figtree] text-[47px] sm:text-[60px] lg:text-[80px] leading-[1.05]">
                  davis
                </span>
                <span className="block text-transparent bg-clip-text bg-[linear-gradient(90deg,#FFF_0%,#E4B43D_112.3%)] font-bold tracking-[-1.6px] font-[Figtree] text-[47px] sm:text-[60px] lg:text-[80px] leading-[1.18] -mt-2">
                  cattlelog
                </span>
              </div>
            </div>
            <div className="text-center text-[16px] sm:text-[25px] lg:text-[32px] text-white font-[400] sm:font-[300] space-y-1 pt-4 sm:pt-0">
              <h1>
                Discover classes. Research professors.
                <br className="block sm:hidden" />
                <span className="sm:whitespace-nowrap"> Plan schedules.</span>
              </h1>
            </div>
            <div className="w-full sm:max-w-[600px] md:max-w-[600px] lg:max-w-[620px] mx-4 flex flex-col pt-5">
              {" "}
              <div ref={boxRef} className="relative w-full">
                {/* Search bar and toggle container */}
                <div className="flex items-center gap-3">
                  {/* Search bar */}
                  <label className="flex items-center gap-2 bg-[#D9D9D9] rounded-full h-12 flex-1 pl-4 pr-4">
                    {isSearchMode ? (
                      <Search className="w-[20px] h-[20px] text-gray-600" />
                    ) : (
                      <Sparkles className="w-[20px] h-[20px] text-gray-600" />
                    )}
                    <input
                      type="text"
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                      placeholder={
                        isSearchMode
                          ? "Search Courses & Professors"
                          : "Ask me anything about UC Davis..."
                      }
                      className="flex-1 bg-transparent py-1 ml-2 text-lg focus:outline-none text-black"
                    />
                  </label>

                  {/* Toggle outside search bar */}
                  {FEATURES.chat_mode ? (
                    <>
                      <div className="relative bg-[#D9D9D9] rounded-full h-12 p-1">
                        <div
                          className={`absolute top-1 bottom-1 w-[calc(50%-2px)] bg-white rounded-full shadow-sm transition-transform duration-200 ease-out ${
                            isSearchMode ? "translate-x-0" : "translate-x-full"
                          }`}
                        />
                        <div className="relative flex h-full">
                          <button
                            onClick={() => handleToggle(true)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors h-full ${
                              isSearchMode ? "text-gray-700" : "text-gray-600"
                            }`}
                          >
                            <Search className="w-4 h-4" />
                            <span className="text-sm font-medium">search</span>
                          </button>
                          <button
                            onClick={() => handleToggle(false)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors h-full ${
                              !isSearchMode ? "text-gray-700" : "text-gray-600"
                            }`}
                          >
                            <Sparkles className="w-4 h-4" />
                            <span className="text-sm font-medium">chat</span>
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <></>
                  )}
                </div>

                <AnimatePresence>
                  {open && isSearchMode && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="absolute left-0 top-full mt-2 w-full bg-white rounded-3xl p-3 text-left text-black shadow-lg max-h-60 z-10 overflow-hidden"
                    >
                      <div className="overflow-y-auto max-h-[15rem] pt-1 pr-1">
                        {isFetching && (
                          <p className="text-center text-gray-500">
                            Searching…
                          </p>
                        )}
                        {!isFetching && isSuccess && hasResults && (
                          <div className="space-y-4">
                            {data.profs.length > 0 && (
                              <section>
                                <h3 className="uppercase text-gray-400 text-sm tracking-wider mb-2 px-1">
                                  Professors
                                </h3>
                                <motion.ul>
                                  <AnimatePresence initial={false}>
                                    {data.profs.slice(0, 4).map((p) => (
                                      <motion.li
                                        key={p.professor_slug}
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.18 }}
                                        className="rounded-md"
                                      >
                                        <Link
                                          to={`/professor/${p.professor_slug}`}
                                          onClick={() => setOpen(false)}
                                          className="block rounded-md px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
                                        >
                                          <span className="text-[15px] text-gray-900">
                                            {p.professor_name}
                                          </span>
                                        </Link>
                                      </motion.li>
                                    ))}
                                  </AnimatePresence>
                                </motion.ul>
                              </section>
                            )}
                            {data.courses.length > 0 && (
                              <section>
                                <h3 className="uppercase text-gray-400 text-sm tracking-wider mb-2 px-1">
                                  Courses
                                </h3>
                                <motion.ul>
                                  <AnimatePresence initial={false}>
                                    {data.courses.slice(0, 4).map((c) => (
                                      <motion.li
                                        key={c.course_id}
                                        initial={{ opacity: 0, y: -6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.18 }}
                                        className="rounded-md"
                                      >
                                        <Link
                                          to={`/course/${c.course_id}`}
                                          onClick={() => setOpen(false)}
                                          className="block rounded-md px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
                                        >
                                          <div className="flex items-baseline gap-2">
                                            <span className="font-medium text-gray-900">
                                              {c.course_id}
                                            </span>
                                            <span className="text-gray-500 truncate">
                                              {c.course_title}
                                            </span>
                                          </div>
                                        </Link>
                                      </motion.li>
                                    ))}
                                  </AnimatePresence>
                                </motion.ul>
                              </section>
                            )}
                          </div>
                        )}
                        {!isFetching && isSuccess && !hasResults && (
                          <p className="text-center text-gray-500">
                            No matches found.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full pt-9 sm:pt-8">
                <Link to="/home" className="w-full">
                  <button
                    className="w-full bg-[#C1D8E8] text-black font-semibold text-[16px] px-6 py-2 shadow-[0_10px_20px_0_rgba(0,0,0,0.3)] rounded-full hover:bg-[#AEC2D1] transition"
                    onClick={() =>
                      posthog?.capture(
                        "landing_page_view_all_courses_clicked",
                        { location: "LandingPage" },
                      )
                    }
                  >
                    <div className="flex items-center justify-center gap-5">
                      <img
                        src="/book-course.svg"
                        className="w-[21px] h-[24px]"
                      />
                      <span>View All Courses</span>
                    </div>
                  </button>
                </Link>
                <Link to="/grade-distribution" className="w-full">
                  <button
                    className="w-full bg-[#E4B540] text-black font-semibold text-[16px] px-6 py-2 rounded-full hover:bg-[#CDA33A] shadow-[0_10px_20px_0_rgba(0,0,0,0.3)] transition"
                    onClick={() =>
                      posthog?.capture(
                        "landing_page_grade_distributions_clicked",
                        { location: "LandingPage" },
                      )
                    }
                  >
                    <div className="flex items-center justify-center gap-5">
                      <img
                        src="/chart-grade.svg"
                        className="w-[24px] h-[18px]"
                      />
                      <span>View Grade Distributions</span>
                    </div>
                  </button>
                </Link>
                <Link
                  to="/write-review"
                  className="w-full"
                  onClick={() =>
                    posthog?.capture("landing_page_write_review_clicked", {
                      location: "WriteReview",
                    })
                  }
                >
                  <button className="w-full bg-[#E5D9B9] text-black font-semibold text-[16px] px-6 py-2 rounded-full hover:bg-[#CEC3A6] transition shadow-[0_10px_20px_0_rgba(0,0,0,0.3)]">
                    <div className="flex items-center justify-center gap-5">
                      <img
                        src="/write-review.svg"
                        className="w-[24px] h-[24px]"
                      />
                      <span>Write a Review</span>
                    </div>
                  </button>
                </Link>
                <Link to="/cooked/start" className="w-full">
                  <button
                    className="w-full bg-[#364149] text-white font-semibold text-[16px] px-6 py-2 rounded-full hover:bg-[#313A42] transition shadow-[0_10px_20px_0_rgba(0,0,0,0.3)]"
                    onClick={() =>
                      posthog?.capture(
                        "landing_page_course_comparison_clicked",
                        { location: "LandingPage" },
                      )
                    }
                  >
                    <div className="flex items-center justify-center gap-5">
                      <img
                        src="/schedule-compare.svg"
                        className="w-[21px] h-[20px]"
                      />
                      <span>Schedule Comparison</span>
                    </div>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </main>
        <div className="flex justify-center pb-2">
          <a
            href="#about"
            title="Scroll down"
            className="group flex items-center justify-center w-16 h-16 outline-none"
            onClick={handleAboutClick}
          >
            <span className="sr-only">Scroll down</span>
            <svg
              className="w-11 h-11 text-white/85 group-hover:text-white transition-colors drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] animate-bounce"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </a>
        </div>
      </div>
      <div id="about" className="h-0 scroll-mt-24 sm:scroll-mt-36" />
      <AboutSection />
      <Footer />
    </div>
  );
};

export default LandingPage;
