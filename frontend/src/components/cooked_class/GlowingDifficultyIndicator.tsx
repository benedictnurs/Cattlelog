// First, let's create a new component for the glowing difficulty indicator
import React, { useEffect, useState } from "react";

const GlowingDifficultyIndicator = ({ difficulty, size = "w-16 h-16" }) => {
  const [glow, setGlow] = useState(false);
  const [prevDifficulty, setPrevDifficulty] = useState(difficulty);

  // Get the appropriate color based on difficulty
  const getDifficultyColor = (difficulty: number) => {
    if (difficulty >= 15.0) return "bg-red-600";
    if (difficulty >= 11.0) return "bg-red-500";
    if (difficulty >= 9.0) return "bg-yellow-500";
    if (difficulty >= 7.0) return "bg-yellow-400";
    return "bg-green-500";
  };

  // Get glow color based on difficulty
  const getGlowColor = (difficulty: number) => {
    if (difficulty >= 15.0) return "shadow-red-600";
    if (difficulty >= 11.0) return "shadow-red-500";
    if (difficulty >= 9.0) return "shadow-yellow-500";
    if (difficulty >= 7.0) return "shadow-yellow-400";
    return "shadow-green-500";
  };

  // Set up the animation effect
  useEffect(() => {
    // Detect change in difficulty to trigger animation
    if (difficulty !== prevDifficulty) {
      setPrevDifficulty(difficulty);
      setGlow(true);

      // Create stronger pulse if difficulty changed significantly
      const timer = setTimeout(() => {
        setGlow(false);
      }, 2000);

      return () => clearTimeout(timer);
    }

    // Regular pulsing animation when not changing
    const interval = setInterval(() => {
      setGlow((prev) => !prev);
    }, 2000);

    return () => clearInterval(interval);
  }, [difficulty, prevDifficulty]);

  const baseColor = getDifficultyColor(difficulty);
  const glowColor = getGlowColor(difficulty);

  return (
    <div className="relative">
      {/* Shimmer effect */}
      <div
        className={`absolute inset-0 ${size} rounded-full opacity-30 blur-md transition-all duration-1000 ${glow ? "scale-125" : "scale-100"} ${baseColor}`}
      ></div>

      <div
        className={`
          relative ${baseColor} text-white font-bold rounded-full ${size} 
          flex items-center justify-center z-10
          transition-all duration-500
          ${glow ? `shadow-lg shadow-${glowColor} animate-pulse` : ""}
        `}
      >
        {typeof difficulty === "number" ? difficulty.toFixed(1) : difficulty}
      </div>

      <div
        className={`
          absolute inset-0 rounded-full 
          bg-gradient-to-r from-transparent via-white to-transparent 
          opacity-25 blur-sm
          ${glow ? "animate-shimmer" : ""}
        `}
        style={{
          backgroundSize: "200% 100%",
          animation: glow ? "shimmer 2s infinite" : "none",
        }}
      ></div>
    </div>
  );
};

export default GlowingDifficultyIndicator;
