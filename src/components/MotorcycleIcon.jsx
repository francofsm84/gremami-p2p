import React from 'react';

export default function MotorcycleIcon({ size = 16, className = '', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Ruedas */}
      <circle cx="5" cy="16" r="3" />
      <circle cx="19" cy="16" r="3" />
      {/* Cuadro y Chasis */}
      <path d="M5 16h3l3.5-5h4l2.5 5h3" />
      <path d="M11.5 11l-2.5-6h-3" />
      <path d="M14.5 8h3" />
      {/* Piloto casco */}
      <circle cx="13" cy="5.5" r="1.2" fill="currentColor" />
    </svg>
  );
}
