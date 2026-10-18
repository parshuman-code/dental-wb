"use client";

import React, { useRef, useState, memo } from 'react';

export interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: string;
  glowSize?: number;
  glowBlur?: string;
  children: React.ReactNode;
}

function GlowCardComponent({
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
  const rafId = useRef<number | null>(null);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }

    rafId.current = requestAnimationFrame(() => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        setCoords({
          x: clientX - rect.left,
          y: clientY - rect.top,
        });
      }
    });

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

  React.useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

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
        className={`pointer-events-none absolute rounded-full transition-opacity duration-300 ${glowBlur} ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          transform: `translate3d(calc(${coords.x}px - 50%), calc(${coords.y}px - 50%), 0)`,
          width: `${glowSize}px`,
          height: `${glowSize}px`,
          backgroundColor: glowColor,
          zIndex: 1,
          willChange: isHovered ? 'transform, opacity' : 'auto',
        }}
      />
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}

const GlowCard = memo(GlowCardComponent);
export default GlowCard;
