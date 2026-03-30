import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useDeferredValue,
} from "react";
import { useParams } from "react-router-dom";
import posthog from "posthog-js";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { fetchAllCourses } from "../api/GetAllCourses";
import { Course } from "./../components/types/Course";
import GlowingDifficultyIndicator from "../components/cooked_class/GlowingDifficultyIndicator";
import ShimmeringShareButton from "../components/cooked_class/ShimmeringShareButton";

// Inline global styles
const GlobalStyles = () => (
  <style>{`
    @keyframes shimmer { 0% { background-position: -100% 0; } 100% { background-position: 200% 0; } }
    .animate-shimmer { animation: shimmer 2s infinite; }
    @keyframes particleEffect { 0% { transform: scale(0) rotate(0deg); opacity:1;} 100% { transform: scale(1.5) rotate(360deg); opacity:0;} }
  `}</style>
);

interface ComparisonData {
  userAvgDifficulty: string;
  friendAvgDifficulty: string;
  userTotalUnits: number;
  friendTotalUnits: number;
  userWorkload: number;
  friendWorkload: number;
  matchingClasses: number;
  overallSimilarity: number;
  moreDifficultUser: string;
  difficultyDifference: string;
  diffPercentageDiff: number;
  userIsHarder: boolean;
}

function CookedClass() {
  const [joinedSession, setJoinedSession] = useState(false);
  const [sessionCode, setSessionCode] = useState("");
  const [friendName, setFriendName] = useState("Cory");
  const [userName, setUserName] = useState("");
  const [userClasses, setUserClasses] = useState<Course[]>([]);

  const [friendClasses, setFriendClasses] = useState<Course[]>([
    {
      course_id: "ANS98",
      course_title: "Directed Group Study",
      fulfillment_tags: [],
      prerequisites: " Consent of Instructor. ",
      units: 1,
      description: "Directed group study.",
      average_overall_rating: 5,
      availability: { open: 0, reserved: 0, waitlisted: 0 },
      highest_overall_rating: 5,
      offered: true,
      professors: [
        {
          professor_name: "Lisa Lit",
          id: "1603103",
          slug: "lisa-lit",
          overall_rating: "5.0",
          overall_difficulty: "2.5",
          review: "Great instructor",
          common_tags: [],
          is_teaching: true,
        },
      ],
    },
  ]);

  const [classList, setClassList] = useState<Course[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchText, setSearchText] = useState("");
  const deferredSearch = useDeferredValue(searchText);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(
    null,
  );

  const { compareData } = useParams<{ compareData: string }>();

  const getFriendClasses = useCallback(() => {
    if (!compareData) return;
    if (compareData.length > 100) return;
    const parts = compareData.split("-").filter(Boolean);
    if (parts.length < 2) return; // need name + at least one class
    const name = parts[0];
    if (name) setFriendName(name);
    const ids = new Set(parts.slice(1).map((s) => s.toUpperCase()));
    const found = classList.filter((c) => ids.has(c.course_id.toUpperCase()));
    posthog.capture("comparison_pull_friends_classes", { name });
    setFriendClasses(found);
  }, [compareData, classList]);

  useEffect(() => {
    if (classList.length > 0) getFriendClasses();
  }, [classList, getFriendClasses]);

  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await fetchAllCourses();
        setClassList(data);
      } catch (err) {
        setClassList([]);
      } finally {
      }
    }

    loadCourses();
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("session");
    if (code) setSessionCode(code);
  }, []);

  // Recalculate whenever either side changes
  useEffect(() => {
    if (userClasses.length && friendClasses.length) calculateComparison();
  }, [userClasses, friendClasses]);

  const handleJoinSession = () => {
    setJoinedSession(true);
  };

  // Calculate workload score for a single course
  const getCourseWorkloadScore = (course: Course) => {
    return course.units * (6 - course.average_overall_rating);
  };

  const calculateComparison = useCallback(() => {
    // Calculate workload using the equation: total units * average difficulty
    const userTotalUnits = userClasses.reduce((sum, c) => sum + c.units, 0);
    const friendTotalUnits = friendClasses.reduce((sum, c) => sum + c.units, 0);

    // Calculate the average difficulty (using the original scale)
    const userAvgDifficulty =
      userClasses.length > 0
        ? userClasses.reduce((sum, c) => sum + c.average_overall_rating, 0) /
          userClasses.length
        : 0;

    const friendAvgDifficulty =
      friendClasses.length > 0
        ? friendClasses.reduce((sum, c) => sum + c.average_overall_rating, 0) /
          friendClasses.length
        : 0;

    // Calculate the workload score (lower rating = harder, so we use 6 - rating)
    const userWorkload = userClasses.reduce(
      (sum, c) => sum + c.units * (6 - c.average_overall_rating),
      0,
    );
    const friendWorkload = friendClasses.reduce(
      (sum, c) => sum + c.units * (6 - c.average_overall_rating),
      0,
    );

    const matchingClasses = userClasses.filter((uc) =>
      friendClasses.some((fc) => fc.course_id === uc.course_id),
    );

    // Determine who has the harder schedule based on workload
    let moreDifficultUser =
      userWorkload > friendWorkload ? userName : friendName;

    // Calculate the relative difference in workload
    const workloadDifference = Math.abs(userWorkload - friendWorkload);
    const maxWorkload = Math.max(userWorkload, friendWorkload);
    const workloadDifferencePercentage =
      maxWorkload > 0
        ? Math.round((workloadDifference / maxWorkload) * 100)
        : 0;

    let difficultyDifference = "slightly";
    if (workloadDifferencePercentage > 50) {
      difficultyDifference = "significantly";
    } else if (workloadDifferencePercentage > 25) {
      difficultyDifference = "moderately";
    }

    const matchPercentage =
      (matchingClasses.length /
        Math.max(userClasses.length, friendClasses.length)) *
      100;

    // Calculate overall similarity
    const diffSimilarity = Math.max(0, 100 - workloadDifferencePercentage);
    const overallSimilarity = Math.round(
      matchPercentage * 0.6 + diffSimilarity * 0.4,
    );

    setComparisonData({
      userAvgDifficulty: userAvgDifficulty.toFixed(1),
      friendAvgDifficulty: friendAvgDifficulty.toFixed(1),
      userTotalUnits,
      friendTotalUnits,
      userWorkload,
      friendWorkload,
      matchingClasses: matchingClasses.length,
      overallSimilarity,
      moreDifficultUser,
      difficultyDifference,
      diffPercentageDiff: workloadDifferencePercentage,
      userIsHarder: userWorkload > friendWorkload,
    });
  }, [userClasses, friendClasses, userName, friendName]);

  const handleAddClass = useCallback(
    (classItem: Course) => {
      if (
        classItem &&
        !userClasses.some((c) => c.course_id === classItem.course_id)
      ) {
        posthog.capture("comparison_course_added", {
          course: classItem.course_id,
        });
        setUserClasses((prev) => [...prev, classItem]);
        setSearchText("");
        setShowDropdown(false);
      }
    },
    [userClasses],
  );

  const handleRemoveClass = useCallback((courseId: string) => {
    posthog.capture("comparison_course_removed", {
      course: courseId,
    });
    setUserClasses((prev) => prev.filter((c) => c.course_id !== courseId));
  }, []);

  const onNameChange = (name: string) => {
    const alphabeticAndSpaces = /^[A-Za-z\s]*$/;
    if (name.length <= 100 && (name === "" || alphabeticAndSpaces.test(name))) {
      setUserName(name);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    setShowDropdown(e.target.value.length > 0);
  };

  // Preprocess course list once
  const preprocessedCourses = useMemo(
    () =>
      classList.map((c) => ({
        ref: c,
        idL: c.course_id.toLowerCase(),
        idCompact: c.course_id.toLowerCase().replace(/\s+/g, ""),
        titleL: c.course_title.toLowerCase(),
      })),
    [classList],
  );

  const selectedIds = useMemo(
    () => new Set(userClasses.map((c) => c.course_id)),
    [userClasses],
  );

  const filteredClasses = useMemo(() => {
    const raw = deferredSearch.trim();
    if (!raw) return [] as Course[];
    const q = raw.toLowerCase();
    // Quick fail for very short queries to avoid large scans
    if (q.length < 2) return [] as Course[];

    const results: Course[] = [];
    // Single pass; break once we reach a UI-friendly limit
    for (let i = 0; i < preprocessedCourses.length; i++) {
      const p = preprocessedCourses[i];
      if (selectedIds.has(p.ref.course_id)) continue;
      if (
        p.idL.includes(q) ||
        p.titleL.includes(q) ||
        p.idCompact.includes(q)
      ) {
        results.push(p.ref);
        if (results.length >= 120) break; // hard cap
      }
    }
    return results;
  }, [deferredSearch, preprocessedCourses, selectedIds]);

  // Get difficulty text based on original difficulty rating
  const getDifficultyText = (difficulty: number) => {
    if (difficulty <= 1.5) return "Extremely Hard";
    if (difficulty <= 2.0) return "Very Hard";
    if (difficulty <= 2.5) return "Hard";
    if (difficulty <= 3.0) return "Moderate";
    return "Easy";
  };

  const handleCopyLink = useCallback(() => {
    posthog.capture("comparison_share", { name: userName, from: friendName });
    const compClasses = userClasses.map((u) => `-${u.course_id}`).join("");
    const safeUser = encodeURIComponent(userName.trim());
    const shareUrl = `${window.location.origin}/cooked/${safeUser}${compClasses}?utm_source=comparison_share`;

    navigator.clipboard.writeText(shareUrl);
    alert("Comparison link copied to clipboard!");
  }, [userClasses, userName, friendName]);

  if (!joinedSession) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center pt-8 pb-16 px-4 sm:px-0">
          <div className="max-w-[510px] w-full sm:w-full flex flex-col items-center justify-center">
            <h2 className="text-2xl sm:text-[36px] font-extrabold text-black text-center">
              Cooked Schedule Comparison
            </h2>
            <div className="text-[16px] sm:text-[18px] mb-6 sm:mb-8 font-light text-center max-w-xl">
              Compare your schedule difficulty with friends!
            </div>
            <img
              src="/cooked-books.svg"
              alt="Cooked books illustration"
              className="block h-35 sm:h-[148px] w-auto mb-4"
            />

            <div className="mb-6 mt-6 w-full">
              <p className="mb-3 text-[16px] sm:text-[18px] font-light text-center">
                Join {friendName}'s class comparison session to see how your
                course loads stack up!
              </p>

              {sessionCode && (
                <div className="bg-blue-50 p-3 rounded-lg mb-4 border border-blue-200">
                  <p className="text-xs mb-1 text-blue-700">Session Code:</p>
                  <p className="text-lg sm:text-xl font-mono font-bold text-blue-900 break-words">
                    {sessionCode}
                  </p>
                </div>
              )}

              <label className="block mb-2 mt-4 text-gray-700 text-sm sm:text-[18px] font-bold">
                NAME
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => onNameChange(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition text-base"
                placeholder="Enter your name"
                inputMode="text"
                autoComplete="name"
              />

              <button
                onClick={handleJoinSession}
                disabled={!userName}
                className={`w-full sm:w-2/3 mx-auto block py-3 mt-6 rounded-lg font-bold text-base transition ${userName ? "bg-[#15374D] text-white hover:bg-[#134564]" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
              >
                Join Comparison
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <GlobalStyles />
      <Header />

      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">
          The Cattlelog.com Cooked Course Comparison
        </h1>

        <div className="flex flex-col md:flex-row gap-4">
          {/* Left sidebar */}
          <div className="w-full md:w-96 bg-white rounded shadow p-4">
            <h2 className="text-lg font-bold mb-4">Add Classes</h2>

            <div className="mb-4">
              <input
                type="text"
                value={searchText}
                onChange={handleSearchChange}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Search for classes..."
              />

              {showDropdown && (
                <div className="mt-2 border border-gray-300 rounded shadow-lg bg-white max-h-64 overflow-y-auto will-change-transform">
                  {filteredClasses.length > 0 ? (
                    filteredClasses.map((classItem: Course) => {
                      return (
                        <div
                          key={classItem.course_id}
                          className="p-3 border-b border-gray-200 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                          onClick={() => handleAddClass(classItem)}
                        >
                          <div>
                            <div className="font-bold">
                              {classItem.course_id}
                            </div>
                            <div className="text-sm text-gray-600">
                              {classItem.course_title}
                            </div>
                            <div className="text-xs text-gray-500">
                              {classItem.units} units
                            </div>
                          </div>
                          <GlowingDifficultyIndicator
                            difficulty={getCourseWorkloadScore(classItem)}
                            size="h-10 w-10"
                          />
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      {deferredSearch.trim().length < 2
                        ? "Type at least 2 characters"
                        : "No classes found"}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-100 p-3 rounded-lg mb-4">
              <h3 className="font-bold text-sm mb-2">
                What do the workload scores mean?
              </h3>
              <div className="space-y-1 text-xs">
                {/* Updated workload score meanings */}
                <div className="flex items-center gap-1">
                  <div className="bg-red-600 rounded w-3 h-3"></div>
                  <span>15+: Extremely Heavy Workload</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="bg-red-500 rounded w-3 h-3"></div>
                  <span>12-14.9: Very Heavy Workload</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="bg-yellow-500 rounded w-3 h-3"></div>
                  <span>9-11.9: Heavy Workload</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="bg-yellow-400 rounded w-3 h-3"></div>
                  <span>6-8.9: Moderate Workload</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="bg-green-500 rounded w-3 h-3"></div>
                  <span>0-5.9: Light Workload</span>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                <p>Workload = Units × (6 - Rating)</p>
                <p>Lower professor ratings = harder classes</p>
              </div>
            </div>

            <ShimmeringShareButton onClick={handleCopyLink} />
          </div>

          {/* Main content */}
          <div className="flex-1">
            {/* Workload Comparison Banner */}
            {comparisonData && (
              <div className="bg-white rounded shadow mb-4 overflow-hidden">
                <div className="bg-[#1A5276] text-white p-3">
                  <h2 className="font-bold">Course Load Comparison</h2>
                </div>

                <div
                  className={`p-4 relative`}
                  style={{
                    background:
                      comparisonData.userWorkload >
                      comparisonData.friendWorkload
                        ? `linear-gradient(to right,
                          rgba(220, 38, 38, 0.7) 0%,
                          rgba(239, 68, 68, 0.6) 30%,
                          rgba(230, 230, 230, 0.5) 70%,
                          rgba(230, 230, 230, 0.4) 100%)` // Red on left (user) side if user has higher workload
                        : `linear-gradient(to right,
                          rgba(230, 230, 230, 0.4) 0%,
                          rgba(230, 230, 230, 0.5) 30%,
                          rgba(239, 68, 68, 0.6) 70%,
                          rgba(220, 38, 38, 0.7) 100%)`, // Red on right (friend) side if friend has higher workload
                  }}
                >
                  <div className="flex items-center justify-between">
                    {/* User score with workload */}
                    <div className="flex flex-col items-center">
                      <div className="font-bold mb-1">{userName}</div>
                      <GlowingDifficultyIndicator
                        difficulty={comparisonData.userWorkload}
                      />
                      <div className="text-xs text-gray-600 mt-1">
                        {comparisonData.userTotalUnits} units
                      </div>
                      <div className="text-sm font-bold mt-1">
                        Avg. Rating: {comparisonData.userAvgDifficulty}
                      </div>
                    </div>

                    {/* Comparison */}
                    <div className="flex flex-col items-center px-4">
                      <div className="text-3xl font-bold mb-2">
                        {comparisonData.diffPercentageDiff}%
                      </div>
                      <div className="text-sm font-semibold">
                        Workload Difference
                      </div>
                      <div className="mt-2 bg-red-100 border border-red-200 rounded-lg p-2 text-center">
                        <div className="font-bold text-red-700">
                          {comparisonData.moreDifficultUser}
                        </div>
                        <div className="text-xs text-red-600">
                          has a {comparisonData.difficultyDifference} harder
                          schedule
                        </div>
                      </div>
                    </div>

                    {/* Friend score with workload */}
                    <div className="flex flex-col items-center">
                      <div className="font-bold mb-1">{friendName}</div>
                      <GlowingDifficultyIndicator
                        difficulty={comparisonData.friendWorkload}
                      />
                      <div className="text-xs text-gray-600 mt-1">
                        {comparisonData.friendTotalUnits} units
                      </div>
                      <div className="text-sm font-bold mt-1">
                        Avg. Rating: {comparisonData.friendAvgDifficulty}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Classes Comparison */}
            <div className="bg-white rounded shadow overflow-hidden">
              <div className="bg-[#1A5276] text-white p-3">
                <h2 className="font-bold">Class Comparison</h2>
              </div>

              <div className="p-0">
                <div className="grid grid-cols-2 divide-x divide-gray-200">
                  {/* Headers */}
                  <div className="bg-gray-100 p-3 border-b border-gray-200">
                    <div className="font-bold">{userName}'s Classes</div>
                    {userClasses.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Average Rating:{" "}
                        {comparisonData?.userAvgDifficulty || "-"} •{" "}
                        {userClasses.length} classes
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-100 p-3 border-b border-gray-200">
                    <div className="font-bold">{friendName}'s Classes</div>
                    <div className="text-xs text-gray-500">
                      Average Rating:{" "}
                      {comparisonData?.friendAvgDifficulty || "-"} •{" "}
                      {friendClasses.length} classes
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 divide-x divide-gray-200">
                  {/* User Classes */}
                  <div className="max-h-96 overflow-y-auto">
                    {userClasses.length > 0 ? (
                      userClasses.map((course) => {
                        const workloadScore = getCourseWorkloadScore(course);
                        return (
                          <a
                            key={course.course_id}
                            href={`https://daviscattlelog.com/grade/${course.course_id}`}
                            rel="noopener noreferrer"
                          >
                            <div className="p-3 border-b border-gray-200 hover:bg-gray-50">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="flex items-center">
                                    <span className="font-bold mr-1">
                                      {course.course_id}
                                    </span>
                                    {friendClasses.some(
                                      (c) => c.course_id === course.course_id,
                                    ) && (
                                      <span className="bg-blue-100 text-blue-700 text-xs px-1 rounded">
                                        Match
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm">
                                    {course.course_title}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {course.units} units • Rating:{" "}
                                    {course.average_overall_rating} •{" "}
                                    {getDifficultyText(
                                      course.average_overall_rating,
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleRemoveClass(course.course_id);
                                    }}
                                    className="text-red-500 hover:text-red-700 p-1"
                                    title="Remove class"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="24"
                                      height="24"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="lucide lucide-sliders-horizontal"
                                    >
                                      <line
                                        x1="21"
                                        x2="14"
                                        y1="4"
                                        y2="4"
                                      ></line>
                                      <line x1="10" x2="3" y1="4" y2="4"></line>
                                      <line
                                        x1="21"
                                        x2="12"
                                        y1="12"
                                        y2="12"
                                      ></line>
                                      <line
                                        x1="8"
                                        x2="3"
                                        y1="12"
                                        y2="12"
                                      ></line>
                                      <line
                                        x1="21"
                                        x2="16"
                                        y1="20"
                                        y2="20"
                                      ></line>
                                      <line
                                        x1="12"
                                        x2="3"
                                        y1="20"
                                        y2="20"
                                      ></line>
                                      <line
                                        x1="14"
                                        x2="14"
                                        y1="2"
                                        y2="6"
                                      ></line>
                                      <line
                                        x1="8"
                                        x2="8"
                                        y1="10"
                                        y2="14"
                                      ></line>
                                      <line
                                        x1="16"
                                        x2="16"
                                        y1="18"
                                        y2="22"
                                      ></line>
                                    </svg>
                                  </button>
                                  <GlowingDifficultyIndicator
                                    difficulty={workloadScore}
                                  />
                                </div>
                              </div>
                            </div>
                          </a>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No classes added yet.
                        <br />
                        Use the search to add classes.
                      </div>
                    )}
                  </div>

                  {/* Friend Classes */}
                  <div className="max-h-96 overflow-y-auto">
                    {friendClasses.map((course) => {
                      const workloadScore = getCourseWorkloadScore(course);
                      return (
                        <a
                          key={course.course_id}
                          href={`https://daviscattlelog.com/grade/${course.course_id}`}
                          rel="noopener noreferrer"
                        >
                          <div className="p-3 border-b border-gray-200 hover:bg-gray-50">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="flex items-center">
                                  <span className="font-bold mr-1">
                                    {course.course_id}
                                  </span>
                                  {userClasses.some(
                                    (c) => c.course_id === course.course_id,
                                  ) && (
                                    <span className="bg-blue-100 text-blue-700 text-xs px-1 rounded">
                                      Match
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm">
                                  {course.course_title}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {course.units} units • Rating:{" "}
                                  {course.average_overall_rating} •{" "}
                                  {getDifficultyText(
                                    course.average_overall_rating,
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <GlowingDifficultyIndicator
                                  difficulty={workloadScore}
                                />
                              </div>
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <h2 className="text-lg p-4">
          Find out how cooked you are for your classes with our{" "}
          <a
            href="/grade-distribution"
            className="text-sky-400 hover:underline"
          >
            grade distribution feature
          </a>
        </h2>
      </div>
    </div>
  );
}

export default CookedClass;
