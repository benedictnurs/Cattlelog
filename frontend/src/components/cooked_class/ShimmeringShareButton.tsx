import React, { useState } from "react";
import { Share2 } from "lucide-react";

const ShimmeringShareButton = ({ onClick }) => {
  const [isClicked, setIsClicked] = useState(false);
  const [particles, setParticles] = useState([]);

  // Function to create particles when button is clicked
  const createParticles = (e) => {
    // Get button position for particle origin
    const buttonRect = e.currentTarget.getBoundingClientRect();
    const buttonCenterX = buttonRect.left + buttonRect.width / 2;
    const buttonCenterY = buttonRect.top + buttonRect.height / 2;

    // Create 20 particles with random properties
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: Date.now() + i,
      x: buttonCenterX,
      y: buttonCenterY,
      size: Math.random() * 8 + 4,
      color: getRandomParticleColor(),
      // Random direction and speed
      velocityX: (Math.random() - 0.5) * 10,
      velocityY: (Math.random() - 0.5) * 10,
      // Rotation for star-like particles
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
    }));

    setParticles(newParticles);

    // Trigger animation
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 1000);

    // Remove particles after animation
    setTimeout(() => {
      setParticles([]);
    }, 1500);

    // Call the original onClick handler
    if (onClick) onClick(e);
  };

  // Get a random color for particles (blue and white tones)
  const getRandomParticleColor = () => {
    const colors = [
      "#1A5276", // Dark blue (matching button)
      "#2980B9", // Medium blue
      "#3498DB", // Light blue
      "#AED6F1", // Very light blue
      "#FFFFFF", // White
      "#D6EAF8", // Blue tint
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div className="relative overflow-visible">
      {/* Particle effects */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute z-10 rounded-full opacity-80"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            transform: `translate(-50%, -50%) rotate(${particle.rotation}deg)`,
            transition: "all 1s cubic-bezier(0.165, 0.84, 0.44, 1)",
            boxShadow: `0 0 ${particle.size / 2}px ${particle.color}`,
          }}
        />
      ))}

      {/* Button with shimmer effect */}
      <button
        onClick={createParticles}
        className={`
          relative flex items-center justify-center gap-2 
          bg-[#1A5276] text-white p-2 rounded font-medium 
          hover:bg-[#134564] w-full overflow-hidden
          ${isClicked ? "animate-pulse" : ""}
          transition-all duration-300
        `}
      >
        {/* Static background gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A5276] via-[#2980B9] to-[#1A5276] opacity-80"></div>

        {/* Moving shimmer effect */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
          style={{
            backgroundSize: "200% 100%",
            animation: "shimmerEffect 2s infinite linear",
          }}
        ></div>

        {/* Button content */}
        <Share2 size={16} className="relative z-10" />
        <span className="relative z-10">Share My Schedule With a Friend</span>
      </button>

      {/* Add keyframes for shimmer animation */}
      <style jsx>{`
        @keyframes shimmerEffect {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ShimmeringShareButton;
