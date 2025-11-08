'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import RoomCard from '@/components/business/RoomCard';

interface RoomType {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  priceFrom: number | null;
  currency: string;
  images: string[];
  coverImage: string | null;
  amenities: string[];
  bookingOptions: string[];
}

interface RoomsData {
  businessName: string;
  roomTypes: RoomType[];
}

export default function BusinessRoomsPage() {
  const router = useRouter();
  const params = useParams();
  const businessId = params.id as string;

  const [data, setData] = useState<RoomsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;

    fetch(`/api/businesses/${businessId}/rooms`)
      .then((res) => res.json())
      .then((responseData) => {
        if (responseData.error) {
          toast.error(responseData.error);
          router.push(`/businesses/${businessId}`);
          return;
        }
        setData(responseData);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching rooms:', error);
        toast.error('Failed to load rooms');
        router.push(`/businesses/${businessId}`);
      });
  }, [businessId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
        <div className="text-white">Loading rooms...</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-[#1a1f2e]/95 backdrop-blur-lg border-b border-white/10 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/businesses/${businessId}`)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">{data.businessName}</h1>
              <p className="text-sm text-gray-400">Room Types & Booking</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            🏨 Accommodation Options
          </h2>
          <p className="text-gray-400">
            {data.roomTypes.length} room {data.roomTypes.length === 1 ? 'type' : 'types'} available
          </p>
        </div>

        {/* Room Grid */}
        {data.roomTypes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.roomTypes.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                businessId={businessId}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white/5 rounded-lg p-12 border border-white/10 text-center">
            <div className="text-6xl mb-4">🏨</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No Rooms Available Yet
            </h3>
            <p className="text-gray-400">
              This business hasn't added any room types yet. Check back soon!
            </p>
          </div>
        )}

        {/* Back to Profile Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => router.push(`/businesses/${businessId}`)}
            className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Business Profile
          </button>
        </div>
      </div>
    </div>
  );
}
