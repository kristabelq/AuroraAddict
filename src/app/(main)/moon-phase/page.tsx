"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import TimeHeader from "@/components/TimeHeader";

interface MoonPhaseData {
  phase: string;
  illumination: number;
  emoji: string;
}

export default function MoonPhasePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthDays, setMonthDays] = useState<Date[]>([]);
  const [moonPhases, setMoonPhases] = useState<Map<string, MoonPhaseData>>(new Map());

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (session?.user && !session.user.onboardingComplete) {
      router.push("/onboarding");
    }
  }, [session, status, router]);

  useEffect(() => {
    generateCalendarDays();
  }, [currentMonth]);

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Get first day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Get the day of week for first day (0 = Sunday)
    const startDayOfWeek = firstDay.getDay();

    // Calculate days to show from previous month
    const daysFromPrevMonth = startDayOfWeek;
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    // Calculate days to show from next month to complete the grid
    const totalDaysInMonth = lastDay.getDate();
    const lastDayOfWeek = lastDay.getDay();
    const daysFromNextMonth = 6 - lastDayOfWeek;

    const days: Date[] = [];

    // Add days from previous month
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthLastDay - i));
    }

    // Add days from current month
    for (let i = 1; i <= totalDaysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    // Add days from next month
    for (let i = 1; i <= daysFromNextMonth; i++) {
      days.push(new Date(year, month + 1, i));
    }

    setMonthDays(days);
    calculateMoonPhasesForDays(days);
  };

  const calculateMoonPhasesForDays = (days: Date[]) => {
    const phases = new Map<string, MoonPhaseData>();

    days.forEach(date => {
      const moonData = calculateMoonPhase(date);
      const dateKey = date.toISOString().split('T')[0];
      phases.set(dateKey, moonData);
    });

    setMoonPhases(phases);
  };

  const calculateMoonPhase = (date: Date): MoonPhaseData => {
    const knownNewMoon = new Date(2000, 0, 6, 18, 14); // Jan 6, 2000
    const daysSinceKnownNew = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
    const currentPhase = (daysSinceKnownNew % 29.53059) / 29.53059;

    let phaseName = "";
    let illumination = 0;
    let emoji = "";

    if (currentPhase < 0.033) {
      phaseName = "New Moon";
      illumination = 0;
      emoji = "🌑";
    } else if (currentPhase < 0.216) {
      phaseName = "Waxing Crescent";
      illumination = currentPhase * 100;
      emoji = "🌒";
    } else if (currentPhase < 0.283) {
      phaseName = "First Quarter";
      illumination = 50;
      emoji = "🌓";
    } else if (currentPhase < 0.466) {
      phaseName = "Waxing Gibbous";
      illumination = 50 + (currentPhase - 0.25) * 200;
      emoji = "🌔";
    } else if (currentPhase < 0.533) {
      phaseName = "Full Moon";
      illumination = 100;
      emoji = "🌕";
    } else if (currentPhase < 0.716) {
      phaseName = "Waning Gibbous";
      illumination = 100 - (currentPhase - 0.5) * 200;
      emoji = "🌖";
    } else if (currentPhase < 0.783) {
      phaseName = "Last Quarter";
      illumination = 50;
      emoji = "🌗";
    } else {
      phaseName = "Waning Crescent";
      illumination = (1 - currentPhase) * 100;
      emoji = "🌘";
    }

    return {
      phase: phaseName,
      illumination: Math.round(illumination),
      emoji,
    };
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] pb-24">
      <TimeHeader />

      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/intelligence?tab=cosmic")}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Cosmic Intel
          </button>

          <h1 className="text-3xl font-bold mb-2">Moon Phase Calendar</h1>
          <p className="text-gray-400">
            View the moon phase for each day of the month
          </p>
        </div>

        {/* Calendar Controls */}
        <div className="bg-[#1a1f2e]/95 backdrop-blur-lg border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div className="text-center">
              <h2 className="text-2xl font-bold">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
            </div>

            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          <div className="flex justify-center mb-6">
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              Today
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-gray-400 text-sm font-semibold py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {monthDays.map((date, index) => {
              const dateKey = date.toISOString().split('T')[0];
              const moonData = moonPhases.get(dateKey);
              const today = isToday(date);
              const currentMonthDay = isCurrentMonth(date);

              return (
                <div
                  key={index}
                  className={`
                    relative aspect-square rounded-lg p-2 flex flex-col items-center justify-center
                    transition-all
                    ${today ? 'bg-purple-600/40 border-2 border-purple-400' : 'bg-white/5 hover:bg-white/10'}
                    ${!currentMonthDay ? 'opacity-40' : ''}
                  `}
                >
                  <div className={`text-sm font-semibold mb-1 ${today ? 'text-white' : currentMonthDay ? 'text-gray-300' : 'text-gray-500'}`}>
                    {date.getDate()}
                  </div>
                  {moonData && (
                    <>
                      <div className="text-3xl mb-1">
                        {moonData.emoji}
                      </div>
                      <div className="text-xs text-gray-400 text-center">
                        {moonData.illumination}%
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-[#1a1f2e]/95 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Moon Phases</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🌑</span>
              <div>
                <div className="font-semibold text-sm">New Moon</div>
                <div className="text-xs text-gray-400">0% Illuminated</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🌓</span>
              <div>
                <div className="font-semibold text-sm">First Quarter</div>
                <div className="text-xs text-gray-400">50% Illuminated</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🌕</span>
              <div>
                <div className="font-semibold text-sm">Full Moon</div>
                <div className="text-xs text-gray-400">100% Illuminated</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🌗</span>
              <div>
                <div className="font-semibold text-sm">Last Quarter</div>
                <div className="text-xs text-gray-400">50% Illuminated</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
