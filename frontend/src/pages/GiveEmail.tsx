import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { usePostHog } from "posthog-js/react";

/* Get Collected Emails

```sql
SELECT
    properties['email'] AS email,
    properties['email_consent'] AS email_consent,
    properties['current_url'] AS page,
    properties['distinct_id'] AS distinct_id,
    timestamp
FROM events
WHERE
    properties['email'] IS NOT NULL
ORDER BY timestamp DESC
LIMIT 100
```

*/

const EmailSignup = () => {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  const posthog = usePostHog();

  const handleSubmit = (e: any) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!consent) {
      setError("Please check the consent box to continue");
      return;
    }

    posthog.capture("collected_email", {
      email,
      email_consent: consent,
      current_url: window.location.href,
      source: "email-signup-page",
    });

    setSubmitted(true);
    setError("");
  };

  const handleCopyLink = async () => {
    const link = "https://daviscattlelog.com?utm_source=giveshare";
    try {
      await navigator.clipboard.writeText(link);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <>
      <Header />
      <div className="mx-5 my-5 sm:mx-auto sm:my-24 max-w-3xl">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-8 mb-12 text-center">
          <h2 className="text-white text-xl sm:text-3xl font-bold mb-4">
            Stay Updated with Cattlelog
          </h2>
          <p className="mb-6 text-base sm:text-lg text-blue-100">
            Get notified about new features, grade updates, and exclusive tips
            for making the most of your course selection.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-12">
          <h1 className="text-lg sm:text-2xl font-bold mb-6">
            Join our mailing list
          </h1>

          {submitted ? (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
              <p className="font-medium">Thanks for subscribing!</p>
              <p>We'll keep you updated with the latest from Cattlelog.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              <div className="mb-6">
                <label
                  htmlFor="email"
                  className="block text-gray-700 font-medium mb-2"
                >
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your.email@ucdavis.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="mb-6">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="consent"
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="consent" className="text-gray-600">
                      I want to receive occasional product updates and other
                      Cattlelog related emails
                    </label>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="inline-block bg-blue-700 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-800 transform hover:scale-105 transition duration-300 shadow-md"
              >
                Subscribe
              </button>
            </form>
          )}

          <p className="mt-6 text-sm text-gray-500">
            We respect your privacy. You can unsubscribe at any time.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h2 className="text-lg font-bold mb-4">What you'll receive:</h2>
          <ul className="space-y-2">
            <li className="flex items-start">
              <svg
                className="h-5 w-5 text-blue-600 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Updates about new features and improvements</span>
            </li>
            <li className="flex items-start">
              <svg
                className="h-5 w-5 text-blue-600 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Notifications when new grade distributions are added</span>
            </li>
            <li className="flex items-start">
              <svg
                className="h-5 w-5 text-blue-600 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Tips for course selection and planning</span>
            </li>
            <li className="flex items-start">
              <svg
                className="h-5 w-5 text-blue-600 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Information about new Cattlelog tools and resources</span>
            </li>
          </ul>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mt-6">
          <h2 className="text-lg font-bold mb-4">Share with a friend</h2>
          <div className="flex items-center space-x-2">
            <a
              href="https://daviscattlelog.com?utm_source=giveshare"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              https://daviscattlelog.com?utm_source=giveshare
            </a>
            <button
              onClick={handleCopyLink}
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
              title="Copy link"
            >
              {copySuccess ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default EmailSignup;
