"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import TimeHeader from "@/components/TimeHeader";

interface CelestialEvent {
  name: string;
  date: string;
  endDate?: string;
  type: "meteor" | "comet" | "eclipse" | "conjunction" | "other";
  description: string;
  emoji: string;
  peakTime?: string;
  viewingTips?: string;
  radiant?: string;
  zhr?: number; // Zenithal Hourly Rate for meteor showers
}

export default function CelestialEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<CelestialEvent[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadCelestialEvents();
  }, []);

  const loadCelestialEvents = () => {
    const currentYear = new Date().getFullYear();

    // Comprehensive list of celestial events
    const celestialEvents: CelestialEvent[] = [
      // Meteor Showers
      {
        name: "Quadrantids",
        date: `${currentYear}-01-03`,
        endDate: `${currentYear}-01-04`,
        type: "meteor",
        description: "One of the best annual meteor showers with up to 120 meteors per hour at peak.",
        emoji: "☄️",
        peakTime: "Pre-dawn hours",
        viewingTips: "Best viewed from Northern Hemisphere. Look towards the northeast sky.",
        radiant: "Boötes constellation",
        zhr: 120
      },
      {
        name: "Lyrids",
        date: `${currentYear}-04-22`,
        endDate: `${currentYear}-04-23`,
        type: "meteor",
        description: "Ancient meteor shower observed for over 2,700 years. Known for bright fireballs.",
        emoji: "☄️",
        peakTime: "Pre-dawn hours",
        viewingTips: "Best after midnight. Look towards Lyra constellation near bright star Vega.",
        radiant: "Lyra constellation",
        zhr: 20
      },
      {
        name: "Eta Aquariids",
        date: `${currentYear}-05-06`,
        endDate: `${currentYear}-05-07`,
        type: "meteor",
        description: "Debris from Halley's Comet. Fast meteors leaving glowing trails.",
        emoji: "☄️",
        peakTime: "Pre-dawn hours",
        viewingTips: "Best from Southern Hemisphere. Northern viewers look low on eastern horizon.",
        radiant: "Aquarius constellation",
        zhr: 50
      },
      {
        name: "Delta Aquariids",
        date: `${currentYear}-07-30`,
        endDate: `${currentYear}-07-31`,
        type: "meteor",
        description: "Best viewed from southern latitudes. Faint meteors, good for patient observers.",
        emoji: "☄️",
        peakTime: "After midnight",
        viewingTips: "Look towards the south. Best combined with early Perseids.",
        radiant: "Aquarius constellation",
        zhr: 20
      },
      {
        name: "Perseids",
        date: `${currentYear}-08-12`,
        endDate: `${currentYear}-08-13`,
        type: "meteor",
        description: "Most popular meteor shower! Rich in bright meteors and fireballs.",
        emoji: "☄️",
        peakTime: "Pre-dawn hours",
        viewingTips: "Best shower for Northern Hemisphere. Warm summer nights make viewing comfortable.",
        radiant: "Perseus constellation",
        zhr: 100
      },
      {
        name: "Draconids",
        date: `${currentYear}-10-08`,
        endDate: `${currentYear}-10-09`,
        type: "meteor",
        description: "Best viewed in early evening unlike most showers. Occasional spectacular outbursts.",
        emoji: "☄️",
        peakTime: "Early evening",
        viewingTips: "Look towards Draco constellation in the northern sky after sunset.",
        radiant: "Draco constellation",
        zhr: 10
      },
      {
        name: "Orionids",
        date: `${currentYear}-10-21`,
        endDate: `${currentYear}-10-22`,
        type: "meteor",
        description: "Another shower from Halley's Comet debris. Fast meteors with fine trains.",
        emoji: "☄️",
        peakTime: "After midnight",
        viewingTips: "Look towards Orion constellation. Best after midnight.",
        radiant: "Orion constellation",
        zhr: 20
      },
      {
        name: "Taurids",
        date: `${currentYear}-11-05`,
        endDate: `${currentYear}-11-12`,
        type: "meteor",
        description: "Known for slow, bright fireballs. Actually two separate showers overlapping.",
        emoji: "☄️",
        peakTime: "Midnight",
        viewingTips: "Extended peak period. Look for spectacular fireballs.",
        radiant: "Taurus constellation",
        zhr: 10
      },
      {
        name: "Leonids",
        date: `${currentYear}-11-17`,
        endDate: `${currentYear}-11-18`,
        type: "meteor",
        description: "Famous for producing meteor storms every 33 years. Very fast meteors.",
        emoji: "☄️",
        peakTime: "After midnight",
        viewingTips: "Best after midnight. Meteors appear to radiate from Leo.",
        radiant: "Leo constellation",
        zhr: 15
      },
      {
        name: "Geminids",
        date: `${currentYear}-12-14`,
        endDate: `${currentYear}-12-15`,
        type: "meteor",
        description: "King of meteor showers! Bright, numerous, and reliable every year.",
        emoji: "☄️",
        peakTime: "All night, best around 2 AM",
        viewingTips: "Bundle up! Best viewed around 2 AM. Bright meteors visible all night.",
        radiant: "Gemini constellation",
        zhr: 150
      },
      {
        name: "Ursids",
        date: `${currentYear}-12-22`,
        endDate: `${currentYear}-12-23`,
        type: "meteor",
        description: "Often overlooked shower near winter solstice. Occasional outbursts.",
        emoji: "☄️",
        peakTime: "Pre-dawn hours",
        viewingTips: "Look towards Ursa Minor (Little Dipper) in the northern sky.",
        radiant: "Ursa Minor constellation",
        zhr: 10
      },
      // Add next year's early events
      {
        name: "Quadrantids",
        date: `${currentYear + 1}-01-03`,
        endDate: `${currentYear + 1}-01-04`,
        type: "meteor",
        description: "One of the best annual meteor showers with up to 120 meteors per hour at peak.",
        emoji: "☄️",
        peakTime: "Pre-dawn hours",
        viewingTips: "Best viewed from Northern Hemisphere. Look towards the northeast sky.",
        radiant: "Boötes constellation",
        zhr: 120
      },
    ];

    // Sort by date and filter past events (keep events from 7 days ago)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const sortedEvents = celestialEvents
      .filter(event => new Date(event.date) >= sevenDaysAgo)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setEvents(sortedEvents);
  };

  const getEventStatus = (event: CelestialEvent) => {
    const now = new Date();
    const eventDate = new Date(event.date);
    const endDate = event.endDate ? new Date(event.endDate) : eventDate;

    now.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    if (now >= eventDate && now <= endDate) {
      return { status: "active", label: "Active Now!", color: "bg-green-500" };
    }

    const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil === 1) {
      return { status: "tomorrow", label: "Tomorrow", color: "bg-yellow-500" };
    }
    if (daysUntil <= 7) {
      return { status: "soon", label: `In ${daysUntil} days`, color: "bg-blue-500" };
    }
    if (daysUntil <= 30) {
      return { status: "upcoming", label: `In ${daysUntil} days`, color: "bg-purple-500" };
    }

    return { status: "future", label: formatDate(event.date), color: "bg-gray-500" };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "meteor": return "Meteor Shower";
      case "comet": return "Comet";
      case "eclipse": return "Eclipse";
      case "conjunction": return "Conjunction";
      default: return "Event";
    }
  };

  const filteredEvents = filter === "all"
    ? events
    : events.filter(e => e.type === filter);

  return (
    <div className="min-h-screen bg-[#0f1420] text-white">
      <TimeHeader />

      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/intelligence?tab=cloud")}
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
            Back to Visibility Intel
          </button>

          <h1 className="text-3xl font-bold mb-2">Celestial Events</h1>
          <p className="text-gray-400">
            Upcoming meteor showers, comets, and astronomical events
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {["all", "meteor", "comet", "eclipse", "conjunction"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                filter === type
                  ? "bg-purple-600 text-white"
                  : "bg-white/10 text-gray-400 hover:bg-white/20"
              }`}
            >
              {type === "all" ? "All Events" : getTypeLabel(type)}
            </button>
          ))}
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {filteredEvents.map((event, index) => {
            const eventStatus = getEventStatus(event);
            return (
              <div
                key={`${event.name}-${event.date}-${index}`}
                className={`bg-gradient-to-br from-purple-900/40 to-indigo-900/40 backdrop-blur-lg rounded-2xl p-6 border ${
                  eventStatus.status === "active"
                    ? "border-green-500/50"
                    : eventStatus.status === "tomorrow"
                      ? "border-yellow-500/50"
                      : "border-purple-500/30"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-5xl">{event.emoji}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{event.name}</h3>
                      <span className={`${eventStatus.color} text-white text-xs font-bold px-2 py-1 rounded`}>
                        {eventStatus.label}
                      </span>
                    </div>

                    <div className="text-sm text-purple-300 mb-2">
                      {getTypeLabel(event.type)} • {formatDate(event.date)}
                      {event.endDate && event.endDate !== event.date && ` - ${formatDate(event.endDate)}`}
                    </div>

                    <p className="text-gray-300 mb-4">{event.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {event.zhr && (
                        <div className="bg-black/20 rounded-lg p-3">
                          <div className="text-xs text-gray-400">Peak Rate</div>
                          <div className="text-lg font-bold text-yellow-300">{event.zhr}/hr</div>
                        </div>
                      )}
                      {event.peakTime && (
                        <div className="bg-black/20 rounded-lg p-3">
                          <div className="text-xs text-gray-400">Best Time</div>
                          <div className="text-sm font-bold text-white">{event.peakTime}</div>
                        </div>
                      )}
                      {event.radiant && (
                        <div className="bg-black/20 rounded-lg p-3">
                          <div className="text-xs text-gray-400">Look Towards</div>
                          <div className="text-sm font-bold text-white">{event.radiant}</div>
                        </div>
                      )}
                    </div>

                    {event.viewingTips && (
                      <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <span className="text-lg">💡</span>
                          <div>
                            <div className="text-xs text-blue-300 font-semibold mb-1">Viewing Tips</div>
                            <p className="text-sm text-gray-300">{event.viewingTips}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🔭</span>
            <p className="text-xl text-gray-300">No events found for this filter</p>
            <p className="text-sm text-gray-500 mt-2">Try selecting "All Events"</p>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-8 bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
          <div className="flex gap-3">
            <span className="text-2xl">🌌</span>
            <div className="text-sm text-gray-300">
              <p className="font-semibold text-white mb-2">Viewing Tips for Celestial Events</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Find a dark location away from city lights</li>
                <li>Allow 20-30 minutes for your eyes to adjust to darkness</li>
                <li>Check the moon phase - darker skies mean more visible meteors</li>
                <li>Lie on a blanket for comfortable viewing</li>
                <li>No telescope needed - use your naked eyes!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
