"use client";

import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
}

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  duration = 1000,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Small RAF delay to let the browser paint first, then animate
            requestAnimationFrame(() => {
              setIsVisible(true);
              // Clean up will-change after animation completes
              setTimeout(() => setHasAnimated(true), duration + delay + 100);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [duration, delay]);

  // Gentler translate values (6 instead of 10) for smoother motion
  const getTransform = () => {
    if (isVisible) return 'translate3d(0, 0, 0)';
    switch (direction) {
      case 'up':    return 'translate3d(0, 24px, 0)';
      case 'down':  return 'translate3d(0, -24px, 0)';
      case 'left':  return 'translate3d(24px, 0, 0)';
      case 'right': return 'translate3d(-24px, 0, 0)';
      case 'none':  return 'translate3d(0, 0, 0)';
      default:      return 'translate3d(0, 24px, 0)';
    }
  };

  return (
    <div
      ref={elementRef}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: `${getTransform()} scale(${isVisible ? 1 : 0.985})`,
        filter: isVisible ? 'blur(0px)' : 'blur(3px)',
        transitionProperty: 'opacity, transform, filter',
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`,
        // Ultra-smooth spring-like easing — slow start, smooth coast, gentle land
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        willChange: hasAnimated ? 'auto' : 'opacity, transform, filter',
      }}
      className={className}
    >
      {children}
    </div>
  );
}
