"use client";

import { useState, useEffect } from "react";
import TimeHeader from "@/components/TimeHeader";
import { BackyardAlertCard } from "@/components/intelligence-too/BackyardAlertCard";
import { ActivityWindowCard } from "@/components/intelligence-too/ActivityWindowCard";
import { ChaseDecisionCard } from "@/components/intelligence-too/ChaseDecisionCard";
import { DarkSkySiteFinder } from "@/components/intelligence-too/DarkSkySiteFinder";
import { TripCalendarView } from "@/components/intelligence-too/TripCalendarView";
import { DestinationCompare } from "@/components/intelligence-too/DestinationCompare";

type TabType = "backyard" | "chase" | "trip";

interface Location {
  latitude: number;
  longitude: number;
}

export default function IntelligenceTooPage() {
  const [activeTab, setActiveTab] = useState<TabType>("backyard");
  const [location, setLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  // Get user location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation not supported");
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationError("Could not get your location");
        setIsLoadingLocation(false);
        // Default to a mid-latitude location for demo
        setLocation({ latitude: 45.0, longitude: -122.0 });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  const tabs: { id: TabType; icon: string; label: string; description: string }[] = [
    { id: "backyard", icon: "🏠", label: "Backyard", description: "Can I see it now?" },
    { id: "chase", icon: "🚗", label: "Chase", description: "Should I drive out?" },
    { id: "trip", icon: "✈️", label: "Trip", description: "Planning a holiday" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0e17] pb-24">
      <TimeHeader />

      {/* Persona Tab Navigation */}
      <div className="sticky top-[89px] z-40 bg-[#1a1f2e]/95 backdrop-blur-lg border-b border-white/10 px-4 py-2">
        <div className="max-w-screen-lg mx-auto">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 px-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? "bg-aurora-green text-black"
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-lg">{tab.icon}</span>
                  <span className="text-xs font-medium">{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-screen-lg mx-auto p-4">
        {/* Backyard View - Real-time "Is it happening now?" */}
        {activeTab === "backyard" && (
          <div className="space-y-4">
            {/* Hero Card - GO/NO-GO */}
            <BackyardAlertCard
              latitude={location?.latitude}
              longitude={location?.longitude}
              isLoadingLocation={isLoadingLocation}
            />

            {/* Activity Window */}
            <ActivityWindowCard
              latitude={location?.latitude}
              longitude={location?.longitude}
            />

            {/* Quick Tips */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-semibold text-white mb-3">Quick Tips for Backyard Viewing</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-aurora-green">•</span>
                  <span>Give your eyes 15-20 minutes to adjust to darkness</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-aurora-green">•</span>
                  <span>Turn off nearby lights and avoid looking at your phone</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-aurora-green">•</span>
                  <span>Even faint aurora can show up vividly on camera</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Chase View - Decision support for driving out */}
        {activeTab === "chase" && (
          <div className="space-y-4">
            {/* Main Decision Card */}
            <ChaseDecisionCard
              latitude={location?.latitude}
              longitude={location?.longitude}
              isLoadingLocation={isLoadingLocation}
            />

            {/* Activity Window */}
            <ActivityWindowCard
              latitude={location?.latitude}
              longitude={location?.longitude}
            />

            {/* Dark Sky Sites Finder */}
            <DarkSkySiteFinder
              latitude={location?.latitude}
              longitude={location?.longitude}
            />
          </div>
        )}

        {/* Trip View - Holiday planning */}
        {activeTab === "trip" && (
          <div className="space-y-4">
            {/* Calendar View */}
            <TripCalendarView userLatitude={location?.latitude} />

            {/* Destination Comparison */}
            <DestinationCompare />

            {/* Trip Planning Tips */}
            <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 rounded-xl p-4 border border-indigo-500/30">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <span>💡</span>
                <span>Trip Planning Tips</span>
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400">•</span>
                  <span><strong>27-day cycle:</strong> Coronal holes rotate with the sun, so activity often repeats</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400">•</span>
                  <span><strong>Moon phase:</strong> New moon = darkest skies, best for faint aurora</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400">•</span>
                  <span><strong>Solar maximum:</strong> We're approaching peak - great for mid-latitude viewing!</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-400">•</span>
                  <span><strong>Stay flexible:</strong> Book accommodations with free cancellation when possible</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Location Status */}
      {locationError && (
        <div className="fixed bottom-20 left-4 right-4 bg-yellow-900/80 backdrop-blur rounded-lg p-3 text-sm text-yellow-200 max-w-screen-lg mx-auto">
          <span className="font-medium">Location:</span> {locationError}. Using default location.
        </div>
      )}
    </div>
  );
}
