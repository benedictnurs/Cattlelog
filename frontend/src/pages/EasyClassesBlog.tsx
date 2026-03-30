import { useState, useEffect } from "react";
import {
  ChevronRight,
  Star,
  BarChart2,
  User,
  Filter,
  Coffee,
} from "lucide-react";
import { Helmet } from "react-helmet";

export default function EasyClassesBlog() {
  const [activeTab, setActiveTab] = useState("guide");

  // SEO: Track user engagement with useEffect
  useEffect(() => {
    // Track page views
    if (typeof window !== "undefined") {
      // Log page view (would connect to analytics in production)
      console.log("Page viewed: Easy Classes at UC Davis Guide");

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
      "Easy Classes at UC Davis - Complete Guide to GPA Boosters with Cattlelog",
    description:
      "Discover the easiest classes at UC Davis for GPA boosters. From NUT 10V to FST 003, find fun and accessible courses with high A rates using Cattlelog.",
    image: "https://daviscattlelog.com/assets/easy-classes-hero-image.jpg",
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
      "@id": "https://daviscattlelog.com/blog/easy-classes-uc-davis",
    },
  };

  // SEO: FAQ Schema for FAQ section
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What are the easiest classes at UC Davis?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Some of the easiest classes at UC Davis include NUT 10V (Nutrition online), FST 003 (Brewing and Beer), PLS 007V (Just Coffee), CLA 030 (Word Roots), and LIN 001 (Introduction to Linguistics). These courses are known for manageable workloads and high A rates.",
        },
      },
      {
        "@type": "Question",
        name: "How can I find easy classes with high grade distributions?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Use Cattlelog to view grade distributions for all UC Davis courses. You can filter by professor, quarter, and see which courses have the highest percentage of A grades to identify the easiest classes.",
        },
      },
      {
        "@type": "Question",
        name: "Are easy classes worth taking for my GPA?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Easy classes can be strategic GPA boosters, especially when balanced with challenging major requirements. They can provide breathing room while still fulfilling general education requirements or electives.",
        },
      },
      {
        "@type": "Question",
        name: "What makes a class 'easy' at UC Davis?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Easy classes typically feature open-book exams, extra credit opportunities, manageable weekly assignments, memorization-based content, or hands-on activities rather than heavy theory. Many also have high grade distributions with 70%+ A grades.",
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
        name: "Easy Classes at UC Davis",
        item: "https://daviscattlelog.com/blog/easy-classes-uc-davis",
      },
    ],
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* SEO: Added Head with meta tags */}
      <Helmet>
        <title>Easy Classes at UC Davis | GPA Boosters Guide - Cattlelog</title>
        <meta
          name="description"
          content="Discover the easiest classes at UC Davis with high A rates. From NUT 10V to FST 003, find GPA boosters and fun courses. Complete guide with grade distributions on Cattlelog."
        />
        <meta
          name="keywords"
          content="easy classes UC Davis, GPA boosters, high A rate courses, NUT 10V, FST 003, PLS 007V, UC Davis course selection, Cattlelog easy classes, Davis GPA improvement, fun UC Davis classes"
        />

        {/* Open Graph tags for social sharing */}
        <meta
          property="og:title"
          content="Easy Classes at UC Davis | GPA Boosters Guide - Cattlelog"
        />
        <meta
          property="og:description"
          content="Find the easiest classes at UC Davis with high A rates. Complete guide to GPA boosters from NUT 10V to tractor driving with Cattlelog."
        />
        <meta
          property="og:image"
          content="https://daviscattlelog.com/assets/easy-classes-og.jpg"
        />
        <meta
          property="og:url"
          content="https://daviscattlelog.com/blog/easy-classes-uc-davis"
        />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Cattlelog" />

        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Easy Classes at UC Davis | GPA Boosters Guide"
        />
        <meta
          name="twitter:description"
          content="Discover the easiest UC Davis classes with high A rates. Complete guide to GPA boosters with Cattlelog."
        />
        <meta
          name="twitter:image"
          content="https://daviscattlelog.com/assets/easy-classes-twitter.jpg"
        />

        {/* SEO Canonical tag to prevent duplicate content issues */}
        <link
          rel="canonical"
          href="https://daviscattlelog.com/blog/easy-classes-uc-davis"
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
            href="https://daviscattlelog.com?utm_source=easy-blog"
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
                Easy Classes at{" "}
                <span className="text-yellow-400">UC Davis</span>
              </h1>
              <p className="text-lg mb-6">
                Your complete guide to GPA boosters, fun courses, and
                stress-free classes with high A rates
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="https://daviscattlelog.com?utm_source=easy-blog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-3 px-6 rounded-lg flex items-center"
                  aria-label="Get Started with Cattlelog"
                >
                  Find Easy Classes <ChevronRight className="ml-2" size={20} />
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
              Easy Classes List
            </button>
            <button
              onClick={() => setActiveTab("features")}
              className={`py-3 px-5 font-medium ${activeTab === "features" ? "text-yellow-400 border-b-2 border-yellow-400" : "text-gray-500 hover:text-slate-900"}`}
              role="tab"
              id="tab-features"
              aria-selected={activeTab === "features"}
              aria-controls="panel-features"
            >
              How to Find Easy Classes
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
                  The Best Easy Classes at UC Davis for GPA Boosters
                </h2>

                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                  <h3
                    className="text-xl font-bold text-slate-900 mb-4 flex items-center"
                    id="top-picks"
                  >
                    <span className="inline-flex justify-center items-center w-8 h-8 rounded-full bg-yellow-400 text-slate-900 mr-3">
                      ⭐
                    </span>
                    Top Picks for Easy Classes
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-100 p-4 rounded-lg">
                      <div className="flex items-center text-slate-800 mb-2">
                        <Coffee size={18} className="mr-2 text-yellow-600" />
                        <strong>
                          <a
                            href="https://daviscattlelog.com/course/NUT10V?utm_source=easy-blog"
                            className="text-yellow-600 hover:underline"
                          >
                            NUT 10V
                          </a>
                        </strong>
                      </div>
                      <p className="text-sm">
                        Discoveries & Concepts in Nutrition (Online) - Open-book
                        quizzes, extra credit, high A rate
                      </p>
                    </div>
                    <div className="bg-slate-100 p-4 rounded-lg">
                      <div className="flex items-center text-slate-800 mb-2">
                        <Coffee size={18} className="mr-2 text-yellow-600" />
                        <strong>
                          <a
                            href="https://daviscattlelog.com/course/PLS7V?utm_source=easy-blog"
                            className="text-yellow-600 hover:underline"
                          >
                            PLS 007V
                          </a>
                        </strong>
                      </div>
                      <p className="text-sm">
                        Just Coffee - Video-based learning, short essays,
                        minimal workload
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-4 rounded-lg mb-4 text-white">
                    <p className="text-sm">
                      <strong>Pro Tip:</strong> Use{" "}
                      <a
                        href="https://daviscattlelog.com?utm_source=easy-blog"
                        className="text-yellow-400 hover:underline"
                      >
                        Cattlelog
                      </a>{" "}
                      to check grade distributions for these courses and see
                      which professors have the highest A rates!
                    </p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                  <h3
                    className="text-xl font-bold text-slate-900 mb-4 flex items-center"
                    id="hands-on"
                  >
                    <span className="inline-flex justify-center items-center w-8 h-8 rounded-full bg-yellow-400 text-slate-900 mr-3">
                      🍺
                    </span>
                    Fun & Hands-On Easy Classes
                  </h3>

                  <div className="space-y-4">
                    <div className="border-l-4 border-yellow-400 pl-4">
                      <h4 className="font-bold text-slate-900">
                        <a
                          href="https://daviscattlelog.com/course/FST3?utm_source=easy-blog"
                          className="text-yellow-600 hover:underline"
                        >
                          FST 003 - Intro to Brewing and Beer
                        </a>
                      </h4>
                      <p className="text-slate-700">
                        Learn to brew beer with hands-on activities. Popular for
                        being enjoyable and accessible with practical
                        assignments.
                      </p>
                    </div>

                    <div className="border-l-4 border-yellow-400 pl-4">
                      <h4 className="font-bold text-slate-900">
                        <a
                          href="https://daviscattlelog.com/course/VEN3?utm_source=easy-blog"
                          className="text-yellow-600 hover:underline"
                        >
                          VEN 003 - Intro to Winemaking
                        </a>
                      </h4>
                      <p className="text-slate-700">
                        Explore winemaking processes with open-book exams and
                        engaging wine content.
                      </p>
                    </div>

                    <div className="border-l-4 border-yellow-400 pl-4">
                      <h4 className="font-bold text-slate-900">
                        <a
                          href="https://daviscattlelog.com/course/ABT49?utm_source=easy-blog"
                          className="text-yellow-600 hover:underline"
                        >
                          ABT 049 - Field Equipment Operation (Tractor Driving)
                        </a>
                      </h4>
                      <p className="text-slate-700">
                        Unique experiential learning - literally learn to drive
                        tractors and operate farm equipment!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                  <h3
                    className="text-xl font-bold text-slate-900 mb-4 flex items-center"
                    id="memorization"
                  >
                    <span className="inline-flex justify-center items-center w-8 h-8 rounded-full bg-yellow-400 text-slate-900 mr-3">
                      📚
                    </span>
                    Memorization-Based Easy Classes
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-bold text-slate-900 mb-2">
                        <a
                          href="https://daviscattlelog.com/course/CLA30?utm_source=easy-blog"
                          className="text-yellow-600 hover:underline"
                        >
                          CLA 030 (CLA 10F) - Word Roots
                        </a>
                      </h4>
                      <p className="text-slate-700 text-sm mb-3">
                        Learn Latin and Greek word roots. No prior knowledge
                        required, simple memorization.
                      </p>

                      <h4 className="font-bold text-slate-900 mb-2">
                        <a
                          href="https://daviscattlelog.com/course/LIN1?utm_source=easy-blog"
                          className="text-yellow-600 hover:underline"
                        >
                          LIN 001 - Introduction to Linguistics
                        </a>
                      </h4>
                      <p className="text-slate-700 text-sm">
                        "Laughably easy" according to students. Stay awake in
                        class and complete simple online materials.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 mb-2">
                        <a
                          href="https://daviscattlelog.com/course/FST10?utm_source=easy-blog"
                          className="text-yellow-600 hover:underline"
                        >
                          FST 010 - Food, Folklore & Health
                        </a>
                      </h4>
                      <p className="text-slate-700 text-sm mb-3">
                        Four midterms (one dropped), memorize PowerPoints.
                        Simple with preparation.
                      </p>

                      <h4 className="font-bold text-slate-900 mb-2">
                        <a
                          href="https://daviscattlelog.com/course/ANT1?utm_source=easy-blog"
                          className="text-yellow-600 hover:underline"
                        >
                          ANT 001 - Human Evolutionary Biology
                        </a>
                      </h4>
                      <p className="text-slate-700 text-sm">
                        Manageable one-page essays, assignments you can Google,
                        easy exams.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                  <h3
                    className="text-xl font-bold text-slate-900 mb-4 flex items-center"
                    id="science-fun"
                  >
                    <span className="inline-flex justify-center items-center w-8 h-8 rounded-full bg-yellow-400 text-slate-900 mr-3">
                      🌱
                    </span>
                    Fun Science & Nature Classes
                  </h3>

                  <div className="space-y-4">
                    <div className="bg-slate-100 p-4 rounded-lg">
                      <h4 className="font-bold text-slate-900 mb-2">
                        <a
                          href="https://daviscattlelog.com/course/ATM10?utm_source=easy-blog"
                          className="text-yellow-600 hover:underline"
                        >
                          ATM 010 - Severe & Unusual Weather
                        </a>
                      </h4>
                      <p className="text-slate-700 text-sm">
                        Explore extreme weather phenomena. Engaging science
                        content appreciated by both science and non-science
                        students.
                      </p>
                    </div>

                    <div className="bg-slate-100 p-4 rounded-lg">
                      <h4 className="font-bold text-slate-900 mb-2">
                        <a
                          href="https://daviscattlelog.com/course/PLB10?utm_source=easy-blog"
                          className="text-yellow-600 hover:underline"
                        >
                          PLB 010 - Plant Biology
                        </a>
                      </h4>
                      <p className="text-slate-700 text-sm">
                        Biology and cultural significance of plants with field
                        trips and hands-on activities.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                  <h3
                    className="text-xl font-bold text-slate-900 mb-4 flex items-center"
                    id="arts-media"
                  >
                    <span className="inline-flex justify-center items-center w-8 h-8 rounded-full bg-yellow-400 text-slate-900 mr-3">
                      🎬
                    </span>
                    Arts & Media Easy Classes
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-bold text-slate-900 mb-2">
                        <a
                          href="https://daviscattlelog.com/course/FMS1?utm_source=easy-blog"
                          className="text-yellow-600 hover:underline"
                        >
                          FMS 001 - Intro to Film Studies
                        </a>
                      </h4>
                      <p className="text-slate-700 text-sm">
                        Watch films and discuss cultural contexts. Attendance
                        important but light workload.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 mb-2">
                        <a
                          href="https://daviscattlelog.com/course/MUS116?utm_source=easy-blog"
                          className="text-yellow-600 hover:underline"
                        >
                          MUS 116 & Music Classes
                        </a>
                      </h4>
                      <p className="text-slate-700 text-sm">
                        Simple assignments. If you enjoy music, these courses
                        are breezy and enjoyable.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                  <h3
                    className="text-xl font-bold text-slate-900 mb-4 flex items-center"
                    id="hidden-gems"
                  >
                    <span className="inline-flex justify-center items-center w-8 h-8 rounded-full bg-yellow-400 text-slate-900 mr-3">
                      💎
                    </span>
                    Hidden Gems & Upper Division Options
                  </h3>

                  <div className="space-y-4">
                    <div className="border-l-4 border-green-400 pl-4">
                      <h4 className="font-bold text-slate-900">
                        <a
                          href="https://daviscattlelog.com/course/PMI129Y?utm_source=easy-blog"
                          className="text-green-600 hover:underline"
                        >
                          PMI 129Y - One Health Initiative
                        </a>
                      </h4>
                      <p className="text-slate-700">
                        Upper-division GE with no exams or quizzes. Students
                        call it the "easiest GE at Davis."
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <h4 className="font-bold text-slate-900 mb-2">
                          <a
                            href="https://daviscattlelog.com/course/ANT2?utm_source=easy-blog"
                            className="text-yellow-600 hover:underline"
                          >
                            ANT 002 - Cultural Anthropology
                          </a>
                        </h4>
                        <p className="text-slate-700 text-sm">
                          Great for memorization-oriented learners with
                          straightforward content.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 mb-2">
                          <a
                            href="https://daviscattlelog.com/course/MUS10?utm_source=easy-blog"
                            className="text-yellow-600 hover:underline"
                          >
                            MUS 010 - Music Fundamentals
                          </a>
                        </h4>
                        <p className="text-slate-700 text-sm">
                          Basic music theory with simple assignments and tests.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-6 rounded-lg mb-8">
                  <h3 className="text-xl font-bold mb-4" id="student-quotes">
                    What Students Say
                  </h3>
                  <div className="space-y-4">
                    <blockquote className="border-l-4 border-yellow-400 pl-4 italic">
                      "PLS 007V is the easiest class I've ever done at UC
                      Davis."
                    </blockquote>
                    <blockquote className="border-l-4 border-yellow-400 pl-4 italic">
                      "ANT 001... super easy, assignments are manageable (online
                      reading with questions, one page essays... midterm and
                      final can be googled/based on notes outlined in lecture)."
                    </blockquote>
                    <blockquote className="border-l-4 border-yellow-400 pl-4 italic">
                      "NUT 10 is really easy and pretty informative."
                    </blockquote>
                    <blockquote className="border-l-4 border-yellow-400 pl-4 italic">
                      "Coffee making, beer making, winemaking, tractor driving
                      are some popular ones."
                    </blockquote>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3
                    className="text-xl font-bold text-slate-900 mb-4 flex items-center"
                    id="quick-reference"
                  >
                    <span className="inline-flex justify-center items-center w-8 h-8 rounded-full bg-yellow-400 text-slate-900 mr-3">
                      📋
                    </span>
                    Quick Reference Table
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="p-2 text-left">Course</th>
                          <th className="p-2 text-left">Name</th>
                          <th className="p-2 text-left">Why Easy</th>
                        </tr>
                      </thead>
                      <tbody className="space-y-2">
                        <tr className="border-b">
                          <td className="p-2 font-semibold">
                            <a
                              href="https://daviscattlelog.com/course/NUT10V?utm_source=easy-blog"
                              className="text-yellow-600 hover:underline"
                            >
                              NUT 10V
                            </a>
                          </td>
                          <td className="p-2">Nutrition Concepts</td>
                          <td className="p-2">
                            Online, open-book, extra credit
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-semibold">
                            <a
                              href="https://daviscattlelog.com/course/FST3?utm_source=easy-blog"
                              className="text-yellow-600 hover:underline"
                            >
                              FST 003
                            </a>
                          </td>
                          <td className="p-2">Brewing & Beer</td>
                          <td className="p-2">
                            Hands-on, practical assignments
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-semibold">
                            <a
                              href="https://daviscattlelog.com/course/PLS7V?utm_source=easy-blog"
                              className="text-yellow-600 hover:underline"
                            >
                              PLS 007V
                            </a>
                          </td>
                          <td className="p-2">Just Coffee</td>
                          <td className="p-2">
                            Videos, short essays, minimal work
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-semibold">
                            <a
                              href="https://daviscattlelog.com/course/CLA30?utm_source=easy-blog"
                              className="text-yellow-600 hover:underline"
                            >
                              CLA 030
                            </a>
                          </td>
                          <td className="p-2">Word Roots</td>
                          <td className="p-2">
                            Simple memorization, no prerequisites
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-semibold">
                            <a
                              href="https://daviscattlelog.com/course/ABT49?utm_source=easy-blog"
                              className="text-yellow-600 hover:underline"
                            >
                              ABT 049
                            </a>
                          </td>
                          <td className="p-2">Tractor Driving</td>
                          <td className="p-2">
                            Unique, experiential, low stress
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-semibold">
                            <a
                              href="https://daviscattlelog.com/course/PMI129Y?utm_source=easy-blog"
                              className="text-yellow-600 hover:underline"
                            >
                              PMI 129Y
                            </a>
                          </td>
                          <td className="p-2">One Health Initiative</td>
                          <td className="p-2">No exams, easy upper-div GE</td>
                        </tr>
                      </tbody>
                    </table>
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
                How to Find Easy Classes at UC Davis with Cattlelog
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
                      Check Grade Distributions
                    </h3>
                  </div>
                  <p className="text-slate-700 mb-4">
                    Use Cattlelog to view grade distributions and identify
                    courses with high A rates. Look for classes where 70%+ of
                    students receive A grades.
                  </p>
                  <div className="bg-yellow-100 p-3 rounded text-sm">
                    <strong>Pro Tip:</strong> Sort by "% A Grades" to quickly
                    find the easiest classes.
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mr-4">
                      <User size={24} className="text-yellow-400" />
                    </div>
                    <h3
                      className="text-xl font-bold text-slate-900"
                      id="feature-2"
                    >
                      Compare Professors
                    </h3>
                  </div>
                  <p className="text-slate-700 mb-4">
                    Different professors can have vastly different grading
                    patterns. Use Cattlelog to compare professors for the same
                    course.
                  </p>
                  <div className="bg-green-100 p-3 rounded text-sm">
                    <strong>Strategy:</strong> Pick professors with consistently
                    high grade distributions.
                  </div>
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
                      Filter by Requirements
                    </h3>
                  </div>
                  <p className="text-slate-700 mb-4">
                    Find easy classes that also fulfill your general education
                    or major requirements. Double win for your schedule!
                  </p>
                  <div className="bg-blue-100 p-3 rounded text-sm">
                    <strong>Smart Move:</strong> Kill two birds with one stone -
                    easy grade + requirement fulfilled.
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mr-4">
                      <Star size={24} className="text-yellow-400" />
                    </div>
                    <h3
                      className="text-xl font-bold text-slate-900"
                      id="feature-4"
                    >
                      Read Professor Reviews
                    </h3>
                  </div>
                  <p className="text-slate-700 mb-4">
                    Student reviews often mention course difficulty, workload,
                    and grading style. Look for keywords like "easy," "fair
                    grader," or "lots of extra credit."
                  </p>
                  <div className="bg-purple-100 p-3 rounded text-sm">
                    <strong>Look For:</strong> Reviews mentioning manageable
                    workload and fair grading.
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h3
                  className="text-xl font-bold text-slate-900 mb-4"
                  id="strategies"
                >
                  Strategic Course Selection Tips
                </h3>

                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-yellow-400 text-slate-900 rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                      1
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-2">
                        Balance Your Schedule
                      </h4>
                      <p className="text-slate-700">
                        Mix easy classes with challenging major requirements.
                        Use GPA boosters to offset harder courses in the same
                        quarter.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-yellow-400 text-slate-900 rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                      2
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-2">
                        Check Prerequisites
                      </h4>
                      <p className="text-slate-700">
                        Many easy classes have no prerequisites, making them
                        accessible to students from any major or year level.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-yellow-400 text-slate-900 rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                      3
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-2">
                        Consider Your Learning Style
                      </h4>
                      <p className="text-slate-700">
                        Choose classes that match how you learn best - hands-on
                        activities, memorization, videos, or creative projects.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-yellow-400 text-slate-900 rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                      4
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-2">
                        Plan Ahead
                      </h4>
                      <p className="text-slate-700">
                        Popular easy classes fill up quickly during
                        registration. Have backup options ready.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 text-white p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4" id="cattlelog-advantage">
                  The Cattlelog Advantage for Finding Easy Classes
                </h3>
                <p className="mb-4">
                  Cattlelog gives you access to comprehensive grade distribution
                  data that isn't available anywhere else, making it the
                  ultimate tool for finding GPA boosters at UC Davis.
                </p>
                <div className="flex justify-center">
                  <a
                    href="https://daviscattlelog.com?utm_source=easy-blog"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-3 px-6 rounded-lg inline-flex items-center"
                    aria-label="Start Using Cattlelog"
                  >
                    Start Finding Easy Classes{" "}
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
                Frequently Asked Questions About Easy Classes at UC Davis
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
                    What are the easiest classes at UC Davis?
                  </h3>
                  <div
                    itemScope
                    itemProp="acceptedAnswer"
                    itemType="https://schema.org/Answer"
                  >
                    <p className="text-slate-700" itemProp="text">
                      Some of the easiest classes include{" "}
                      <a
                        href="https://daviscattlelog.com/course/NUT10V?utm_source=easy-blog"
                        className="text-yellow-600 hover:underline"
                      >
                        NUT 10V
                      </a>{" "}
                      (Nutrition online),{" "}
                      <a
                        href="https://daviscattlelog.com/course/FST003?utm_source=easy-blog"
                        className="text-yellow-600 hover:underline"
                      >
                        FST 003
                      </a>{" "}
                      (Brewing and Beer),{" "}
                      <a
                        href="https://daviscattlelog.com/course/PLS007V?utm_source=easy-blog"
                        className="text-yellow-600 hover:underline"
                      >
                        PLS 007V
                      </a>{" "}
                      (Just Coffee), and{" "}
                      <a
                        href="https://daviscattlelog.com/course/ABT049?utm_source=easy-blog"
                        className="text-yellow-600 hover:underline"
                      >
                        ABT 049
                      </a>{" "}
                      (Tractor Driving). These courses are known for manageable
                      workloads and high A rates.
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
                    How can I find easy classes with high grade distributions?
                  </h3>
                  <div
                    itemScope
                    itemProp="acceptedAnswer"
                    itemType="https://schema.org/Answer"
                  >
                    <p className="text-slate-700" itemProp="text">
                      Use{" "}
                      <a
                        href="https://daviscattlelog.com?utm_source=easy-blog"
                        className="text-yellow-600 hover:underline"
                      >
                        Cattlelog
                      </a>{" "}
                      to view grade distributions for all UC Davis courses. You
                      can filter by professor, quarter, and see which courses
                      have the highest percentage of A grades to identify the
                      easiest classes.
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
                    Are easy classes worth taking for my GPA?
                  </h3>
                  <div
                    itemScope
                    itemProp="acceptedAnswer"
                    itemType="https://schema.org/Answer"
                  >
                    <p className="text-slate-700" itemProp="text">
                      Easy classes can be strategic GPA boosters, especially
                      when balanced with challenging major requirements. They
                      can provide breathing room while still fulfilling general
                      education requirements or electives. However, make sure to
                      balance them with substantive coursework in your field.
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
                    What makes a class 'easy' at UC Davis?
                  </h3>
                  <div
                    itemScope
                    itemProp="acceptedAnswer"
                    itemType="https://schema.org/Answer"
                  >
                    <p className="text-slate-700" itemProp="text">
                      Easy classes typically feature open-book exams, extra
                      credit opportunities, manageable weekly assignments,
                      memorization-based content, or hands-on activities rather
                      than heavy theory. Many also have high grade distributions
                      with 70%+ A grades.
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
                    Do easy classes fulfill degree requirements?
                  </h3>
                  <div
                    itemScope
                    itemProp="acceptedAnswer"
                    itemType="https://schema.org/Answer"
                  >
                    <p className="text-slate-700" itemProp="text">
                      Many easy classes fulfill general education requirements,
                      making them perfect for completing degree requirements
                      while maintaining a high GPA. Use Cattlelog's filtering
                      system to find easy classes that meet specific GE
                      categories.
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
                    When should I take easy classes?
                  </h3>
                  <div
                    itemScope
                    itemProp="acceptedAnswer"
                    itemType="https://schema.org/Answer"
                  >
                    <p className="text-slate-700" itemProp="text">
                      Take easy classes during quarters with challenging major
                      courses, when you need to maintain a certain GPA for
                      scholarships or graduate school, or when you want to
                      explore new subjects without academic pressure. They're
                      also great for summer sessions.
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
                    id="faq-7"
                    itemProp="name"
                  >
                    Are there any downsides to taking too many easy classes?
                  </h3>
                  <div
                    itemScope
                    itemProp="acceptedAnswer"
                    itemType="https://schema.org/Answer"
                  >
                    <p className="text-slate-700" itemProp="text">
                      While easy classes can boost your GPA, it's important to
                      challenge yourself academically. Graduate schools and
                      employers may notice if your transcript lacks rigorous
                      coursework in your field. Use easy classes strategically
                      rather than exclusively.
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
                Ready to find the easiest classes at UC Davis?
              </h2>
              <p className="text-lg mb-6">
                Join thousands of UC Davis students using Cattlelog to make
                strategic course decisions and boost their GPA with the right
                classes.
              </p>
              <a
                href="https://daviscattlelog.com?utm_source=easy-blog"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-3 px-8 rounded-lg inline-flex items-center"
                aria-label="Visit Cattlelog Website"
                data-tracking="cta-main-button"
              >
                Start Using Cattlelog{" "}
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
                href="https://daviscattlelog.com?utm_source=easy-blog"
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
                  <a
                    href="/blog/best-uc-davis-professors"
                    className="hover:text-gray-400"
                  >
                    Best UC Davis Professors
                  </a>
                </li>
                <li>
                  <a
                    href="/blog/grade-distributions-guide"
                    className="hover:text-gray-400"
                  >
                    Grade Distributions
                  </a>
                </li>
                <li>
                  <a
                    href="/blog/gpa-boosters-guide"
                    className="hover:text-gray-400"
                  >
                    GPA Boosters Guide
                  </a>
                </li>
                <li>
                  <a
                    href="/blog/course-planning-tips"
                    className="hover:text-gray-400"
                  >
                    Course Planning
                  </a>
                </li>
                <li>
                  <a
                    href="/blog/major-requirements-guide"
                    className="hover:text-gray-400"
                  >
                    Major Requirements
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
