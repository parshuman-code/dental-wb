"use client";

import React, { useRef, useState } from 'react';

export interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: string;
  glowSize?: number;
  glowBlur?: string;
  children: React.ReactNode;
}

export default function GlowCard({
  glowColor = "rgba(45, 212, 191, 0.18)",
  glowSize = 280,
  glowBlur = "blur-2xl",
  className = "",
  children,
  onMouseMove,
  onMouseEnter,
  onMouseLeave,
  ...props
}: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setCoords({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
    if (onMouseMove) {
      onMouseMove(e);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(true);
    if (onMouseEnter) {
      onMouseEnter(e);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(false);
    if (onMouseLeave) {
      onMouseLeave(e);
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${className}`}
      {...props}
    >
      {/* Soft spotlight following cursor */}
      <div
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
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
