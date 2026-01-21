'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import BusinessDashboardLayout from '@/components/BusinessDashboardLayout';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type Period = '7d' | '30d' | '90d' | 'all';
type ServiceType = 'accommodation' | 'tours' | null;

export default function AnalyticsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [period, setPeriod] = useState<Period>('30d');
  const [serviceType, setServiceType] = useState<ServiceType>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      fetchAnalytics();
    }
  }, [status, router, period, serviceType]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        period,
        ...(serviceType && { serviceType }),
      });

      const response = await fetch(`/api/business/analytics?${params}`);

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 403) {
          toast.error(error.error);
          router.push('/profile/edit');
          return;
        }
        throw new Error(error.error || 'Failed to load analytics');
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast.error(error.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <BusinessDashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-aurora-green border-r-aurora-blue border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading analytics...</p>
          </div>
        </div>
      </BusinessDashboardLayout>
    );
  }

  if (!analyticsData) {
    return (
      <BusinessDashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400">Unable to load analytics data</p>
          </div>
        </div>
      </BusinessDashboardLayout>
    );
  }

  const hasAffiliate = analyticsData.affiliatePerformance;
  const platformColors: Record<string, string> = {
    booking: '#003580',
    agoda: '#D7211E',
    getyourguide: '#FF6F00',
    viator: '#00A680',
    tripadvisor: '#00AF87',
    direct: '#10b981'
  };

  return (
    <BusinessDashboardLayout>
      <div className="min-h-screen pb-24">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.push('/business/dashboard')}
                className="text-gray-400 hover:text-white flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Affiliate Performance Analytics</h1>
            <p className="text-gray-400 text-lg">
              Track conversions, commissions, and optimize your affiliate revenue
            </p>
          </div>

          {/* Filters */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2">
              {(['7d', '30d', '90d', 'all'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    period === p
                      ? 'bg-aurora-green text-black'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {p === 'all' ? 'All Time' : p.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setServiceType(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  serviceType === null
                    ? 'bg-aurora-blue text-black'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                All Services
              </button>
              <button
                onClick={() => setServiceType('accommodation')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  serviceType === 'accommodation'
                    ? 'bg-aurora-blue text-black'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                Accommodation
              </button>
              <button
                onClick={() => setServiceType('tours')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  serviceType === 'tours'
                    ? 'bg-aurora-blue text-black'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                Tours
              </button>
            </div>
          </div>

          {/* Affiliate Performance Metrics */}
          {hasAffiliate && (
            <>
              {/* Period Metrics */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">Performance - {period === 'all' ? 'All Time' : period.toUpperCase()}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Total Clicks */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-400">Affiliate Clicks</h3>
                      <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl">
                        <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-4xl font-bold text-white mb-1">
                      {analyticsData.affiliatePerformance.period.totalClicks.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400">
                      Lifetime: {analyticsData.affiliatePerformance.lifetime.totalClicks.toLocaleString()}
                    </p>
                  </div>

                  {/* Conversions */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-400">Conversions</h3>
                      <div className="p-3 bg-gradient-to-br from-aurora-green/20 to-emerald-500/20 rounded-xl">
                        <svg className="w-6 h-6 text-aurora-green" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-4xl font-bold text-white mb-1">
                      {analyticsData.affiliatePerformance.period.totalConversions.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400">
                      {analyticsData.affiliatePerformance.period.conversionRate.toFixed(1)}% conversion rate
                    </p>
                  </div>

                  {/* Total Revenue */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-400">Total Revenue</h3>
                      <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
                        <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-4xl font-bold text-white mb-1">
                      €{analyticsData.affiliatePerformance.period.totalRevenue.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400">
                      Avg: €{analyticsData.affiliatePerformance.period.averageOrderValue.toFixed(0)}
                    </p>
                  </div>

                  {/* Commission Earned */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 ring-2 ring-aurora-green/20">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-400">Commission Earned</h3>
                      <div className="p-3 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl">
                        <svg className="w-6 h-6 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-4xl font-bold text-aurora-green mb-1">
                      €{analyticsData.affiliatePerformance.period.totalCommission.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400">
                      Lifetime: €{analyticsData.affiliatePerformance.lifetime.totalCommission.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Platform Breakdown */}
                {analyticsData.platformBreakdown && analyticsData.platformBreakdown.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">Platform Performance</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analyticsData.platformBreakdown}
                          dataKey="commission"
                          nameKey="platform"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={(entry: any) => `${entry.platform}: €${entry.commission.toFixed(0)}`}
                        >
                          {analyticsData.platformBreakdown.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={platformColors[entry.platform] || '#6366f1'} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `€${value.toFixed(2)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      {analyticsData.platformBreakdown.map((platform: any) => (
                        <div key={platform.platform} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: platformColors[platform.platform] }}></div>
                            <span className="text-gray-300 capitalize">{platform.platform}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-400">{platform.clicks} clicks</span>
                            <span className="text-white font-medium">€{platform.commission.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Revenue Forecast */}
                {analyticsData.forecast && (
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-4">Revenue Forecast</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-400">Next 7 Days</p>
                          <p className="text-2xl font-bold text-white">€{analyticsData.forecast.next7Days.toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg">
                          <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-400">Next 30 Days</p>
                          <p className="text-2xl font-bold text-white">€{analyticsData.forecast.next30Days.toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-gradient-to-br from-aurora-green/20 to-emerald-500/20 rounded-lg">
                          <svg className="w-6 h-6 text-aurora-green" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-400">Next 90 Days</p>
                          <p className="text-2xl font-bold text-white">€{analyticsData.forecast.next90Days.toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                          <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>

                      <div className="p-4 bg-aurora-green/10 border border-aurora-green/20 rounded-lg">
                        <p className="text-sm text-gray-400 mb-1">Daily Average</p>
                        <p className="text-lg font-bold text-aurora-green">€{analyticsData.forecast.dailyAverage.toFixed(2)}/day</p>
                        <p className="text-xs text-gray-500 mt-1">Based on last 30 days</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Time Series Chart */}
              {analyticsData.timeSeries && analyticsData.timeSeries.length > 0 && (
                <div className="mb-8 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">Performance Trends</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                        labelStyle={{ color: '#F3F4F6' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="clicks" stroke="#3B82F6" strokeWidth={2} name="Clicks" />
                      <Line type="monotone" dataKey="conversions" stroke="#10B981" strokeWidth={2} name="Conversions" />
                      <Line type="monotone" dataKey="commission" stroke="#F59E0B" strokeWidth={2} name="Commission (€)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Top Performers */}
              {(analyticsData.topPerformingRooms?.length > 0 || analyticsData.topPerformingTours?.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Top Rooms */}
                  {analyticsData.topPerformingRooms?.length > 0 && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-4">Top Performing Rooms</h3>
                      <div className="space-y-3">
                        {analyticsData.topPerformingRooms.map((room: any, index: number) => (
                          <div key={room.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-aurora-green flex items-center justify-center text-black font-bold">
                              #{index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-medium">{room.name}</p>
                              <p className="text-sm text-gray-400">{room.clicks} clicks</p>
                            </div>
                            <div className="text-right">
                              <p className="text-aurora-green font-bold">€{room.commission.toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Tours */}
                  {analyticsData.topPerformingTours?.length > 0 && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-4">Top Performing Tours</h3>
                      <div className="space-y-3">
                        {analyticsData.topPerformingTours.map((tour: any, index: number) => (
                          <div key={tour.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-aurora-blue flex items-center justify-center text-black font-bold">
                              #{index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-medium">{tour.name}</p>
                              <p className="text-sm text-gray-400">{tour.clicks} clicks</p>
                            </div>
                            <div className="text-right">
                              <p className="text-aurora-green font-bold">€{tour.commission.toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Recent Conversions */}
              {analyticsData.recentConversions && analyticsData.recentConversions.length > 0 && (
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">Recent Conversions</h3>
                  <div className="space-y-3">
                    {analyticsData.recentConversions.map((conversion: any) => (
                      <div key={conversion.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-lg" style={{ backgroundColor: `${platformColors[conversion.platform]}20` }}>
                            <svg className="w-5 h-5" style={{ color: platformColors[conversion.platform] }} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-white font-medium capitalize">{conversion.platform}</p>
                            <p className="text-sm text-gray-400">
                              {conversion.conversionDate ? new Date(conversion.conversionDate).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">€{conversion.conversionValue?.toFixed(2) || '0.00'}</p>
                          <p className="text-sm text-aurora-green">+€{conversion.estimatedCommission?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!hasAffiliate && (
            <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-3xl p-12 border border-white/10 text-center">
              <div className="max-w-2xl mx-auto">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-aurora-green to-aurora-blue rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  Start Earning Affiliate Commissions
                </h2>
                <p className="text-gray-300 text-lg mb-8">
                  Add room types and tours with booking links to start tracking conversions and earning affiliate commissions.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => router.push('/business/room-types')}
                    className="bg-gradient-to-r from-aurora-green to-aurora-blue text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                  >
                    Add Room Types
                  </button>
                  <button
                    onClick={() => router.push('/business/tours')}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                  >
                    Add Tours
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </BusinessDashboardLayout>
  );
}
