import React from 'react';

interface IntersectionIconProps {
  className?: string;
  size?: number;
}

export const IntersectionIcon: React.FC<IntersectionIconProps> = ({
  className = '',
  size = 16
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Circle (bottom-left) */}
      <circle
        cx="9"
        cy="13"
        r="7"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Square (top-right) - 10% larger */}
      <rect
        x="9.5"
        y="3.5"
        width="11"
        height="11"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Intersection area (striped pattern) */}
      <defs>
        <pattern
          id="diagonalStripes"
          patternUnits="userSpaceOnUse"
          width="2.5"
          height="2.5"
          patternTransform="rotate(45)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="2.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </pattern>
        <clipPath id="intersectionClip">
          {/* Circle clip */}
          <circle cx="9" cy="13" r="7" />
        </clipPath>
      </defs>

      {/* Striped intersection - square clipped by circle */}
      <rect
        x="9.5"
        y="3.5"
        width="11"
        height="11"
        fill="url(#diagonalStripes)"
        clipPath="url(#intersectionClip)"
      />
    </svg>
  );
};
