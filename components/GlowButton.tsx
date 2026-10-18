"use client";

import React, { useRef, useState, memo } from 'react';

export interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  glowColor?: string;
  glowSize?: number;
  glowBlur?: string;
  children: React.ReactNode;
}

function GlowButtonComponent({
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
  const rafId = useRef<number | null>(null);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }

    rafId.current = requestAnimationFrame(() => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
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

  React.useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

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

      {/* Button Content rendered above the glow */}
      <span className="relative z-10 flex items-center justify-center gap-2 w-full h-full">
        {children}
      </span>
    </button>
  );
}

const GlowButton = memo(GlowButtonComponent);
export default GlowButton;
