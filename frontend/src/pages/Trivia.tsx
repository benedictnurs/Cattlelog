import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePostHog } from "posthog-js/react";

const TriviaPage = () => {
  const posthog = usePostHog();
  const [answers, setAnswers] = useState({
    q1: "",
    q2: "",
    q3: "",
    q4: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  React.useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const questions = [
    {
      id: "q1",
      question: "What year was UC Davis founded?",
      options: ["1905", "1908", "1915", "1922"],
    },
    {
      id: "q2",
      question: "What is the official mascot of UC Davis?",
      options: [
        "Gunrock the Mustang",
        "Aggie the Cow",
        "Davis the Dog",
        "Bronco the Horse",
      ],
    },
    {
      id: "q3",
      question: "Which college at UC Davis is the largest?",
      options: [
        "College of Letters and Science",
        "College of Engineering",
        "College of Agricultural and Environmental Sciences",
        "College of Biological Sciences",
      ],
    },
    {
      id: "q4",
      question: "What is UC Davis known for nationally?",
      options: [
        "Veterinary Medicine",
        "Marine Biology",
        "Astronomy",
        "Architecture",
      ],
    },
  ];

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    // Track answer selection
    posthog?.capture("trivia_answer_selected", {
      question_id: questionId,
      answer: value,
      location: "TriviaPage",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Track trivia submission with all answers
    posthog?.capture("trivia_submitted", {
      answers: answers,
      location: "TriviaPage",
      timestamp: new Date().toISOString(),
    });

    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const allAnswered = Object.values(answers).every((answer) => answer !== "");

  return (
    <div className="min-h-screen flex flex-col">
      <div
        className="relative flex-grow"
        style={{
          backgroundImage: `url('${isMobile ? "/landing-mobile.svg" : "/landing-3.svg"}'), ${
            isMobile
              ? "linear-gradient(46deg, #2C75A5 1.03%, #0F293A 84.68%)"
              : "linear-gradient(46deg, #2C75A5 1.03%, #0F293A 84.68%)"
          }`,
          backgroundSize: "cover, cover",
          backgroundPosition: "center, center",
          backgroundRepeat: "no-repeat, no-repeat",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-14">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex items-center justify-center gap-4 sm:gap-6 mb-4">
              <img
                src="/landing-logo.svg"
                alt="Cattlelog Logo"
                className="w-[80px] sm:w-[120px] h-auto object-contain"
              />
              <div className="flex flex-col select-none text-left">
                <span className="block text-transparent bg-clip-text bg-[linear-gradient(90deg,#FFF_0%,#E4B43D_112.3%)] font-bold tracking-[-1.6px] font-[Figtree] text-[36px] sm:text-[60px] leading-[1.05]">
                  davis
                </span>
                <span className="block text-transparent bg-clip-text bg-[linear-gradient(90deg,#FFF_0%,#E4B43D_112.3%)] font-bold tracking-[-1.6px] font-[Figtree] text-[36px] sm:text-[60px] leading-[1.18] -mt-2">
                  cattlelog
                </span>
              </div>
            </div>
            <h1 className="text-white text-[24px] sm:text-[32px] font-[400] sm:font-[300] mb-2">
              UC Davis Trivia Challenge
            </h1>
            <p className="text-white/80 text-[14px] sm:text-[16px]">
              Test your knowledge about UC Davis!
            </p>
          </div>

          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="submitted"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_10px_30px_0_rgba(0,0,0,0.3)] text-center"
              >
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 bg-[#E4B540] rounded-full flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    Thanks for participating!
                  </h2>
                  <p className="text-gray-600 text-[15px] sm:text-[16px]">
                    Your answers have been submitted. Check back later to see
                    how you did!
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      posthog?.capture("trivia_try_again_clicked", {
                        location: "TriviaPage",
                      });
                      setSubmitted(false);
                      setAnswers({ q1: "", q2: "", q3: "", q4: "" });
                    }}
                    className="w-full bg-[#E4B540] text-black font-semibold text-[16px] px-6 py-3 rounded-full hover:bg-[#CDA33A] transition shadow-[0_4px_12px_0_rgba(0,0,0,0.2)]"
                  >
                    Try Again
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {questions.map((q, index) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_10px_20px_0_rgba(0,0,0,0.3)]"
                  >
                    <h3 className="text-gray-900 font-semibold text-[16px] sm:text-[18px] mb-4">
                      {index + 1}. {q.question}
                    </h3>
                    <div className="space-y-2">
                      {q.options.map((option) => (
                        <label
                          key={option}
                          className={`flex items-center p-3 sm:p-4 rounded-2xl cursor-pointer transition-all ${
                            answers[q.id] === option
                              ? "bg-[#C1D8E8] shadow-[0_4px_12px_0_rgba(0,0,0,0.15)]"
                              : "bg-gray-50 hover:bg-gray-100"
                          }`}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            value={option}
                            checked={answers[q.id] === option}
                            onChange={(e) =>
                              handleAnswerChange(q.id, e.target.value)
                            }
                            className="w-5 h-5 text-[#2C75A5] focus:ring-2 focus:ring-[#2C75A5] focus:ring-offset-2"
                          />
                          <span className="ml-3 text-gray-900 text-[14px] sm:text-[15px]">
                            {option}
                          </span>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                ))}

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={!allAnswered}
                    className={`w-full font-semibold text-[16px] sm:text-[18px] px-6 py-3 sm:py-4 rounded-full transition shadow-[0_10px_20px_0_rgba(0,0,0,0.3)] ${
                      allAnswered
                        ? "bg-[#E4B540] text-black hover:bg-[#CDA33A]"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Submit Answers
                  </button>
                  {!allAnswered && (
                    <p className="text-white/70 text-center text-sm mt-3">
                      Please answer all questions before submitting
                    </p>
                  )}
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0F293A] text-white py-6 text-center">
        <p className="text-sm text-white/70">
          © 2024 Davis Cattlelog. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default TriviaPage;
