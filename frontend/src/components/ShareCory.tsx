import React, { useEffect, useRef, useState } from "react";

const ShareCory: React.FC = () => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const [isClicked, setIsClicked] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hidden = localStorage.getItem("hideCory") === "true";
    if (hidden) return;

    timerRef.current = window.setTimeout(
      () => {
        setIsClicked(true);
      },
      5 * 60 * 1000,
    );

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsClicked(false);
    localStorage.setItem("hideCory", "true");
  };

  const coryShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.href}?utm_source=cory_share`;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile && navigator.share) {
      navigator
        .share({
          title: "Cattlelog",
          text: "Check out daviscattlelog",
          url: shareUrl,
        })
        .then(() => console.log("Successful share"))
        .catch((error) => console.log("Error sharing", error));
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
    const count = clickCount + 1;
    setClickCount(count);
    if (count >= 2) {
      setIsClicked(false);
      localStorage.setItem("hideCory", "true");
    }
  };

  if (!isClicked) return null;

  return (
    <div
      className="fixed bottom-4 right-[-2px] z-50 flex items-end gap-2 cursor-pointer"
      onClick={coryShareClick}
    >
      <img
        src="/cory-no-bg.svg"
        alt="Cory logo"
        className="w-[120px] sm:w-[120px] md:w-[170px] lg:w-[170px] h-auto"
      />

      <div className="relative">
        {copiedLink && (
          <div className="absolute bottom-8 sm:bottom-14 md:bottom-16 left-[40%] sm:left-[42%] md:left-[35%] transform -translate-x-1/2 bg-black text-white text-sm sm:text-sm md:text-base px-2 sm:px-2 py-1 rounded-md shadow-md whitespace-nowrap">
            Link copied!
          </div>
        )}

        <img
          src="/speech-bubble.svg"
          alt="Speech bubble"
          className="w-[160px] sm:w-[160px] md:w-[180px] lg:w-[180px] h-auto mb-16 sm:mb-20 md:mb-24 lg:mb-24 -ml-8 sm:-ml-8 md:-ml-8 lg:-ml-8"
        />
        <img
          src="/speech-text.svg"
          alt="Speech text"
          className="absolute top-10 md:top-12 lg:top-12 left-1/2 w-[90px] sm:w-[100px] md:w-[110px] lg:w-[110px] transform -translate-x-1/2 -translate-y-1/2 mb-16 sm:mb-20 md:mb-24 lg:mb-24 -ml-8 sm:-ml-8 md:-ml-8 lg:-ml-8 pointer-events-none"
        />
        <button
          onClick={handleClose}
          className="absolute -top-4 right-10 sm:right-8 md:right-8 text-bold text-black text-lg sm:text-xl md:text-2xl"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default ShareCory;
