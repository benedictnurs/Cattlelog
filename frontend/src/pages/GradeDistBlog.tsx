import { useState, useEffect } from "react";
import {
  ChevronRight,
  Star,
  Search,
  BarChart2,
  Book,
  User,
  Filter,
} from "lucide-react";
import { Helmet } from "react-helmet";

export default function CattlelogBlog() {
  const [activeTab, setActiveTab] = useState("guide");

  // SEO: Track user engagement with useEffect
  useEffect(() => {
    // Track page views
    if (typeof window !== "undefined") {
      // Log page view (would connect to analytics in production)
      console.log("Page viewed: Cattlelog Grade Distribution Guide");

      // Clean up listeners if needed
      return () => {
        // Clean up code here
      };
    }
  }, [activeTab]);

  // SEO: Structured data for rich results
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline:
      "How to Access Grade Distributions with Cattlelog - UC Davis Course Guide",
    description:
      "Learn how to access and analyze UC Davis grade distributions with Cattlelog. Step-by-step guide to finding course grades from Fall 2022 to Fall 2024.",
    image: "https://daviscattlelog.com/assets/cattlelog-hero-image.jpg",
    author: {
      "@type": "Organization",
      name: "Cattlelog",
      url: "https://daviscattlelog.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Cattlelog",
      logo: {
        "@type": "ImageObject",
        url: "https://daviscattlelog.com/assets/cattlelog-logo.png",
      },
    },
    datePublished: new Date().toISOString().split("T")[0],
    dateModified: new Date().toISOString().split("T")[0],
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": "https://daviscattlelog.com/blog/grade-distributions-guide",
    },
  };

  // SEO: FAQ Schema for FAQ section
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How accurate are the grade distributions on Cattlelog?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Cattlelog's grade distributions are based on official UC Davis records for Fall 2022 through Fall 2024. They are the most accurate and comprehensive available for this time period.",
        },
      },
      {
        "@type": "Question",
        name: "Do I need a UC Davis email to access grade distributions?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, you need to create an account with your UC Davis email to access the complete grade distribution data. This ensures that the resource remains exclusive to UC Davis students.",
        },
      },
      {
        "@type": "Question",
        name: "Can I see grade distributions for all UC Davis courses?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Cattlelog provides grade distributions for every course taught at UC Davis between Fall 2022 and Fall 2024. If a course was offered during this period, you'll be able to view its grade distribution.",
        },
      },
      {
        "@type": "Question",
        name: "How often is the grade distribution data updated?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Grade distribution data is updated at the end of each quarter after grades are finalized and processed by the university.",
        },
      },
      {
        "@type": "Question",
        name: "Is Cattlelog free to use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, Cattlelog is completely free for all UC Davis students. Simply sign up with your UC Davis email to access all features.",
        },
      },
      {
        "@type": "Question",
        name: "How can I contribute to Cattlelog?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can contribute by writing professor reviews, reporting any inaccuracies, and spreading the word to other UC Davis students. Your feedback helps improve the platform for everyone.",
        },
      },
    ],
  };

  // SEO: BreadcrumbList schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://daviscattlelog.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: "https://daviscattlelog.com/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Grade Distributions Guide",
        item: "https://daviscattlelog.com/blog/grade-distributions-guide",
      },
    ],
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* SEO: Added Head with meta tags */}
      <Helmet>
        <title>
          UC Davis Grade Distributions Guide | Cattlelog - Access Course Grade
          Data
        </title>
        <meta
          name="description"
          content="Learn how to access and analyze UC Davis grade distributions with Cattlelog. Comprehensive guide to finding professors' grading patterns for all courses from Fall 2022 to Fall 2024."
        />
        <meta
          name="keywords"
          content="UC Davis grades, grade distributions, Cattlelog, UC Davis courses, professor ratings, Davis course search, UC Davis GPA, college course selection, UC Davis academic planning"
        />

        {/* Open Graph tags for social sharing */}
        <meta
          property="og:title"
          content="UC Davis Grade Distributions Guide | Cattlelog"
        />
        <meta
          property="og:description"
          content="Access complete UC Davis grade distributions from Fall 2022-Fall 2024. Make informed course decisions with Cattlelog's comprehensive grade data."
        />
        <meta
          property="og:image"
          content="https://daviscattlelog.com/assets/og-image.jpg"
        />
        <meta
          property="og:url"
          content="https://daviscattlelog.com/blog/grade-distributions-guide"
        />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Cattlelog" />

        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="UC Davis Grade Distributions Guide | Cattlelog"
        />
        <meta
          name="twitter:description"
          content="Access complete UC Davis grade distributions from Fall 2022-Fall 2024. Make informed course decisions with Cattlelog."
        />
        <meta
          name="twitter:image"
          content="https://daviscattlelog.com/assets/twitter-card.jpg"
        />

        {/* SEO Canonical tag to prevent duplicate content issues */}
        <link
          rel="canonical"
          href="https://daviscattlelog.com/blog/grade-distributions-guide"
        />

        {/* SEO: Mobile optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* SEO: Structured data JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>

        {/* SEO: Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </Helmet>

      {/* Header with semantic HTML5 elements for better SEO */}
      <header className="bg-slate-900 text-white shadow-lg" role="banner">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {/* SEO: Added aria-label for accessibility */}
            <a
              href="/"
              className="flex items-center"
              aria-label="Cattlelog Blog Home"
            >
              <div className="font-bold text-2xl text-yellow-400">
                Cattlelog
              </div>
              <span className="text-sm bg-yellow-400 text-slate-900 px-2 py-1 rounded">
                BLOG
              </span>
            </a>
          </div>
          {/* SEO: Added proper navigation role and aria-label */}
          <nav
            className="hidden md:flex space-x-6"
            role="navigation"
            aria-label="Main Navigation"
          >
            <a href="/about" className="text-gray-300 hover:text-yellow-300">
              About
            </a>
          </nav>
          <a
            href="https://daviscattlelog.com?utm_source=blog"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-2 px-4 rounded"
            aria-label="Visit Cattlelog Website"
          >
            Visit Cattlelog
          </a>
        </div>
      </header>

      {/* Main Content with semantic HTML5 elements */}
      <main className="flex-grow container mx-auto px-4 py-8" id="main-content">
        <div className="max-w-4xl mx-auto">
          {/* SEO: Added proper heading structure and schema.org attributes */}
          {/* Hero Section */}
          <section
            className="bg-slate-900 rounded-lg p-8 mb-8 text-white relative overflow-hidden"
            aria-labelledby="hero-heading"
          >
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-8 left-8 w-32 h-32 rounded-full bg-yellow-400"></div>
              <div className="absolute bottom-8 right-8 w-48 h-48 rounded-full bg-yellow-400"></div>
            </div>
            <div className="relative z-10">
              {/* SEO: Using proper h1 tag for main heading */}
              <h1 id="hero-heading" className="text-4xl font-bold mb-4">
                How to Access{" "}
                <span className="text-yellow-400">Grade Distributions</span>{" "}
                with Cattlelog
              </h1>
              <p className="text-lg mb-6">
                The ultimate guide to finding and understanding course grade
                distributions at UC Davis
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="https://daviscattlelog.com?utm_source=blog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-3 px-6 rounded-lg flex items-center"
                  aria-label="Get Started with Cattlelog"
                >
                  Get Started <ChevronRight className="ml-2" size={20} />
                </a>
              </div>
            </div>
          </section>

          {/* Tab Navigation with proper ARIA attributes */}
          <div
            className="flex mb-8 border-b border-gray-200"
            role="tablist"
            aria-label="Guide Content Tabs"
          >
            <button
              onClick={() => setActiveTab("guide")}
              className={`py-3 px-5 font-medium ${activeTab === "guide" ? "text-yellow-400 border-b-2 border-yellow-400" : "text-gray-500 hover:text-slate-900"}`}
              role="tab"
              id="tab-guide"
              aria-selected={activeTab === "guide"}
              aria-controls="panel-guide"
            >
              Step-by-Step Guide
            </button>
            <button
              onClick={() => setActiveTab("features")}
              className={`py-3 px-5 font-medium ${activeTab === "features" ? "text-yellow-400 border-b-2 border-yellow-400" : "text-gray-500 hover:text-slate-900"}`}
              role="tab"
              id="tab-features"
              aria-selected={activeTab === "features"}
              aria-controls="panel-features"
            >
              Key Features
            </button>
            <button
              onClick={() => setActiveTab("faq")}
              className={`py-3 px-5 font-medium ${activeTab === "faq" ? "text-yellow-400 border-b-2 border-yellow-400" : "text-gray-500 hover:text-slate-900"}`}
              role="tab"
              id="tab-faq"
              aria-selected={activeTab === "faq"}
              aria-controls="panel-faq"
            >
              FAQ
            </button>
          </div>

          {/* Guide Content with rich semantic markup */}
          {activeTab === "guide" && (
            <div id="panel-guide" role="tabpanel" aria-labelledby="tab-guide">
              <div className="prose max-w-none">
                <h2
                  className="text-2xl font-bold text-slate-900 mb-4"
                  id="guide-heading"
                >
                  Step-by-Step Guide to Accessing UC Davis Grade Distributions
                </h2>

                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                  <h3
                    className="text-xl font-bold text-slate-900 mb-4 flex items-center"
                    id="step-1"
                  >
                    <span className="inline-flex justify-center items-center w-8 h-8 rounded-full bg-yellow-400 text-slate-900 mr-3">
                      1
                    </span>
                    Create an Account or Log In
                  </h3>
                  <p className="mb-4">
                    Visit{" "}
                    <a
                      href="https://daviscattlelog.com?utm_source=blog"
                      className="text-yellow-600 hover:underline font-medium"
                    >
                      daviscattlelog.com
                    </a>{" "}
                    and create an account using your UC Davis email, or log in
                    if you already have an account.
                  </p>
                  <div className="bg-slate-100 p-4 rounded-lg mb-4">
                    <p className="text-sm text-slate-700">
                      <strong>Pro Tip:</strong> Signing up with your UC Davis
                      email gives you full access to all grade distribution
                      data.
                    </p>
                  </div>
                  <div className="border-l-4 border-yellow-400 pl-4 italic text-slate-600">
                    "Cattlelog is the only source with official UC Davis grade
                    distributions from Fall 2022 to Fall 2024."
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                  <h3
                    className="text-xl font-bold text-slate-900 mb-4 flex items-center"
                    id="step-2"
                  >
                    <span className="inline-flex justify-center items-center w-8 h-8 rounded-full bg-yellow-400 text-slate-900 mr-3">
                      2
                    </span>
                    Navigate to Course Search
                  </h3>
                  <p className="mb-4">
                    Once logged in, use the navigation bar at the top of the
                    page to access the course search feature.
                  </p>
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-1 bg-slate-100 p-4 rounded-lg">
                      <div className="flex items-center text-slate-800 mb-2">
                        <Filter size={18} className="mr-2" />
                        <strong>Filter</strong>
                      </div>
                      <p className="text-sm">
                        Filter for classes by department, course number, or GE
                        requirements
                      </p>
                    </div>
                    <div className="flex-1 bg-slate-100 p-4 rounded-lg">
                      <div className="flex items-center text-slate-800 mb-2">
                        <Search size={18} className="mr-2" />
                        <strong>Search</strong>
                      </div>
                      <p className="text-sm">
                        Search for specific courses, professors, or keywords
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                  <h3
                    className="text-xl font-bold text-slate-900 mb-4 flex items-center"
                    id="step-3"
                  >
                    <span className="inline-flex justify-center items-center w-8 h-8 rounded-full bg-yellow-400 text-slate-900 mr-3">
                      3
                    </span>
                    Find Your Course
                  </h3>
                  <p className="mb-4">
                    Browse through the list of courses or use the search
                    functionality to find the specific course you're interested
                    in.
                  </p>
                  <ul className="list-disc pl-5 mb-4 space-y-2">
                    <li>
                      Use department codes (e.g.,{" "}
                      <span className="font-semibold">ECN, CHE, BIS</span>) to
                      narrow your search
                    </li>
                    <li>Enter course numbers for specific courses</li>
                    <li>
                      Filter by quarter or year to find historical offerings
                    </li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                  <h3
                    className="text-xl font-bold text-slate-900 mb-4 flex items-center"
                    id="step-4"
                  >
                    <span className="inline-flex justify-center items-center w-8 h-8 rounded-full bg-yellow-400 text-slate-900 mr-3">
                      4
                    </span>
                    View Grade Distributions
                  </h3>
                  <p className="mb-4">
                    Once you've found your course, click on the "Grade
                    Distributions" button or tab to view the detailed breakdown.
                  </p>
                  <div className="bg-slate-900 text-white p-4 rounded-lg mb-4">
                    <h4 className="font-bold mb-2">
                      Grade Distribution Features:
                    </h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>
                        Bar charts showing the distribution of grades (A+
                        through F)
                      </li>
                      <li>Compare distributions across different professors</li>
                      <li>View historical trends across quarters</li>
                      <li>See average GPA for each professor and section</li>
                    </ul>
                  </div>
                  <div className="bg-yellow-100 p-4 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Grade distributions are available
                      for all courses from Fall 2022 through Fall 2024, making
                      Cattlelog the most comprehensive source of this
                      information.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                  <h3
                    className="text-xl font-bold text-slate-900 mb-4 flex items-center"
                    id="step-5"
                  >
                    <span className="inline-flex justify-center items-center w-8 h-8 rounded-full bg-yellow-400 text-slate-900 mr-3">
                      5
                    </span>
                    Analyze and Compare
                  </h3>
                  <p className="mb-4">
                    Use Cattlelog's comparison tools to make informed decisions
                    about your courses:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-100 p-4 rounded-lg">
                      <div className="flex items-center text-slate-800 mb-2">
                        <User size={18} className="mr-2" />
                        <strong>Compare Professors</strong>
                      </div>
                      <p className="text-sm">
                        See which professors have higher average grades for the
                        same course
                      </p>
                    </div>
                    <div className="bg-slate-100 p-4 rounded-lg">
                      <div className="flex items-center text-slate-800 mb-2">
                        <Book size={18} className="mr-2" />
                        <strong>Course Difficulty</strong>
                      </div>
                      <p className="text-sm">
                        Gauge course difficulty by reviewing grade distributions
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Features Content */}
          {activeTab === "features" && (
            <div
              id="panel-features"
              role="tabpanel"
              aria-labelledby="tab-features"
            >
              <h2
                className="text-2xl font-bold text-slate-900 mb-6"
                id="features-heading"
              >
                Key Features of Cattlelog for UC Davis Students
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mr-4">
                      <BarChart2 size={24} className="text-yellow-400" />
                    </div>
                    <h3
                      className="text-xl font-bold text-slate-900"
                      id="feature-1"
                    >
                      Grade Distributions
                    </h3>
                  </div>
                  <p className="text-slate-700">
                    Access comprehensive grade distribution data for all UC
                    Davis courses from Fall 2022 to Fall 2024. View detailed
                    breakdowns by professor, quarter, and course section.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mr-4">
                      <Star size={24} className="text-yellow-400" />
                    </div>
                    <h3
                      className="text-xl font-bold text-slate-900"
                      id="feature-2"
                    >
                      Professor Reviews
                    </h3>
                  </div>
                  <p className="text-slate-700">
                    Read and write authentic reviews of professors from fellow
                    UC Davis students. Get insights into teaching styles, course
                    difficulty, and overall experience.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mr-4">
                      <Filter size={24} className="text-yellow-400" />
                    </div>
                    <h3
                      className="text-xl font-bold text-slate-900"
                      id="feature-3"
                    >
                      Advanced Filtering
                    </h3>
                  </div>
                  <p className="text-slate-700">
                    Filter courses by department, requirement satisfaction,
                    professor rating, and more. Easily find courses that meet
                    your specific academic needs.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mr-4">
                      <Search size={24} className="text-yellow-400" />
                    </div>
                    <h3
                      className="text-xl font-bold text-slate-900"
                      id="feature-4"
                    >
                      Course Discovery
                    </h3>
                  </div>
                  <p className="text-slate-700">
                    Discover new courses and professors based on your interests
                    and requirements. Find hidden gems that align with your
                    academic goals.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4" id="uc-davis-exclusive">
                  UC Davis Exclusive
                </h3>
                <p className="mb-4">
                  Cattlelog is exclusively designed for UC Davis students,
                  providing the most relevant and accurate information for your
                  academic journey.
                </p>
                <div className="flex justify-center">
                  <a
                    href="https://daviscattlelog.com?utm_source=blog"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-3 px-6 rounded-lg inline-flex items-center"
                    aria-label="Visit the Cattlelog Website"
                  >
                    Visit daviscattlelog.com{" "}
                    <ChevronRight className="ml-2" size={20} />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* FAQ Content with schema.org markup */}
          {activeTab === "faq" && (
            <div id="panel-faq" role="tabpanel" aria-labelledby="tab-faq">
              <h2
                className="text-2xl font-bold text-slate-900 mb-6"
                id="faq-heading"
              >
                Frequently Asked Questions About Cattlelog Grade Distributions
              </h2>

              <div className="space-y-4">
                <div
                  className="bg-white p-6 rounded-lg shadow-md"
                  itemScope
                  itemType="https://schema.org/Question"
                >
                  <h3
                    className="text-lg font-bold text-slate-900 mb-2"
                    id="faq-1"
                    itemProp="name"
                  >
                    How accurate are the grade distributions on Cattlelog?
                  </h3>
                  <div
                    itemScope
                    itemProp="acceptedAnswer"
                    itemType="https://schema.org/Answer"
                  >
                    <p className="text-slate-700" itemProp="text">
                      Cattlelog's grade distributions are based on official UC
                      Davis records for Fall 2022 through Fall 2024. They are
                      the most accurate and comprehensive available for this
                      time period.
                    </p>
                  </div>
                </div>

                <div
                  className="bg-white p-6 rounded-lg shadow-md"
                  itemScope
                  itemType="https://schema.org/Question"
                >
                  <h3
                    className="text-lg font-bold text-slate-900 mb-2"
                    id="faq-2"
                    itemProp="name"
                  >
                    Do I need a UC Davis email to access grade distributions?
                  </h3>
                  <div
                    itemScope
                    itemProp="acceptedAnswer"
                    itemType="https://schema.org/Answer"
                  >
                    <p className="text-slate-700" itemProp="text">
                      Yes, you need to create an account with your UC Davis
                      email to access the complete grade distribution data. This
                      ensures that the resource remains exclusive to UC Davis
                      students.
                    </p>
                  </div>
                </div>

                <div
                  className="bg-white p-6 rounded-lg shadow-md"
                  itemScope
                  itemType="https://schema.org/Question"
                >
                  <h3
                    className="text-lg font-bold text-slate-900 mb-2"
                    id="faq-3"
                    itemProp="name"
                  >
                    Can I see grade distributions for all UC Davis courses?
                  </h3>
                  <div
                    itemScope
                    itemProp="acceptedAnswer"
                    itemType="https://schema.org/Answer"
                  >
                    <p className="text-slate-700" itemProp="text">
                      Cattlelog provides grade distributions for every course
                      taught at UC Davis between Fall 2022 and Fall 2024. If a
                      course was offered during this period, you'll be able to
                      view its grade distribution.
                    </p>
                  </div>
                </div>

                <div
                  className="bg-white p-6 rounded-lg shadow-md"
                  itemScope
                  itemType="https://schema.org/Question"
                >
                  <h3
                    className="text-lg font-bold text-slate-900 mb-2"
                    id="faq-4"
                    itemProp="name"
                  >
                    How often is the grade distribution data updated?
                  </h3>
                  <div
                    itemScope
                    itemProp="acceptedAnswer"
                    itemType="https://schema.org/Answer"
                  >
                    <p className="text-slate-700" itemProp="text">
                      Grade distribution data is updated at the end of each
                      quarter after grades are finalized and processed by the
                      university.
                    </p>
                  </div>
                </div>

                <div
                  className="bg-white p-6 rounded-lg shadow-md"
                  itemScope
                  itemType="https://schema.org/Question"
                >
                  <h3
                    className="text-lg font-bold text-slate-900 mb-2"
                    id="faq-5"
                    itemProp="name"
                  >
                    Is Cattlelog free to use?
                  </h3>
                  <div
                    itemScope
                    itemProp="acceptedAnswer"
                    itemType="https://schema.org/Answer"
                  >
                    <p className="text-slate-700" itemProp="text">
                      Yes, Cattlelog is completely free for all UC Davis
                      students. Simply sign up with your UC Davis email to
                      access all features.
                    </p>
                  </div>
                </div>

                <div
                  className="bg-white p-6 rounded-lg shadow-md"
                  itemScope
                  itemType="https://schema.org/Question"
                >
                  <h3
                    className="text-lg font-bold text-slate-900 mb-2"
                    id="faq-6"
                    itemProp="name"
                  >
                    How can I contribute to Cattlelog?
                  </h3>
                  <div
                    itemScope
                    itemProp="acceptedAnswer"
                    itemType="https://schema.org/Answer"
                  >
                    <p className="text-slate-700" itemProp="text">
                      You can contribute by writing professor reviews, reporting
                      any inaccuracies, and spreading the word to other UC Davis
                      students. Your feedback helps improve the platform for
                      everyone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Call to Action with SEO keywords */}
          <section
            className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg p-8 mt-12 text-white"
            aria-labelledby="cta-heading"
          >
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4" id="cta-heading">
                Ready to access UC Davis grade distributions?
              </h2>
              <p className="text-lg mb-6">
                Join thousands of UC Davis students who are making informed
                course decisions with Cattlelog.
              </p>
              <a
                href="https://daviscattlelog.com?utm_source=blog"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-3 px-8 rounded-lg inline-flex items-center"
                aria-label="Visit Cattlelog Website"
                data-tracking="cta-main-button"
              >
                Visit daviscattlelog.com{" "}
                <ChevronRight className="ml-2" size={20} />
              </a>
            </div>
          </section>
        </div>
      </main>

      {/* Footer with semantic markup and rich structured data */}
      <footer className="bg-slate-900 text-white py-8" role="contentinfo">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="font-bold text-2xl text-yellow-400 mb-2">
                Cattlelog
              </div>
              <p className="text-sm text-gray-400">
                The website to round up your classes.
              </p>
            </div>
            <nav
              className="flex flex-col sm:flex-row gap-4 sm:gap-8"
              aria-label="Footer Navigation"
            >
              <a
                href="https://daviscattlelog.com?utm_source=blog"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-yellow-400"
              >
                Home
              </a>
              <a
                href="https://daviscattlelog.com/about"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-yellow-400"
              >
                About
              </a>
              <a
                href="https://daviscattlelog.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-yellow-400"
              >
                Privacy
              </a>
              <a
                href="https://daviscattlelog.com/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-yellow-400"
              >
                Contact
              </a>
            </nav>
          </div>
          <div className="border-t border-gray-800 mt-6 pt-6 text-sm text-gray-400 text-center">
            <p>© {new Date().getFullYear()} Cattlelog. All rights reserved.</p>
            <p className="mt-2">
              Unofficial guide. Not affiliated with UC Davis.
            </p>

            {/* SEO: Additional footer links with keywords */}
            <div className="mt-4 text-xs text-gray-600">
              <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                <li>
                  <a href="#" className="hover:text-gray-400">
                    Best UC Davis Professors
                  </a>
                </li>
                <li>
                  <a
                    href="/blog/easy-ge-courses"
                    className="hover:text-gray-400"
                  >
                    Easy GE Courses
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-400">
                    Major Requirements
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-400">
                    Course Planning
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-400">
                    Compare Professors
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      {/* SEO: Schema.org Organization data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Cattlelog",
          url: "https://daviscattlelog.com",
          logo: "https://daviscattlelog.com/cory-no-bg.png",
          sameAs: ["https://www.instagram.com/daviscattlelog"],
        })}
      </script>
    </div>
  );
}
