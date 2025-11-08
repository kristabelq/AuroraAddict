"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import BusinessDashboardLayout from "@/components/BusinessDashboardLayout";

interface AnalyticsOverview {
  totalViews: number;
  totalClicks: number;
  clickThroughRate: number;
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
    items: any[];
  };
  tours: {
    total: {
      views: number;
      clicks: number;
      count: number;
      activeCount: number;
    };
    items: any[];
  };
}

interface UserProfile {
  businessName: string | null;
  verificationStatus: string | null;
}

export default function BusinessDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    try {
      // Fetch analytics and user profile in parallel
      const [analyticsResponse, profileResponse] = await Promise.all([
        fetch("/api/business/analytics"),
        fetch("/api/user/profile"),
      ]);

      // Handle analytics response
      if (!analyticsResponse.ok) {
        const analyticsError = await analyticsResponse.json();
        if (analyticsResponse.status === 403) {
          toast.error(analyticsError.error);
          router.push("/profile/edit");
          return;
        }
        throw new Error(analyticsError.error || "Failed to load analytics");
      }

      // Handle profile response
      if (!profileResponse.ok) {
        throw new Error("Failed to load profile");
      }

      const analytics = await analyticsResponse.json();
      const profile = await profileResponse.json();

      setAnalyticsData(analytics);
      setUserProfile(profile);
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast.error(error.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <BusinessDashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-aurora-green border-r-aurora-blue border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading your dashboard...</p>
          </div>
        </div>
      </BusinessDashboardLayout>
    );
  }

  if (!analyticsData || !userProfile) {
    return (
      <BusinessDashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400">Unable to load dashboard data</p>
          </div>
        </div>
      </BusinessDashboardLayout>
    );
  }

  const hasRooms = analyticsData.roomTypes.total.count > 0;
  const hasTours = analyticsData.tours.total.count > 0;
  const hasNoListings = !hasRooms && !hasTours;

  return (
    <BusinessDashboardLayout>
      <div className="min-h-screen pb-24">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Welcome back{userProfile.businessName ? `, ${userProfile.businessName}` : ""}
                </h1>
                <p className="text-gray-400 text-lg">
                  Here's what's happening with your Aurora Intel presence
                </p>
              </div>
              {userProfile.verificationStatus && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-aurora-green/20 to-aurora-blue/20 border border-aurora-green/30">
                  <svg className="w-5 h-5 text-aurora-green" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-aurora-green font-medium capitalize">
                    {userProfile.verificationStatus.replace("_", " ")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Overview Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Room Types */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-400">Total Room Types</h3>
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-white mb-1">
                {analyticsData.roomTypes.total.count}
              </p>
              <p className="text-sm text-gray-400">
                {analyticsData.roomTypes.total.activeCount} active
              </p>
            </div>

            {/* Total Tours */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-400">Total Tours</h3>
                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-white mb-1">
                {analyticsData.tours.total.count}
              </p>
              <p className="text-sm text-gray-400">
                {analyticsData.tours.total.activeCount} active
              </p>
            </div>

            {/* Total Profile Views */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-400">Total Profile Views</h3>
                <div className="p-3 bg-gradient-to-br from-aurora-green/20 to-emerald-500/20 rounded-xl">
                  <svg className="w-6 h-6 text-aurora-green" fill="currentColor" viewBox="0 0 20 20">
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

            {/* Total Booking Clicks */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-400">Total Booking Clicks</h3>
                <div className="p-3 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl">
                  <svg className="w-6 h-6 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold text-white mb-1">
                {analyticsData.overview.totalClicks.toLocaleString()}
              </p>
              <p className="text-sm text-gray-400">
                {analyticsData.overview.clickThroughRate.toFixed(1)}% CTR
              </p>
            </div>
          </div>

          {/* Empty State or Quick Actions */}
          {hasNoListings ? (
            /* Empty State - No Listings Yet */
            <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-3xl p-12 border border-white/10 text-center mb-8">
              <div className="max-w-2xl mx-auto">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-aurora-green to-aurora-blue rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  Ready to Get Started?
                </h2>
                <p className="text-gray-300 text-lg mb-8">
                  Start showcasing your accommodations and tours to aurora hunters worldwide.
                  Your listings will be discovered by travelers seeking the perfect northern lights experience.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => router.push("/business/rooms")}
                    className="bg-gradient-to-r from-aurora-green to-aurora-blue text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Your First Room Type
                  </button>
                  <button
                    onClick={() => router.push("/business/tours")}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Your First Tour
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Quick Actions Section */
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => router.push("/business/rooms")}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 hover:border-aurora-green/50 transition-all duration-300 text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">Add Room Type</h3>
                      <p className="text-gray-400 text-sm">Showcase accommodations</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push("/business/tours")}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 hover:border-aurora-blue/50 transition-all duration-300 text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">Add Tour</h3>
                      <p className="text-gray-400 text-sm">Create tour experiences</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push("/business/analytics")}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 hover:border-aurora-green/50 transition-all duration-300 text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-aurora-green/20 to-emerald-500/20 rounded-lg group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-aurora-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">View Analytics</h3>
                      <p className="text-gray-400 text-sm">Track performance</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push("/profile")}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 hover:border-purple-500/50 transition-all duration-300 text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">Edit Profile</h3>
                      <p className="text-gray-400 text-sm">Update business info</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Performance Insights (only show if has listings) */}
          {!hasNoListings && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Room Types Performance Summary */}
              {hasRooms && (
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Room Types Performance</h3>
                    <button
                      onClick={() => router.push("/business/analytics")}
                      className="text-aurora-green hover:text-aurora-blue transition-colors text-sm font-medium"
                    >
                      View Details →
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Views</span>
                      <span className="text-white font-semibold">
                        {analyticsData.roomTypes.total.views.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Booking Clicks</span>
                      <span className="text-white font-semibold">
                        {analyticsData.roomTypes.total.clicks.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Active Listings</span>
                      <span className="text-aurora-green font-semibold">
                        {analyticsData.roomTypes.total.activeCount} / {analyticsData.roomTypes.total.count}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tours Performance Summary */}
              {hasTours && (
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Tours Performance</h3>
                    <button
                      onClick={() => router.push("/business/analytics")}
                      className="text-aurora-green hover:text-aurora-blue transition-colors text-sm font-medium"
                    >
                      View Details →
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Views</span>
                      <span className="text-white font-semibold">
                        {analyticsData.tours.total.views.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Booking Clicks</span>
                      <span className="text-white font-semibold">
                        {analyticsData.tours.total.clicks.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Active Listings</span>
                      <span className="text-aurora-green font-semibold">
                        {analyticsData.tours.total.activeCount} / {analyticsData.tours.total.count}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent Activity Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Coming Soon</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                We're building a real-time activity feed to show you recent views, clicks, and user interactions with your listings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </BusinessDashboardLayout>
  );
}
