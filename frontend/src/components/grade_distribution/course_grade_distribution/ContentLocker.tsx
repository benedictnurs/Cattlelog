import React, { useState } from "react";
import { usePostHog } from "posthog-js/react";

/* Get Collected Emails

```sql
SELECT
  properties['email'] AS email,
  properties['email_consent'] AS email_consent,
  properties['name'] AS name,
  properties['current_url'] AS page,
  properties['source'] AS source,
  properties['distinct_id'] AS distinct_id,
  timestamp
FROM events
WHERE
  event = 'collected_email'
  AND properties['source'] = 'content-locker'
ORDER BY timestamp DESC
LIMIT 100

```

*/

interface ContentLockerProps {
  variant: "email-required" | "email-with-exit";
  onUnlock: () => void;
  onDismiss?: () => void;
}

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@ucdavis\.edu$/i.test(email);

const ContentLocker: React.FC<ContentLockerProps> = ({
  variant,
  onUnlock,
  onDismiss,
}) => {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");

  const posthog = usePostHog();

  const handleSubmit = (e: any) => {
    e.preventDefault();

    if (!isValidEmail(email)) {
      setError("Please enter a valid email.");
      return;
    }

    if (!consent) {
      setError("You must agree to continue.");
      return;
    }

    console.log("Tracking email to PostHog:", {
      email,
      email_consent: consent,
      source: "content-locker",
      current_url: window.location.href,
    });

    posthog.capture("content-locker", {
      email,
      email_consent: consent,
      current_url: window.location.href,
      source: "content-locker",
    });

    localStorage.setItem("grade_dist_unlocked", "true");
    onUnlock();
    setError("");
  };

  const handleDismiss = () => {
    if (variant === "email-with-exit" && onDismiss) {
      posthog.capture("content-locker-dismissed", {
        variant,
        current_url: window.location.href,
        source: "content-locker",
      });
      localStorage.setItem("grade_dist_unlocked", "true");
      onDismiss();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-[#15374D99] text-white rounded-2xl p-8 w-[90%] max-w-md shadow-xl flex flex-col gap-4">
        {variant === "email-with-exit" && onDismiss && (
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-white text-xl font-bold hover:text-red-400"
            aria-label="Close content locker"
          >
            ×
          </button>
        )}

        <h2 className="text-2xl font-bold">CONTENT LOCKED</h2>
        <p className="text-sm -mt-2">
          Type in your email to unlock grade distributions!
        </p>

        <input
          type="email"
          placeholder="email@ucdavis.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 px-4 py-2 rounded text-black"
        />

        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          I agree to share my email with Cattlelog for updates and
          communication.
        </label>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={!consent || !email}
            className="mt-4 py-2 px-8 w-fit rounded-md bg-[#15374D] hover:bg-[#26415C] transition text-white text-sm font-medium disabled:opacity-50"
          >
            View Grade Distributions
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentLocker;
