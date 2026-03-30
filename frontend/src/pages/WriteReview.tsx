import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useDeferredValue,
} from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { writeReview } from "../api/WriteReview";
import { fetchAllCourses } from "../api/GetAllCourses";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { FixedSizeList } from "react-window";
import { motion } from "framer-motion";

const grades = [
  "A+",
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D+",
  "D",
  "D-",
  "F",
  "P",
  "NP",
];

const colors = ["#E05346", "#E05346", "#FFD700", "#3E8D40", "#3E8D40"];

const quarter_options = [
  { value: "", label: "Choose One" },
  { value: "Fall", label: "Fall" },
  { value: "Winter", label: "Winter" },
  { value: "Spring", label: "Spring" },
  { value: "Summer", label: "Summer" },
];

const year_options = [
  { value: "", label: "Choose One" },
  { value: "2026", label: "2026" },
  { value: "2025", label: "2025" },
  { value: "2024", label: "2024" },
  { value: "2023", label: "2023" },
  { value: "2022", label: "2022" },
  { value: "2021", label: "2021" },
  { value: "2020", label: "2020" },
  { value: "2019", label: "2019" },
];

const WriteReview = () => {
  const [course, setCourse] = useState("");
  const [rating, setRating] = useState<number>(1);
  const [difficulty, setDifficulty] = useState<number>(1);
  const [grade, setGrade] = useState("");
  const [attendance, setAttendance] = useState<boolean | null>(null);
  const [lectures, setLectures] = useState<boolean | null>(null);
  const [practice, setPractice] = useState<boolean | null>(null);
  const [comments, setComments] = useState("");
  const [dropped, setDropped] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const [professorName, setProfessorName] = useState<string>("");
  const [courses, setCourses] = useState<
    {
      id: string;
      professors: { professor_name: string; id: string }[];
    }[]
  >([]);
  const [submitted, setSubmitted] = useState(false);
  const [_, setProfessors] = useState<{ name: string; id: string }[]>([]);
  const [email, setEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");

  const [quarter, setQuarter] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [courseSearch, setCourseSearch] = useState<string>("");

  const validateEmail = (value: string) => {
    const ucdavisEmailRegex = /^[^\s@]+@ucdavis\.edu$/i;
    if (!ucdavisEmailRegex.test(value)) {
      setEmailError("Please enter a valid @ucdavis.edu email.");
    } else {
      setEmailError("");
    }
  };

  useEffect(() => {
    async function loadCoursesAndProfessors() {
      try {
        const data = await fetchAllCourses();

        const formattedCourses = data.map((course: any) => ({
          id: course.course_id,
          professors: course.professors || [],
        }));

        let profSet = new Map<string, { name: string; id: string }>();

        for (const course of data) {
          for (const prof of course.professors || []) {
            if (prof.professor_name && !profSet.has(prof.professor_name)) {
              profSet.set(prof.professor_name, {
                name: prof.professor_name,
                id: prof.id,
              });
            }
          }
        }

        const formattedProfessors = Array.from(profSet.values());

        setCourses(formattedCourses);
        setProfessors(formattedProfessors);
      } catch (error) {
        console.error("Error loading courses and professors:", error);
        setCourses([]);
        setProfessors([]);
      }
    }

    loadCoursesAndProfessors();
  }, []);

  const handleSubmit = async () => {
    if (
      !course ||
      !professorName ||
      !quarter ||
      !year ||
      !email ||
      emailError ||
      rating === 0 ||
      difficulty === 0 ||
      attendance == null ||
      lectures == null ||
      comments.trim() === ""
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    const term = `${quarter} ${year}`;
    const tags: string[] = [];
    if (attendance === true) tags.push("Attendance Mandatory");
    if (lectures === true) tags.push("Lectures Recorded");
    if (practice === true) tags.push("Gives Practice Exams");
    if (dropped === true) tags.push("Drops Exams");

    try {
      console.log("Submitting review with:", {
        course_id: course || "",
        professor_name: professorName || "Unknown",
        term: term,
        email: email || "Unknown",
        quality_rating: rating,
        difficulty_rating: difficulty,
        review: comments,
        tags: tags,
        date: new Date().toISOString(),
        grade: grade || null,
      });

      const response = await writeReview(
        course || "",
        professorName || "Unknown",
        term,
        email || "Unknown",
        rating,
        difficulty,
        comments,
        tags,
        new Date().toISOString(),
        grade || null,
      );

      console.log("Review submitted successfully:", response);
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please check the console for details.");
    }
  };

  const courseProfessors =
    courses.find((c) => c.id === course)?.professors || [];

  const courseOptions = useMemo(
    () => courses.map((c) => ({ value: c.id, label: c.id })),
    [courses],
  );

  const deferredSearch = useDeferredValue(courseSearch);
  const filteredCourseOptions = useMemo(() => {
    // Limit default open state to a small sample to avoid heavy work
    if (!deferredSearch) return courseOptions.slice(0, 200);

    const input = deferredSearch.toLowerCase();
    const maxResults = 200;
    let count = 0;

    const results: { value: string; label: string }[] = [];
    for (let i = 0; i < courseOptions.length && count < maxResults; i++) {
      const opt = courseOptions[i];
      if (opt.label.toLowerCase().includes(input)) {
        results.push(opt);
        count++;
      }
    }
    return results;
  }, [courseOptions, deferredSearch]);

  const VirtualizedMenuList = useCallback((props: any) => {
    const { children, maxHeight } = props;
    const childrenArray = React.Children.toArray(children);
    const itemCount = childrenArray.length;
    const height = Math.min(maxHeight || 320, itemCount * 36);

    return (
      <FixedSizeList
        height={height}
        itemCount={itemCount}
        itemSize={36}
        width="100%"
      >
        {({ index, style }: { index: number; style: React.CSSProperties }) => (
          <div style={style}>{childrenArray[index]}</div>
        )}
      </FixedSizeList>
    );
  }, []);

  const selectComponents = useMemo(
    () =>
      filteredCourseOptions.length > 40
        ? { MenuList: VirtualizedMenuList }
        : undefined,
    [filteredCourseOptions.length, VirtualizedMenuList],
  );

  const selectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      background: "#f3f4f6",
      borderColor: "#e5e7eb",
      borderRadius: "0.5rem",
      minHeight: "2.25rem",
      height: "2.25rem",
      boxShadow: "none",
      opacity: state?.isDisabled ? 0.6 : 1,
      cursor: state?.isDisabled ? "not-allowed" : "default",
    }),
    valueContainer: (provided: any) => ({ ...provided, padding: "0 0.5rem" }),
    indicatorsContainer: (provided: any) => ({ ...provided, padding: 0 }),
    singleValue: (provided: any) => ({ ...provided, color: "#374151" }),
    option: (provided: any, state: any) => ({
      ...provided,
      background: state.isFocused ? "#e5e7eb" : "#fff",
      color: "#374151",
    }),
    menu: (provided: any) => ({ ...provided, zIndex: 50 }),
    placeholder: (provided: any) => ({ ...provided, color: "#9CA3AF" }),
  };
  return submitted ? (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col items-center justify-center h-screen text-center"
    >
      <h1 className="text-3xl font-bold mb-4">Thanks for submitting!</h1>
      <p className="text-gray-600 mb-6">You can return to the home page.</p>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        className="px-4 py-2 bg-gray-200 text-gray-600 rounded hover:brightness-90 transition"
        onClick={() => navigate("/")}
      >
        Go to Home
      </motion.button>
    </motion.div>
  ) : (
    <div>
      <Header />
      <div className="flex justify-start min-h-screen bg-white sm:pl-20 p-[20px] sm:p-6 pt-8 sm:pt-9">
        <div className="w-full sm:w-[92%]">
          <div className="flex items-center mb-4 sm:mb-8">
            <h2 className="text-[18px] text-left ">Write a Review for:</h2>
            <Select
              id="course-select"
              className="ml-4 sm:ml-4 sm:pr-10 min-w-[240px] flex-shrink-0"
              value={course ? { value: course, label: course } : null}
              onChange={(selectedOption: any) => {
                setCourse(selectedOption ? selectedOption.value : "");
                setProfessorName("");
                setCourseSearch("");
              }}
              onInputChange={(value: string, meta: any) => {
                if (meta.action === "input-change") {
                  setCourseSearch(value);
                } else if (meta.action === "menu-close") {
                  setCourseSearch("");
                }
              }}
              options={filteredCourseOptions}
              isSearchable={true}
              filterOption={null}
              components={selectComponents}
              menuShouldScrollIntoView={false}
              menuPortalTarget={
                typeof document !== "undefined" ? document.body : undefined
              }
              menuPosition="fixed"
              maxMenuHeight={320}
              placeholder="Select a course"
            />
          </div>

          <div className="sm:ml-10">
            <div className="border-b border-gray-200"></div>
            {/* Professor Selection */}
            <div className="border-b border-gray-200 pb-6 pt-6">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8">
                <label className="text-[16px] font-semibold md:w-32 text-nowrap">
                  Professor:<span className="text-red-500">*</span>
                </label>
                <div className="w-full md:w-60 mb-2 md:mb-0">
                  <Select
                    classNamePrefix="react-select"
                    styles={selectStyles}
                    isDisabled={!course}
                    value={
                      professorName
                        ? { value: professorName, label: professorName }
                        : null
                    }
                    onChange={(selectedOption: any) =>
                      setProfessorName(
                        selectedOption ? selectedOption.value : "",
                      )
                    }
                    options={[{ value: "", label: "Choose One" }].concat(
                      courseProfessors
                        .filter(
                          (prof) =>
                            prof.professor_name &&
                            prof.professor_name.trim() !== ". The Staff" &&
                            prof.professor_name.trim() !== "The Staff",
                        )
                        .map((prof) => ({
                          value: prof.professor_name,
                          label: prof.professor_name,
                        })),
                    )}
                    isSearchable={true}
                    placeholder={
                      course ? "Choose One" : "Select a course first"
                    }
                  />
                </div>
                <a
                  href="https://forms.gle/wAoZZW3U9xuoNKoG6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline decoration-dotted mt-1 md:mt-0 text-xs md:text-sm"
                >
                  My class/professor isn't listed?
                </a>
              </div>
            </div>

            {/* Quarter Selection */}
            <div className="border-b border-gray-200 pb-6 pt-5">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8">
                <label className="font-semibold md:w-32 text-nowrap">
                  Quarter:<span className="text-red-500">*</span>
                </label>
                <div className="w-full md:w-60">
                  <Select
                    styles={selectStyles}
                    value={quarter ? { value: quarter, label: quarter } : null}
                    onChange={(opt: any) => setQuarter(opt ? opt.value : "")}
                    options={quarter_options}
                    isSearchable={false}
                    placeholder="Choose One"
                  />
                </div>
              </div>
            </div>

            {/* Year Selection */}
            <div className="border-b border-gray-200 pb-6 pt-6">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8">
                <label className="font-semibold md:w-32 text-nowrap">
                  Year:<span className="text-red-500">*</span>
                </label>
                <div className="w-full md:w-60">
                  <Select
                    styles={selectStyles}
                    value={year ? { value: year, label: year } : null}
                    onChange={(opt: any) => setYear(opt ? opt.value : "")}
                    options={year_options}
                    isSearchable={false}
                    placeholder="Choose One"
                  />
                </div>
              </div>
            </div>

            {/* Email Selection */}
            <div className="border-b border-gray-200 pt-6 pb-6">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8">
                <label className="font-semibold md:w-32 text-nowrap">
                  School Email:<span className="text-red-500">*</span>
                </label>
                <div className="w-full md:w-60 mb-2 md:mb-0">
                  <input
                    type="email"
                    className="p-2 w-full bg-gray-100 border text-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition"
                    placeholder="email@ucdavis.edu"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      validateEmail(e.target.value);
                    }}
                  />
                </div>
                {emailError && (
                  <span className="text-red-500 text-xs md:text-sm mt-1 md:mt-0">
                    {emailError}
                  </span>
                )}
              </div>
            </div>

            {/* Rating */}
            <div className="border-b border-gray-200 pt-6 pb-4 sm:pb-6">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
                <label className="font-semibold whitespace-nowrap md:w-60 mb-2 md:mb-0">
                  Rate Your Professor (Quality):
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-4 w-full md:max-w-[375px] md:flex-1 min-w-0">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #EFCAC7, #E5D9B9, #AFCEAF)`,
                      accentColor: colors[rating - 1],
                    }}
                  />
                  <span
                    className="text-lg font-semibold w-6 text-center"
                    style={{ color: colors[rating - 1] }}
                  >
                    {rating}
                  </span>
                </div>
              </div>
            </div>

            {/* Difficulty */}
            <div className="border-b border-gray-200 pt-6 pb-4 sm:pb-6">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
                <label className="font-semibold whitespace-nowrap md:w-60 mb-2 md:mb-0">
                  Rate Your Professor (Difficulty):
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-4 w-full md:max-w-[375px] md:flex-1 min-w-0">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={difficulty}
                    onChange={(e) => setDifficulty(Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #AFCEAF, #E5D9B9, #EFCAC7)`,
                      accentColor: colors[5 - difficulty],
                    }}
                  />
                  <span
                    className="text-lg font-semibold w-6 text-center"
                    style={{ color: colors[5 - difficulty] }}
                  >
                    {difficulty}
                  </span>
                </div>
              </div>
            </div>

            {/* Grade Selection */}
            <div className="flex items-center space-x-10 border-b border-gray-200 pt-6 pb-6">
              <label className="font-semibold whitespace-nowrap">
                Grade Received:
              </label>
              <div className="w-40 sm:w-60">
                <Select
                  styles={selectStyles}
                  value={grade ? { value: grade, label: grade } : null}
                  onChange={(opt: any) => setGrade(opt ? opt.value : "")}
                  options={[{ value: "", label: "Choose One" }].concat(
                    grades.map((g) => ({ value: g, label: g })),
                  )}
                  isSearchable={false}
                  placeholder="Choose One"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center md:space-x-24 border-b border-gray-200 pt-6 pb-6">
              <label className="font-semibold whitespace-nowrap w-[210px] sm:w-60 mr-6 sm:mr-0">
                Are lectures recorded?<span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-4 mt-3 sm:mt-0">
                <button
                  onClick={() => setLectures(true)}
                  className={`px-5 py-2 rounded-2xl transition-all duration-200 ${
                    lectures === true
                      ? "bg-gray-500 text-white hover:brightness-90"
                      : "bg-gray-100 text-gray-500 hover:brightness-90"
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setLectures(false)}
                  className={`px-5 py-2 rounded-2xl transition-all duration-200 ${
                    lectures === false
                      ? "bg-gray-500 text-white hover:brightness-90"
                      : "bg-gray-100 text-gray-500 hover:brightness-90"
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center md:space-x-24 border-b border-gray-200 pt-6 pb-6">
              <label className="font-semibold whitespace-nowrap w-[210px] sm:w-60 mr-6 sm:mr-0">
                Was attendance mandatory?<span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-4 mt-3 sm:mt-0">
                <button
                  onClick={() => setAttendance(true)}
                  className={`px-5 py-2 rounded-2xl transition-all duration-200 ${
                    attendance === true
                      ? "bg-gray-500 text-white hover:brightness-90"
                      : "bg-gray-100 text-gray-500 hover:brightness-90"
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setAttendance(false)}
                  className={`px-5 py-2 rounded-2xl transition-all duration-200 ${
                    attendance === false
                      ? "bg-gray-500 text-white hover:brightness-90"
                      : "bg-gray-100 text-gray-500 hover:brightness-90"
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center md:space-x-24 border-b border-gray-200 pt-6 pb-6">
              <label className="font-semibold whitespace-nowrap w-[210px] sm:w-60 mr-6 sm:mr-0">
                Were there practice exams?
                <span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-4 mt-3 sm:mt-0">
                <button
                  onClick={() => setPractice(true)}
                  className={`px-5 py-2 rounded-2xl transition-all duration-200 ${
                    practice === true
                      ? "bg-gray-500 text-white hover:brightness-90"
                      : "bg-gray-100 text-gray-500 hover:brightness-90"
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setPractice(false)}
                  className={`px-5 py-2 rounded-2xl transition-all duration-200 ${
                    practice === false
                      ? "bg-gray-500 text-white hover:brightness-90"
                      : "bg-gray-100 text-gray-500 hover:brightness-90"
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center md:space-x-24 border-b border-gray-200 pt-6 pb-6">
              <label className="font-semibold whitespace-nowrap w-[210px] sm:w-60 mr-6 sm:mr-0">
                Were any exams dropped?<span className="text-red-500">*</span>
              </label>
              <div className="flex space-x-4 mt-3 sm:mt-0">
                <button
                  onClick={() => setDropped(true)}
                  className={`px-5 py-2 rounded-2xl transition-all duration-200 ${
                    dropped === true
                      ? "bg-gray-500 text-white hover:brightness-90"
                      : "bg-gray-100 text-gray-500 hover:brightness-90"
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => setDropped(false)}
                  className={`px-5 py-2 rounded-2xl transition-all duration-200 ${
                    dropped === false
                      ? "bg-gray-500 text-white hover:brightness-90"
                      : "bg-gray-100 text-gray-500 hover:brightness-90"
                  }`}
                >
                  No
                </button>
              </div>
            </div>
            <div className="sm:border-b border-gray-200 sm:pt-2 sm:pb-3"></div>

            {/* Write a Review */}
            <label className="block font-semibold pt-6 pb-6">
              Write a Review:<span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full p-2 h-32 resize-y bg-gray-100 border rounded-lg mb-4 
              focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            ></textarea>
            <div className="border-t border-gray-200 pb-8"></div>
            {/* Submit Button */}
            <div className="flex justify-center pb-10">
              <button
                onClick={handleSubmit}
                className="w-48 px-4 py-2 bg-gray-200 text-gray-500 font-semibold rounded-xl hover:brightness-90 shadow-md shadow-gray-300"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default WriteReview;
