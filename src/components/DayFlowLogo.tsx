import React from 'react';

interface DayFlowLogoProps {
  className?: string;
  size?: number;
}

export const DayFlowLogo: React.FC<DayFlowLogoProps> = ({ className = '', size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 rounded-xl shadow-xs ${className}`}
    >
      <defs>
        <linearGradient id="dfGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>
      {/* Squircle Background */}
      <rect width="100" height="100" rx="26" fill="url(#dfGradient)" />
      {/* Checkmark Path */}
      <path
        d="M28 50.5L43.5 66L72 37.5"
        stroke="#FFFFFF"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Cyan Dot on Checkmark Apex */}
      <circle cx="72" cy="37.5" r="7.5" fill="#38BDF8" />
    </svg>
  );
};
