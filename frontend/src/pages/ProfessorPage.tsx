import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchProfessor } from "../api/GetProfessor";
import { fetchProfessorSummary } from "../api/GetProfessorSummary";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Helmet } from "react-helmet";
import { Loading } from "../components/Loading";
import ProfessorView, {
  ClassInfoProps,
  ReviewProps,
} from "../components/professor_page/ProfessorView";
import { ChevronLeft } from "lucide-react";
import CourseDropdown from "../components/professor_page/CourseDropdown";
import { CorysInsights } from "../components/professor_page/CoryInsights/CoryInsights";
import CoryInsightsSkeleton from "../components/professor_page/CoryInsights/CoryInsightsSkeleton";
import { ratingBgColor, displayRating } from "../utils/rating";
import { usePostHog } from "posthog-js/react";

const CACHE_EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes

const ProfessorPage: React.FC = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(null);
  const posthog = usePostHog();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const handleFeedback = (isPositive: boolean) => {
    setFeedbackGiven(isPositive);
    posthog?.capture("summary_helpful_feedback", {
      positive: isPositive,
      professor_identifier: identifier,
      professor_name: professor?.professor_name,
    });
  };

  // Use React Query instead of manual useEffect
  const {
    data: rawData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["professor", identifier],
    queryFn: () => fetchProfessor(identifier!),
    enabled: !!identifier,
    staleTime: CACHE_EXPIRY_TIME,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  console.log("Raw Data:", rawData);

  // Fetch AI-generated professor summary using the professor data
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["professorSummary", identifier, rawData?.professor_id],
    queryFn: () => fetchProfessorSummary(rawData),
    enabled: !!rawData && !!rawData.classes && rawData.classes.length > 0,
    staleTime: CACHE_EXPIRY_TIME,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  console.log("Summary Data:", summaryData);
  // Process the data
  const professor = useMemo(() => {
    if (!rawData) return null;

    // De-duplicate identical review texts across all classes
    const usedReviewTexts = new Set<string>();
    const classInfo: ClassInfoProps[] = (rawData.classes || []).map(
      (classItem: any) => {
        const uniqueReviews = (classItem.reviews || []).filter(
          (review: any) => {
            const text = (review.review || "").trim();
            if (usedReviewTexts.has(text)) return false;
            usedReviewTexts.add(text);
            return true;
          },
        );

        const reviews: ReviewProps[] = uniqueReviews.map((review: any) => {
          const dt = review.date ? new Date(review.date) : null;
          return {
            quality_rating:
              Math.round(parseFloat(review.quality_rating)) || "N/A",
            difficulty_rating:
              Math.round(parseFloat(review.difficulty_rating)) || "N/A",
            tags: review.tags || [],
            date_written: dt
              ? `${dt.getMonth() + 1}/${dt.getDate()}/${dt.getFullYear()}`
              : "xx/xx/xxxx",
            review: review.review || "No review available",
            term: review.term,
            unique_review: review.unique_review,
          };
        });

        return {
          course_id: classItem.course_id || "N/A",
          course_title: classItem.course_title || "No Title Available",
          reviews,
        };
      },
    );

    return {
      professor_name: rawData.professor_name || "Unknown",
      dept: rawData.department || "Undefined",
      overall_rating: rawData.overall_rating,
      level_of_difficulty: rawData.level_of_difficulty,
      class_info: classInfo,
    };
  }, [rawData]);

  console.log("Class Info:", professor);

  const displayOverallRating = displayRating(professor?.overall_rating, 1);
  const displayDifficulty = displayRating(professor?.level_of_difficulty, 1);

  const displayDept = useMemo(() => {
    const raw = professor?.dept || "";
    const [, after] = raw.split("in the ");
    const name = after?.split(" department")[0]?.trim();
    return name ? `${name} Department` : "Unknown Department";
  }, [professor?.dept]);

  const formattedCourseIds = useMemo(() => {
    const courses = professor?.class_info ?? [];
    return [
      {
        value: "",
        label: "All Courses",
        count: courses.reduce((acc, c) => acc + c.reviews.length, 0),
      },
      ...courses.map((c) => ({
        value: c.course_id,
        label: c.course_id,
        count: c.reviews.length,
      })),
    ];
  }, [professor?.class_info]);

  const filteredClasses = useMemo(() => {
    const courses = professor?.class_info ?? [];
    return selectedCourse
      ? courses.filter((c) => c.course_id === selectedCourse)
      : courses;
  }, [professor?.class_info, selectedCourse]);

  const reviewCount = useMemo(
    () => filteredClasses.reduce((acc, c) => acc + c.reviews.length, 0),
    [filteredClasses],
  );

  if (isLoading) return <Loading />;
  if (error) return <p>Error loading professor data.</p>;
  if (!professor) return <p>Professor not found.</p>;

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{professor.professor_name} - Professor Details</title>
        <meta
          name="description"
          content={`Learn more about Professor ${professor.professor_name} from the ${professor.dept} department at UC Davis. Overall rating: ${professor.overall_rating}.`}
        />
        <meta
          name="keywords"
          content="UC Davis, grade distributions, professor, rating, reviews, difficulty, department"
        />
        <link rel="canonical" href="https://daviscattlelog.com/" />
        <meta property="og:url" content="https://daviscattlelog.com/" />
        <meta property="og:type" content="website" />
      </Helmet>

      <Header />

      <main className="flex-1">
        <div className="m-5 ml-5 sm:my-10 sm:ml-10">
          <div className="flex justify-start sm:gap-10">
            <div className="flex justify-start items-start h-full">
              <button onClick={handleBack}>
                <ChevronLeft className="size-10 sm:size-12 stroke-2" />
              </button>
            </div>
            <div className="mr-4">
              <h1
                className={`flex justify-center items-center text-white w-[60px] h-[56px] sm:w-24 sm:h-24 text-2xl sm:text-4xl rounded-lg sm:rounded-xl font-bold ${ratingBgColor(
                  professor.overall_rating,
                )}`}
              >
                {displayOverallRating}
              </h1>
            </div>
            <div className="flex flex-col">
              <div className="flex flex-col justify-center">
                <h2 className="text-[18px] sm:text-[24px] font-bold">
                  {professor.professor_name}
                </h2>
                <h4 className="text-gray-500 text-[13px] sm:text-[18px] sm:mt-1">
                  {displayDept}
                </h4>
                <div className="flex gap-1 text-gray-400 text-[13px] sm:text-[18px]">
                  <h4>Overall Difficulty:</h4>
                  {displayDifficulty === "--" ? "N/A" : displayDifficulty}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Section - Cory's Insights */}
          <div className="md:px-10">
            {isSummaryLoading ? (
              <CoryInsightsSkeleton />
            ) : (
              <CorysInsights
                summary={summaryData?.summary}
                onFeedback={handleFeedback}
                feedbackGiven={feedbackGiven}
                showFeedback={true}
              />
            )}
          </div>

          {/* title + dropdown */}
          <div className="md:pl-10">
            <div className="flex mt-7 justify-start items-center gap-14">
              <h4 className="text-[18px] sm:text-[20px] font-bold">Reviews</h4>
              <CourseDropdown
                items={formattedCourseIds}
                value={selectedCourse}
                onChange={setSelectedCourse}
                totalCount={reviewCount}
              />
            </div>

            <div className="border-b border-slate-200 mt-6 sm:mr-9" />
            {/* Reviews list */}
            <div className="mt-7">
              {filteredClasses.length === 0 ? (
                <div className="mt-12 text-center text-gray-600">
                  <h2 className="text-2xl font-semibold mb-2">
                    No reviews found
                  </h2>
                  <p>This professor doesn't have any published reviews yet.</p>
                </div>
              ) : (
                filteredClasses.map((course) => (
                  <ProfessorView key={course.course_id} course={course} />
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfessorPage;
