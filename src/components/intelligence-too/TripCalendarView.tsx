"use client";

import { useState, useEffect, useMemo } from "react";
import { useSpaceWeather } from "@/hooks/useSpaceWeather";

interface TripCalendarViewProps {
  selectedMonth?: Date;
  userLatitude?: number;
  onDateSelect?: (date: Date) => void;
  className?: string;
}

interface DayData {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isPast: boolean;
  isToday: boolean;
  probability: "high" | "moderate" | "low" | "unknown";
  moonPhase: number; // 0-1 (0 = new moon, 0.5 = full moon)
  kpForecast?: number;
  hasEvent?: boolean; // CME, HSS, etc.
  eventType?: string;
}

// Calculate moon phase for a given date
// Returns 0-1 where 0 = new moon, 0.5 = full moon
function getMoonPhase(date: Date): number {
  // Known new moon: January 6, 2000
  const knownNewMoon = new Date(2000, 0, 6, 18, 14, 0);
  const lunarCycle = 29.53058867; // days

  const daysSinceKnownNewMoon = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
  const phase = (daysSinceKnownNewMoon % lunarCycle) / lunarCycle;

  return phase < 0 ? phase + 1 : phase;
}

// Get moon phase emoji
function getMoonEmoji(phase: number): string {
  if (phase < 0.03 || phase > 0.97) return "🌑"; // New moon
  if (phase < 0.22) return "🌒"; // Waxing crescent
  if (phase < 0.28) return "🌓"; // First quarter
  if (phase < 0.47) return "🌔"; // Waxing gibbous
  if (phase < 0.53) return "🌕"; // Full moon
  if (phase < 0.72) return "🌖"; // Waning gibbous
  if (phase < 0.78) return "🌗"; // Last quarter
  return "🌘"; // Waning crescent
}

// Check if moon is favorable for aurora viewing (< 50% illumination)
function isMoonFavorable(phase: number): boolean {
  // Near new moon (0 or 1) is best, full moon (0.5) is worst
  const illumination = Math.abs(2 * phase - 1);
  return illumination > 0.5; // Less than 50% illumination
}

export function TripCalendarView({
  selectedMonth: initialMonth,
  userLatitude = 55,
  onDateSelect,
  className = "",
}: TripCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return initialMonth || new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const { forecast3Day } = useSpaceWeather({
    enableForecast: true,
    refreshInterval: 3600000, // 1 hour
  });

  // Generate calendar days
  const calendarDays = useMemo((): DayData[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDay = firstDayOfMonth.getDay(); // 0 = Sunday

    const days: DayData[] = [];

    // Previous month days
    const prevMonth = new Date(year, month, 0);
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonth.getDate() - i);
      days.push({
        date,
        dayOfMonth: date.getDate(),
        isCurrentMonth: false,
        isPast: date < today,
        isToday: false,
        probability: "unknown",
        moonPhase: getMoonPhase(date),
      });
    }

    // Current month days
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(year, month, day);
      const moonPhase = getMoonPhase(date);
      const isPast = date < today;
      const isToday = date.getTime() === today.getTime();

      // Determine probability based on:
      // 1. 27-day solar rotation (recurrent activity)
      // 2. Moon phase
      // 3. 3-day forecast if available

      let probability: DayData["probability"] = "unknown";
      let kpForecast: number | undefined;
      let hasEvent = false;
      let eventType: string | undefined;

      if (!isPast) {
        // Check 3-day forecast
        if (forecast3Day?.forecasts) {
          const forecastMatch = forecast3Day.forecasts.find(f => {
            const fDate = new Date(f.date);
            return fDate.toDateString() === date.toDateString();
          });

          if (forecastMatch) {
            kpForecast = forecastMatch.kpExpected;
            if (forecastMatch.auroraLikelihood === "very_likely" || forecastMatch.auroraLikelihood === "likely") {
              probability = "high";
            } else if (forecastMatch.auroraLikelihood === "possible") {
              probability = "moderate";
            } else {
              probability = "low";
            }
          }
        }

        // 27-day solar rotation pattern
        // Check if this day aligns with typical recurrent activity
        const dayOfYear = Math.floor((date.getTime() - new Date(year, 0, 0).getTime()) / (1000 * 60 * 60 * 24));
        const rotationPhase = dayOfYear % 27;

        // Coronal holes often recur at similar rotation phases
        // Simplified: assume activity peaks around days 5-10 of each rotation
        if (probability === "unknown") {
          if (rotationPhase >= 5 && rotationPhase <= 10) {
            probability = "moderate";
            hasEvent = true;
            eventType = "Recurrent hole";
          } else {
            // Check moon phase - bad moon = lower probability display
            const moonFavorable = isMoonFavorable(moonPhase);
            probability = moonFavorable ? "moderate" : "low";
          }
        }

        // Full moon penalty
        if (moonPhase > 0.45 && moonPhase < 0.55) {
          if (probability === "high") probability = "moderate";
          else if (probability === "moderate") probability = "low";
        }
      }

      days.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: true,
        isPast,
        isToday,
        probability,
        moonPhase,
        kpForecast,
        hasEvent,
        eventType,
      });
    }

    // Next month days to fill the grid (6 rows x 7 days = 42)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        dayOfMonth: i,
        isCurrentMonth: false,
        isPast: false,
        isToday: false,
        probability: "unknown",
        moonPhase: getMoonPhase(date),
      });
    }

    return days;
  }, [currentMonth, forecast3Day]);

  // Find best windows this month
  const bestWindows = useMemo(() => {
    const currentMonthDays = calendarDays.filter(d => d.isCurrentMonth && !d.isPast);
    const windows: { start: Date; end: Date; reason: string }[] = [];

    let windowStart: Date | null = null;
    let windowReason = "";

    currentMonthDays.forEach((day, index) => {
      const isGood = day.probability === "high" || day.probability === "moderate";
      const moonFavorable = isMoonFavorable(day.moonPhase);

      if (isGood && moonFavorable && !windowStart) {
        windowStart = day.date;
        windowReason = day.eventType || (day.kpForecast && day.kpForecast >= 4 ? "Active forecast" : "Favorable conditions");
      } else if ((!isGood || !moonFavorable) && windowStart) {
        windows.push({
          start: windowStart,
          end: currentMonthDays[index - 1].date,
          reason: windowReason,
        });
        windowStart = null;
      }
    });

    // Close any open window
    if (windowStart && currentMonthDays.length > 0) {
      windows.push({
        start: windowStart,
        end: currentMonthDays[currentMonthDays.length - 1].date,
        reason: windowReason,
      });
    }

    return windows.slice(0, 3); // Top 3 windows
  }, [calendarDays]);

  // Find new moon date this month
  const newMoonDate = useMemo((): DayData | null => {
    const currentMonthDays = calendarDays.filter(d => d.isCurrentMonth);
    let closest: DayData | null = null;
    let closestDiff = Infinity;

    for (const day of currentMonthDays) {
      const diff = Math.min(day.moonPhase, 1 - day.moonPhase);
      if (diff < closestDiff) {
        closestDiff = diff;
        closest = day;
      }
    }

    return closest;
  }, [calendarDays]);

  const getProbabilityColor = (prob: DayData["probability"], isPast: boolean) => {
    if (isPast) return "bg-gray-800 text-gray-600";
    switch (prob) {
      case "high": return "bg-green-900/40 text-green-400 border-green-500/30";
      case "moderate": return "bg-yellow-900/40 text-yellow-400 border-yellow-500/30";
      case "low": return "bg-red-900/30 text-red-400 border-red-500/20";
      default: return "bg-gray-800/40 text-gray-400 border-gray-500/20";
    }
  };

  const formatDateRange = (start: Date, end: Date) => {
    const sameMonth = start.getMonth() === end.getMonth();
    if (start.getTime() === end.getTime()) {
      return start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    if (sameMonth) {
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.getDate()}`;
    }
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className={`bg-white/5 rounded-xl border border-white/10 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            ◀
          </button>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>📅</span>
            <span>{monthName}</span>
          </h3>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-3">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="text-center text-xs text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <button
              key={index}
              onClick={() => !day.isPast && day.isCurrentMonth && onDateSelect?.(day.date)}
              disabled={day.isPast || !day.isCurrentMonth}
              className={`
                aspect-square p-1 rounded-lg border transition-all text-xs
                ${day.isCurrentMonth ? getProbabilityColor(day.probability, day.isPast) : "bg-transparent text-gray-700 border-transparent"}
                ${day.isToday ? "ring-2 ring-aurora-green ring-offset-1 ring-offset-[#0a0e17]" : ""}
                ${!day.isPast && day.isCurrentMonth ? "hover:scale-105 cursor-pointer" : "cursor-default"}
              `}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span className={`font-medium ${day.isToday ? "text-aurora-green" : ""}`}>
                  {day.dayOfMonth}
                </span>
                {day.isCurrentMonth && !day.isPast && (
                  <span className="text-[8px] opacity-70">
                    {getMoonEmoji(day.moonPhase)}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Best Windows */}
      {bestWindows.length > 0 && (
        <div className="p-4 border-t border-white/10">
          <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <span>🎯</span>
            <span>Best Windows This Month</span>
          </h4>
          <div className="space-y-2">
            {bestWindows.map((window, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm bg-green-900/20 rounded-lg px-3 py-2 border border-green-500/20"
              >
                <span className="text-green-400 font-medium">
                  {formatDateRange(window.start, window.end)}
                </span>
                <span className="text-green-300 text-xs">{window.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Moon Info */}
      {newMoonDate && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>🌑</span>
            <span>
              New Moon: {newMoonDate.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              <span className="text-gray-500 ml-1">(optimal darkness)</span>
            </span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="px-4 pb-4">
        <div className="flex flex-wrap gap-3 text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-900/40 border border-green-500/30"></div>
            <span className="text-gray-400">High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-900/40 border border-yellow-500/30"></div>
            <span className="text-gray-400">Moderate</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-900/30 border border-red-500/20"></div>
            <span className="text-gray-400">Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-800 border border-gray-500/20"></div>
            <span className="text-gray-400">Past</span>
          </div>
        </div>
      </div>
    </div>
  );
}
