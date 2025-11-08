"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface AnalyticsOverview {
  totalViews: number;
  totalClicks: number;
  clickThroughRate: number;
}

interface RoomTypeAnalytics {
  id: string;
  name: string;
  viewCount: number;
  clickCount: number;
  isActive: boolean;
  priceFrom: number | null;
  currency: string;
}

interface TourAnalytics {
  id: string;
  name: string;
  viewCount: number;
  clickCount: number;
  isActive: boolean;
  priceFrom: number | null;
  currency: string;
}

interface AnalyticsData {
  overview: AnalyticsOverview;
  roomTypes: {
    total: {
      views: number;
      clicks: number;
      count: number;
      activeCount: number;
    };
    items: RoomTypeAnalytics[];
  };
  tours: {
    total: {
      views: number;
      clicks: number;
      count: number;
      activeCount: number;
    };
    items: TourAnalytics[];
  };
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchAnalytics();
    }
  }, [status]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/business/analytics");
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          toast.error(data.error);
          router.push("/profile/edit");
          return;
        }
        throw new Error(data.error || "Failed to load analytics");
      }

      setAnalyticsData(data);
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      toast.error(error.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const calculateCTR = (clicks: number, views: number): string => {
    if (views === 0) return "0.0";
    return ((clicks / views) * 100).toFixed(1);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-purple-950/20 to-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-aurora-green border-r-aurora-blue border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-purple-950/20 to-black">
        <div className="text-center">
          <p className="text-gray-400">No analytics data available</p>
        </div>
      </div>
    );
  }

  const hasNoData = analyticsData.roomTypes.items.length === 0 && analyticsData.tours.items.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black pb-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/profile/edit")}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Settings
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
              <p className="text-gray-400">
                Track your room types and tours performance
              </p>
            </div>
          </div>
        </div>

        {hasNoData ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Data Yet</h3>
            <p className="text-gray-400 mb-6">
              Add room types or tours to start tracking analytics
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push("/business/room-types")}
                className="bg-gradient-to-r from-aurora-green to-aurora-blue text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Add Room Types
              </button>
              <button
                onClick={() => router.push("/business/tours")}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Add Tours
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Total Views */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-400">Total Views</h3>
                  <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl">
                    <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="text-4xl font-bold text-white mb-1">
                  {analyticsData.overview.totalViews.toLocaleString()}
                </p>
                <p className="text-sm text-gray-400">
                  Across all listings
                </p>
              </div>

              {/* Total Clicks */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-400">Total Clicks</h3>
                  <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
                    <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="text-4xl font-bold text-white mb-1">
                  {analyticsData.overview.totalClicks.toLocaleString()}
                </p>
                <p className="text-sm text-gray-400">
                  Booking link clicks
                </p>
              </div>

              {/* Click-Through Rate */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-400">Click-Through Rate</h3>
                  <div className="p-3 bg-gradient-to-br from-aurora-green/20 to-emerald-500/20 rounded-xl">
                    <svg className="w-6 h-6 text-aurora-green" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <p className="text-4xl font-bold text-white mb-1">
                  {analyticsData.overview.clickThroughRate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-400">
                  Average conversion rate
                </p>
              </div>
            </div>

            {/* Room Types Performance */}
            {analyticsData.roomTypes.items.length > 0 && (
              <div className="mb-8">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                  <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-white mb-1">Room Types Performance</h2>
                        <p className="text-sm text-gray-400">
                          {analyticsData.roomTypes.total.count} total ({analyticsData.roomTypes.total.activeCount} active)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Total Performance</p>
                        <p className="text-lg font-semibold text-white">
                          {analyticsData.roomTypes.total.views.toLocaleString()} views, {analyticsData.roomTypes.total.clicks.toLocaleString()} clicks
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-white/5">
                          <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Room Type</th>
                          <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                          <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Views</th>
                          <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Clicks</th>
                          <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">CTR</th>
                          <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Price From</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {[...analyticsData.roomTypes.items]
                          .sort((a, b) => b.viewCount - a.viewCount)
                          .map((room) => (
                            <tr key={room.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4">
                                <p className="text-white font-medium">{room.name}</p>
                              </td>
                              <td className="px-6 py-4">
                                {room.isActive ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-aurora-green/20 text-aurora-green">
                                    Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                                    Inactive
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-white font-medium">{room.viewCount.toLocaleString()}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-white font-medium">{room.clickCount.toLocaleString()}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-aurora-green font-semibold">
                                  {calculateCTR(room.clickCount, room.viewCount)}%
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {room.priceFrom ? (
                                  <span className="text-gray-300">
                                    {room.currency} {room.priceFrom}
                                  </span>
                                ) : (
                                  <span className="text-gray-500">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tours Performance */}
            {analyticsData.tours.items.length > 0 && (
              <div className="mb-8">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                  <div className="p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-white mb-1">Tours Performance</h2>
                        <p className="text-sm text-gray-400">
                          {analyticsData.tours.total.count} total ({analyticsData.tours.total.activeCount} active)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Total Performance</p>
                        <p className="text-lg font-semibold text-white">
                          {analyticsData.tours.total.views.toLocaleString()} views, {analyticsData.tours.total.clicks.toLocaleString()} clicks
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-white/5">
                          <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Tour Name</th>
                          <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                          <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Views</th>
                          <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Clicks</th>
                          <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">CTR</th>
                          <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Price From</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {[...analyticsData.tours.items]
                          .sort((a, b) => b.viewCount - a.viewCount)
                          .map((tour) => (
                            <tr key={tour.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4">
                                <p className="text-white font-medium">{tour.name}</p>
                              </td>
                              <td className="px-6 py-4">
                                {tour.isActive ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-aurora-green/20 text-aurora-green">
                                    Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                                    Inactive
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-white font-medium">{tour.viewCount.toLocaleString()}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-white font-medium">{tour.clickCount.toLocaleString()}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-aurora-green font-semibold">
                                  {calculateCTR(tour.clickCount, tour.viewCount)}%
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {tour.priceFrom ? (
                                  <span className="text-gray-300">
                                    {tour.currency} {tour.priceFrom}
                                  </span>
                                ) : (
                                  <span className="text-gray-500">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
