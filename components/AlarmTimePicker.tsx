"use client";

import React, { useRef, useEffect, useCallback, useMemo } from 'react';

interface AlarmTimePickerProps {
  value: string; // e.g. "09:30 AM" or ""
  onChange: (time: string) => void;
}

const HOURS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
// Continuous 00 to 59
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const PERIODS = ['AM', 'PM'];

const ITEM_HEIGHT = 40; // compact item height in px
const VISIBLE_ITEMS = 5; // 5 visible lines: 2 above, active center, 2 below
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS; // 200px
const PAD_COUNT = Math.floor(VISIBLE_ITEMS / 2); // 2 items padding on top and bottom

/**
 * Single wheel scroll column matching mobile alarm UI with snap-scrolling
 */
function WheelColumn({
  items,
  selected,
  onSelect,
  className = "",
  fontSize = "text-xl",
  activeWeight = "font-black",
}: {
  items: string[];
  selected: string;
  onSelect: (item: string) => void;
  className?: string;
  fontSize?: string;
  activeWeight?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef(false);
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitialized = useRef(false);

  const scrollToIndex = useCallback((index: number, smooth = true) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({
      top: index * ITEM_HEIGHT,
      behavior: smooth ? 'smooth' : 'instant',
    });
  }, []);

  // Initialize position on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    const idx = items.indexOf(selected);
    if (idx !== -1) {
      requestAnimationFrame(() => {
        scrollToIndex(idx, false);
      });
    }
  }, [items, selected, scrollToIndex]);

  // Sync if value changes externally and not currently scrolling
  useEffect(() => {
    if (!hasInitialized.current || isUserScrolling.current) return;
    const idx = items.indexOf(selected);
    if (idx !== -1) {
      scrollToIndex(idx, true);
    }
  }, [selected, items, scrollToIndex]);

  // Handle scroll snap detection
  const handleScroll = useCallback(() => {
    isUserScrolling.current = true;
    if (snapTimer.current) clearTimeout(snapTimer.current);

    snapTimer.current = setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;
      const rawIdx = Math.round(el.scrollTop / ITEM_HEIGHT);
      const safeIdx = Math.max(0, Math.min(rawIdx, items.length - 1));

      // Snap strictly to center
      scrollToIndex(safeIdx, true);

      if (items[safeIdx] !== selected) {
        onSelect(items[safeIdx]);
      }
      isUserScrolling.current = false;
    }, 90);
  }, [items, selected, onSelect, scrollToIndex]);

  useEffect(() => {
    return () => {
      if (snapTimer.current) clearTimeout(snapTimer.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`h-[${CONTAINER_HEIGHT}px] overflow-y-auto no-scrollbar relative select-none ${className}`}
      style={{
        height: CONTAINER_HEIGHT,
        scrollSnapType: 'y mandatory',
      }}
    >
      {/* Top spacer so first element can center on selection strip */}
      <div style={{ height: PAD_COUNT * ITEM_HEIGHT }} aria-hidden="true" />

      {items.map((item) => {
        const isActive = item === selected;
        return (
          <button
            type="button"
            key={item}
            onClick={() => {
              onSelect(item);
              const idx = items.indexOf(item);
              scrollToIndex(idx, true);
            }}
            className="w-full flex items-center justify-center cursor-pointer transition-all duration-150"
            style={{
              height: ITEM_HEIGHT,
              scrollSnapAlign: 'center',
            }}
          >
            <span
              className={`tabular-nums tracking-tight transition-all duration-150 ${fontSize} ${
                isActive
                  ? `${activeWeight} text-[#2F3E3C] scale-110 opacity-100`
                  : 'font-medium text-slate-400 opacity-40 scale-90 hover:opacity-75'
              }`}
            >
              {item}
            </span>
          </button>
        );
      })}

      {/* Bottom spacer so last element can center on selection strip */}
      <div style={{ height: PAD_COUNT * ITEM_HEIGHT }} aria-hidden="true" />
    </div>
  );
}

export default function AlarmTimePicker({ value, onChange }: AlarmTimePickerProps) {
  // Parse hour, minute, period
  let hour = '09';
  let minute = '00';
  let period = 'AM';

  if (value) {
    const parts = value.trim().split(' ');
    if (parts.length === 2) {
      const [h, m] = parts[0].split(':');
      if (h) hour = h.padStart(2, '0');
      if (m) minute = m.padStart(2, '0');
      if (parts[1]) period = parts[1].toUpperCase();
    }
  }

  // Fallbacks if parsed values are invalid
  if (!HOURS.includes(hour)) hour = '09';
  if (!MINUTES.includes(minute)) minute = '00';
  if (!PERIODS.includes(period)) period = 'AM';

  const emitChange = useCallback(
    (newH: string, newM: string, newP: string) => {
      onChange(`${newH}:${newM} ${newP}`);
    },
    [onChange]
  );

  return (
    <div className="w-full max-w-sm mx-auto bg-gradient-to-b from-[#FAF8F3] via-white to-[#F2F7F6] rounded-2xl border border-[#BDDBD1]/60 shadow-sm p-4 select-none">
      {/* Top Header Badge */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#BDDBD1]/30">
        <span className="text-xs font-bold uppercase tracking-wider text-[#2F3E3C]/75">
          Select Time
        </span>
        <div className="px-3 py-0.5 bg-gradient-to-r from-[#2F3E3C] to-[#3d524f] text-white rounded-full text-xs font-black shadow-xs tracking-wide tabular-nums">
          {hour}:{minute} {period}
        </div>
      </div>

      {/* Column Headers: AM/PM, H, M */}
      <div className="grid grid-cols-12 gap-1 mb-1 text-center">
        {/* AM / PM label above its column */}
        <div className="col-span-4 text-[11px] font-bold tracking-wider text-[#2F3E3C]/50 uppercase">
          AM / PM
        </div>

        {/* Unified H & M container labels */}
        <div className="col-span-8 grid grid-cols-2 text-[11px] font-bold tracking-wider text-[#2F3E3C]/50 uppercase">
          <span>H</span>
          <span>M</span>
        </div>
      </div>

      {/* Main Wheel Area */}
      <div
        className="relative grid grid-cols-12 gap-2 items-center overflow-hidden rounded-xl bg-slate-50/60 border border-slate-200/50"
        style={{ height: CONTAINER_HEIGHT }}
      >
        {/* Horizontal Selection Strip / Active Zone Lens (Middle) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-2 z-0 rounded-xl bg-white shadow-xs border border-[#BDDBD1]/70"
          style={{
            height: ITEM_HEIGHT,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        />

        {/* 1. AM / PM Vertically Scrollable Wheel Block */}
        <div className="col-span-4 relative z-10 border-r border-slate-200/60 pr-1">
          <WheelColumn
            items={PERIODS}
            selected={period}
            onSelect={(p) => emitChange(hour, minute, p)}
            fontSize="text-base sm:text-lg"
            activeWeight="font-extrabold"
          />
        </div>

        {/* 2. Unified H and M Grid / Container Side-by-Side */}
        <div className="col-span-8 grid grid-cols-2 relative z-10 pl-1">
          {/* Hour Column */}
          <WheelColumn
            items={HOURS}
            selected={hour}
            onSelect={(h) => emitChange(h, minute, period)}
            fontSize="text-xl sm:text-2xl"
            activeWeight="font-black"
          />

          {/* Minute Column (00 - 59) */}
          <WheelColumn
            items={MINUTES}
            selected={minute}
            onSelect={(m) => emitChange(hour, m, period)}
            fontSize="text-xl sm:text-2xl"
            activeWeight="font-black"
          />
        </div>
      </div>

      {/* Subtle Hint */}
      <p className="text-[11px] text-center text-[#2F3E3C]/55 mt-2.5 font-medium">
        💡 Scroll or tap any unit to snap into the selection strip.
      </p>
    </div>
  );
}
