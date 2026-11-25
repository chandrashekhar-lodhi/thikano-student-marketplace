import React from 'react';

interface LogoProps {
  className?: string;
  inverted?: boolean;
}

export function Logo({ className = '', inverted = false }: LogoProps) {
  const wordColor = inverted ? 'text-white' : 'text-[#174C3A]';
  const pinFill = inverted ? '#FFFFFF' : '#174C3A';
  const innerStroke = inverted ? '#174C3A' : '#FFFFFF';
  const doorFill = '#E9A45B';

  return (
    <span
      className={`group inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 ${className}`}
    >
      <svg
        width="30"
        height="30"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0 transition-transform duration-150 ease-out group-hover:-translate-y-0.5"
      >
        <path
          d="M32 6C19.297 6 9 16.297 9 29c0 15.6 19.3 28 21.9 29.6a2.2 2.2 0 0 0 2.2 0C35.7 57 55 44.6 55 29 55 16.297 44.703 6 32 6Z"
          fill={pinFill}
        />
        <path
          d="M20.5 30 32 20l11.5 10"
          stroke={innerStroke}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M24.5 28v13h15V28"
          stroke={innerStroke}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M29.2 41v-7.5a2.8 2.8 0 0 1 5.6 0V41"
          fill={doorFill}
          className="transition-transform duration-150 ease-out origin-bottom group-hover:scale-y-110"
          style={{ transformOrigin: '32px 41px' }}
        />
      </svg>
      <span
        className={`font-heading text-xl font-bold tracking-tight whitespace-nowrap shrink-0 transition-opacity duration-150 group-hover:opacity-90 ${wordColor}`}
      >
        THIKANO
      </span>
    </span>
  );
}
