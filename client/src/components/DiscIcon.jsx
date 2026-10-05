import React from 'react';

/**
 * DiscIcon Component
 * Renders an optical media disc (CD / DVD / 4K Blu-ray) with the specular glare
 * reflection wedges and center clamping ring hub based on the user reference illustration.
 */
export function DiscIcon({ className = 'w-6 h-6', ...props }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Outer disc body */}
      <circle cx="50" cy="50" r="46" fill="#18181b" />

      {/* Upper-left specular glare wedge */}
      <path
        d="M 36.63 43.19 L 9.01 29.12 A 46 46 0 0 1 29.12 9.01 L 43.19 36.63 A 15 15 0 0 0 36.63 43.19 Z"
        fill="#ffffff"
      />

      {/* Lower-right specular glare wedge */}
      <path
        d="M 63.37 56.81 L 90.99 70.88 A 46 46 0 0 1 70.88 90.99 L 56.81 63.37 A 15 15 0 0 0 63.37 56.81 Z"
        fill="#ffffff"
      />

      {/* Center clamping hub (white circular band with dark stroke) */}
      <circle cx="50" cy="50" r="14.5" fill="#ffffff" stroke="#18181b" strokeWidth="1.6" />

      {/* Spindle hole in center */}
      <circle cx="50" cy="50" r="6.5" fill="#18181b" />
    </svg>
  );
}

export default DiscIcon;
