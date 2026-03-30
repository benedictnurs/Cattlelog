import React from "react";
import { Link } from "react-router-dom";
import posthog from "posthog-js";

const AboutSection = () => {
  return (
    <div className="mx-12 my-10 md:mx-24 2xl:mx-60 sm:my-24">
      <div className="bg-gradient-to-r from-[#0f293a] to-[#2c75a4] rounded-lg shadow-lg p-8 mb-12 text-center">
        <h2 className="text-white text-xl sm:text-3xl font-bold mb-4">
          Ready to Find Your Perfect Classes?
        </h2>
        <p className="mb-6 text-base sm:text-lg text-blue-100">
          Discover top-rated courses, compare professors, and explore exclusive
          grade distributions in seconds.
        </p>
        <Link
          to="/home"
          onClick={() => posthog.capture("about_page_button_clicked")}
          className="inline-block bg-white text-[#2c75a4] font-bold py-2 px-4 sm:py-3 sm:px-8 rounded-full hover:bg-blue-50 transform hover:scale-105 transition duration-300 shadow-md whitespace-nowrap text-sm sm:text-base md:w-1/2 text-center"
        >
          Start Searching Now →
        </Link>

        <p className="mt-4 text-sm text-blue-200">
          Join thousands of UC Davis students making smarter course decisions
        </p>
      </div>

      <h1 className="text-lg sm:text-3xl font-bold sm:mb-4">About</h1>
      <p className="text-base sm:text-base mt-2 mb-8 sm:mx-0 sm:my-0 sm:mb-16">
        Cattlelog is a platform that helps students find courses and professor
        reviews at UCD. Sort by ratings, filter by requirements and easily
        browse professor reviews for all quarters—past and current. Cattlelog is
        also the only source of the UC Davis 2024-2025 grade distributions. The
        website has grade distributions for every course taken between Fall 2024
        and Spring 2025.
        <br />
        <br />
        Cattlelog is built by <a href="https://aggieworks.org/">AggieWorks</a>,
        a student-run, product development organization that builds software for
        students at UC Davis. AggieWorks consists of a dynamic community of
        engineers, designers, product managers, and marketers who are passionate
        about enhancing student life through innovative solutions.
      </p>

      <section className="mt-10 sm:mt-16">
        <h2 className="text-lg sm:text-3xl font-bold border-b border-gray-300 pb-2 sm:py-2">
          How it Works
        </h2>

        <div className="py-6 border-b border-gray-300">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-6">
            <div>
              <h3 className="text-lg sm:text-2xl font-semibold">
                Course & Professor Catalog
              </h3>
              <p className="mt-2 sm:text-base">
                To search for a course, click the “View All Courses” button and
                type in the course prefix and number into the search bar, such
                as “MAT21A”. Courses can also be queried by course name or
                keywords such as “Calculus”.
                <br />
                <br />
                To look up a professor, enter either first or last name of the
                professor into the search bar.
              </p>
            </div>
            <Link to="/home" className="w-full md:w-auto">
              <button
                className="w-full md:w-[300px] bg-[#C1D8E8] text-black font-semibold text-[16px] px-6 py-2 shadow-[0_10px_20px_0_rgba(0,0,0,0.3)] rounded-full hover:bg-[#AEC2D1] transition"
                onClick={() =>
                  posthog.capture("landing_page_view_all_courses_clicked", {
                    location: "AboutSection",
                  })
                }
              >
                <div className="flex items-center justify-center gap-3">
                  <img
                    src="/book-course.svg"
                    className="w-[21px] h-[24px]"
                    alt=""
                  />
                  <span>View All Courses</span>
                </div>
              </button>
            </Link>
          </div>
        </div>

        <div className="py-6 border-b border-gray-300">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-6">
            <div>
              <h3 className="text-lg sm:text-2xl font-semibold">
                Grade Distributions
              </h3>
              <p className="mt-2 sm:text-base">
                To view grade distributions of all professors who have taught a
                course, select the “View Grade Distributions” button underneath
                the search bar. Then, look up a course by prefix and number,
                select the chosen course in the drop down, and choose any number
                of professors who have taught that course to compare.
              </p>
            </div>
            <Link to="/grade-distribution" className="w-full md:w-auto">
              <button
                className="w-full md:w-[300px] bg-[#E4B540] text-black font-semibold text-[16px] px-6 py-2 rounded-full hover:bg-[#CDA33A] shadow-[0_10px_20px_0_rgba(0,0,0,0.3)] transition"
                onClick={() =>
                  posthog.capture("landing_page_grade_distributions_clicked", {
                    location: "AboutSection",
                  })
                }
              >
                <div className="flex items-center justify-center gap-3">
                  <img
                    src="/chart-grade.svg"
                    className="w-[24px] h-[18px]"
                    alt=""
                  />
                  <span>View Grade Distributions</span>
                </div>
              </button>
            </Link>
          </div>
        </div>

        <div className="py-6 border-b border-gray-300">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-6">
            <div>
              <h3 className="text-lg sm:text-2xl font-semibold">
                Course & Professor Reviews
              </h3>
              <p className="mt-2 sm:text-base">
                The website has reviews both pulled from other professor review
                websites, as well as our built-in review feature. To leave a
                review for a course that you took on Cattlelog, click the write
                a review button and fill out the prompted information on the
                review form about the experience you had.
              </p>
            </div>
            <Link to="/write-review" className="w-full md:w-auto">
              <button
                className="w-full md:w-[300px] bg-[#E5D9B9] text-black font-semibold text-[16px] px-6 py-2 rounded-full hover:bg-[#CEC3A6] transition shadow-[0_10px_20px_0_rgba(0,0,0,0.3)]"
                onClick={() =>
                  posthog.capture("landing_page_write_review_clicked", {
                    location: "AboutSection",
                  })
                }
              >
                <div className="flex items-center justify-center gap-3">
                  <img
                    src="/write-review.svg"
                    className="w-[24px] h-[24px]"
                    alt=""
                  />
                  <span>Write a Review</span>
                </div>
              </button>
            </Link>
          </div>
        </div>

        <div className="py-6 border-b border-gray-300">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-6">
            <div>
              <h3 className="text-lg sm:text-2xl font-semibold">
                Schedule Comparison
              </h3>
              <p className="mt-2 sm:text-base">
                By entering your name and selecting any courses to build your
                schedule with, you can find a difficulty rating based on
                professor data and grade history. You can also share this
                schedule with your friends to allow them to compare their course
                load with yours.
              </p>
            </div>
            <Link to="/cooked/start" className="w-full md:w-auto">
              <button
                className="w-full md:w-[300px] bg-[#364149] text-white font-semibold text-[16px] px-6 py-2 rounded-full hover:bg-[#313A42] transition shadow-[0_10px_20px_0_rgba(0,0,0,0.3)]"
                onClick={() =>
                  posthog.capture("landing_page_course_comparison_clicked", {
                    location: "AboutSection",
                  })
                }
              >
                <div className="flex items-center justify-center gap-3">
                  <img
                    src="/schedule-compare.svg"
                    className="w-[21px] h-[20px]"
                    alt=""
                  />
                  <span>Schedule Comparison</span>
                </div>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <h2 className="text-lg sm:text-3xl font-bold border-b border-gray-300 pb-2 sm:py-2 mt-16">
        FAQs
      </h2>

      <div className="border-b border-gray-300 sm:text-xl">
        <p className="font-bold py-4">What is Cattlelog?</p>
        <p className="py-2 sm:text-base">
          Cattlelog is a course discovery website that combines both professor
          reviews with actively updated Schedule Builder data, so it’s easy to
          find the best classes to fulfill your requirements. On Cattlelog, you
          can filter courses by subject or GE requirements, sort courses by the
          professor ratings and easily see which professors are offering a
          course in the upcoming quarter. We also have exclusive grade
          distributions for all courses between Fall 2024 and Spring 2025, to
          allow you to easily compare grade averages for different professors.
        </p>
      </div>

      <div className="border-b border-gray-300 sm:text-xl">
        <p className="font-bold py-4">Is Cattlelog free to use?</p>
        <p className="py-2 sm:text-base">
          Yes, Cattlelog is completely free to use for all UC Davis students!
        </p>
      </div>

      <div className="border-b border-gray-300 sm:text-xl">
        <p className="font-bold py-4">
          Where does Cattlelog get their grade distributions?
        </p>
        <p className="py-2 sm:text-base">
          Our grade distributions are sourced directly from UC Davis.
        </p>
      </div>

      <div className="border-b border-gray-300 sm:text-xl">
        <p className="font-bold py-4">
          How accurate are the grade distributions on Cattlelog?
        </p>
        <p className="py-2 sm:text-base">
          Cattlelog's grade distributions are based on official UC Davis records
          for Fall 2024 through Spring 2025. They are the most accurate and
          comprehensive available for this time period.
        </p>
      </div>

      <div className="border-b border-gray-300 sm:text-xl">
        <p className="font-bold py-4">
          Can I see grade distributions for all UC Davis courses?
        </p>
        <p className="py-2 sm:text-base">
          Cattlelog provides grade distributions for every course taught at UC
          Davis between Fall 2024 and Spring 2025. If a course was offered
          during this period, you'll be able to view its grade distribution.
        </p>
      </div>

      <div className="border-b border-gray-300 sm:text-xl">
        <p className="font-bold py-4">
          How often is the grade distribution data updated?
        </p>
        <p className="py-2 sm:text-base">
          Grade distribution data is updated at the end of each quarter after
          grades are finalized and processed by the university.
        </p>
      </div>

      <div className="border-b border-gray-300 sm:text-xl">
        <p className="font-bold py-4">
          I have an issue with Cattlelog, or I encountered a bug while using it.
        </p>
        <p className="py-2 sm:text-base">
          We love to hear feedback from all UC Davis students using our website!
          If you have any questions, comments or encountered any issues while
          using Cattlelog, please let us know by filling out this feedback{" "}
          <a
            className="underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
            href="https://airtable.com/appqLRpTDmd1BrR3s/shrHJaUItHhO3Ee27"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => posthog.capture("clicked_feedback")}
          >
            form
          </a>
          .
        </p>
      </div>

      <div className="border-b border-gray-300 sm:text-xl">
        <p className="font-bold py-4">How can I contribute to Cattlelog?</p>
        <p className="py-2 sm:text-base">
          You can contribute by writing professor reviews, reporting any
          inaccuracies, and spreading the word to other UC Davis students. Your
          feedback helps improve the platform for everyone.
        </p>
      </div>
    </div>
  );
};

export default AboutSection;
