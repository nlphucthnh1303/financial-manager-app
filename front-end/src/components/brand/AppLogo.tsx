import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: number | string;
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = 'w-7 h-7' }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {/* Circle Background */}
      <circle cx="50" cy="50" r="48" fill="currentColor" className="text-[#171717] dark:text-[#ededed]" />
      
      {/* Upper Sparkle Star Shape */}
      <path
        d="M 49 19
           C 51.5 31, 61 41, 80 49
           C 62.5 52, 54 58, 56 63.5
           C 51 52.5, 43.5 42.5, 40 37.5
           C 44.5 32, 47 24.5, 49 19 Z"
        className="fill-[#ffffff] dark:fill-[#000000]"
      />

      {/* Lower Sparkle Star Shape */}
      <path
        d="M 51 81
           C 48.5 69, 39 59, 20 51
           C 37.5 48, 46 42, 44 36.5
           C 49 47.5, 56.5 57.5, 60 62.5
           C 55.5 68, 53 75.5, 51 81 Z"
        className="fill-[#ffffff] dark:fill-[#000000]"
      />
    </svg>
  );
};
