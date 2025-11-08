'use client';

import { useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { formatPrice } from '@/lib/business-category-config';
import { getPlatformLabel } from '@/lib/affiliate-injector';

interface TourCardProps {
  tour: {
    id: string;
    name: string;
    description: string | null;
    duration: string;
    groupSizeMin: number | null;
    groupSizeMax: number | null;
    difficulty: string | null;
    season: string | null;
    priceFrom: number | null;
    currency: string;
    images: string[];
    coverImage: string | null;
    highlights: string[];
    included: string[];
    bookingOptions: string[];
  };
  businessId: string;
}

export default function TourCard({ tour, businessId }: TourCardProps) {
  const [trackingClick, setTrackingClick] = useState<string | null>(null);

  const handleBookingClick = async (platform: string) => {
    setTrackingClick(platform);

    try {
      // Track click and get affiliate URL
      const res = await fetch('/api/affiliate/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          tourExperienceId: tour.id,
          platform
        })
      });

      const data = await res.json();

      if (res.ok && data.url) {
        // Open booking URL in new tab
        window.open(data.url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error(data.error || 'Booking link not available');
      }
    } catch (error) {
      console.error('Error tracking click:', error);
      toast.error('Failed to open booking link');
    } finally {
      setTrackingClick(null);
    }
  };

  const getBookingButtonColor = (platform: string) => {
    const colors: Record<string, string> = {
      direct: 'bg-aurora-green hover:bg-aurora-green/80 text-black',
      getyourguide: 'bg-[#ff6f61] hover:bg-[#e65c50]',
      viator: 'bg-[#00aa6c] hover:bg-[#008c59]',
      tripadvisor: 'bg-[#00af87] hover:bg-[#009670]'
    };
    return colors[platform] || 'bg-gray-600 hover:bg-gray-700';
  };

  const displayImage = tour.coverImage || tour.images[0];

  return (
    <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden hover:border-aurora-green/30 transition-all">
      {/* Tour Image */}
      {displayImage && (
        <div className="relative h-48 w-full bg-gray-800">
          <Image
            src={displayImage}
            alt={tour.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}

      {/* Tour Info */}
      <div className="p-6 space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">{tour.name}</h3>

          {/* Tour Details */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
            {/* Duration */}
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {tour.duration}
            </span>

            {/* Group Size */}
            {(tour.groupSizeMin || tour.groupSizeMax) && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {tour.groupSizeMin && tour.groupSizeMax
                  ? `${tour.groupSizeMin}-${tour.groupSizeMax} people`
                  : tour.groupSizeMax
                    ? `Up to ${tour.groupSizeMax} people`
                    : `${tour.groupSizeMin}+ people`
                }
              </span>
            )}

            {/* Difficulty */}
            {tour.difficulty && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {tour.difficulty}
              </span>
            )}
          </div>

          {/* Season */}
          {tour.season && (
            <div className="mt-2 text-xs text-gray-500">
              {tour.season}
            </div>
          )}
        </div>

        {/* Description */}
        {tour.description && (
          <p className="text-gray-300 text-sm line-clamp-3">
            {tour.description}
          </p>
        )}

        {/* Highlights */}
        {tour.highlights && tour.highlights.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tour.highlights.slice(0, 4).map((highlight, index) => (
              <span
                key={index}
                className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded"
              >
                {highlight}
              </span>
            ))}
            {tour.highlights.length > 4 && (
              <span className="text-xs text-gray-500 px-2 py-1">
                +{tour.highlights.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Price & Booking */}
        <div className="pt-4 border-t border-white/10">
          {tour.priceFrom && (
            <div className="mb-3">
              <span className="text-2xl font-bold text-aurora-green">
                {formatPrice(tour.priceFrom, tour.currency)}
              </span>
              <span className="text-gray-400 text-sm ml-1">/person</span>
            </div>
          )}

          {/* Booking Buttons */}
          <div className="flex flex-col gap-2">
            {tour.bookingOptions.map((platform) => (
              <button
                key={platform}
                onClick={() => handleBookingClick(platform)}
                disabled={trackingClick === platform}
                className={`
                  w-full px-4 py-2.5 rounded-lg text-white font-semibold
                  transition-all disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2
                  ${getBookingButtonColor(platform)}
                `}
              >
                {trackingClick === platform ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Opening...
                  </>
                ) : (
                  <>
                    Book on {getPlatformLabel(platform)}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
