"use client";

import React, { useRef, useState } from 'react';

export interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  glowColor?: string;
  glowSize?: number;
  glowBlur?: string;
  children: React.ReactNode;
}

export default function GlowButton({
  glowColor = "rgba(45, 212, 191, 0.35)", // soft teal / aqua glow matching dental theme
  glowSize = 140,
  glowBlur = "blur-xl",
  className = "",
  children,
  onMouseMove,
  onMouseEnter,
  onMouseLeave,
  ...props
}: GlowButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
    if (onMouseMove) {
      onMouseMove(e);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(true);
    if (onMouseEnter) {
      onMouseEnter(e);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(false);
    if (onMouseLeave) {
      onMouseLeave(e);
    }
  };

  return (
    <button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${className}`}
      {...props}
    >
      {/* Dynamic Cursor-Tracking Glow / Spotlight */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-300 ${glowBlur} ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          left: `${coords.x}px`,
          top: `${coords.y}px`,
          width: `${glowSize}px`,
          height: `${glowSize}px`,
          backgroundColor: glowColor,
          zIndex: 1,
        }}
      />

      {/* Button Content rendered above the glow */}
      <span className="relative z-10 flex items-center justify-center gap-2 w-full h-full">
        {children}
      </span>
    </button>
  );
}
