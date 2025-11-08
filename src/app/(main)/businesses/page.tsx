"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";

const BUSINESS_SERVICES = [
  { value: "accommodation", label: "Accommodation", icon: "🏨" },
  { value: "restaurant", label: "Restaurant/Café", icon: "🍽️" },
  { value: "shop", label: "Shop/Retail", icon: "🛍️" },
  { value: "tours", label: "Tour Operations", icon: "🚌" },
  { value: "photography", label: "Photography", icon: "📸" },
];

interface RoomTypePreview {
  id: string;
  name: string;
  coverImage: string | null;
  priceFrom: number | null;
  currency: string;
}

interface TourPreview {
  id: string;
  name: string;
  coverImage: string | null;
  priceFrom: number | null;
  currency: string;
}

interface Business {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  businessName: string | null;
  businessServices: string[] | null;
  businessDescription: string | null;
  businessCity: string | null;
  businessCountry: string | null;
  businessWebsite: string | null;
  verificationStatus: string | null;
  latitude: number | null;
  longitude: number | null;
  _count: {
    sightings: number;
    roomTypes: number;
    tourExperiences: number;
  };
  roomTypePreview: RoomTypePreview | null;
  tourPreview: TourPreview | null;
}

export default function BusinessesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [search, setSearch] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    fetchBusinesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServices, verifiedOnly]);

  const fetchBusinesses = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedServices.length > 0) params.append("services", selectedServices.join(","));
      if (city) params.append("city", city);
      if (verifiedOnly) params.append("verifiedOnly", "true");

      const response = await fetch(`/api/businesses?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch businesses");
      }

      setBusinesses(data.businesses);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch businesses");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchBusinesses();
  };

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-300">Loading businesses...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black pb-24 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Aurora Business Directory
          </h1>
          <p className="text-gray-400">
            Discover verified businesses offering aurora hunting services, accommodations, and tours
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 mb-8">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search businesses by name or description..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-aurora-green"
              />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City..."
                className="w-40 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-aurora-green"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-aurora-green hover:bg-aurora-green/80 text-black font-semibold rounded-lg transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Service Filters */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Filter by Service</h3>
            <div className="flex flex-wrap gap-2">
              {BUSINESS_SERVICES.map((service) => (
                <button
                  key={service.value}
                  onClick={() => toggleService(service.value)}
                  className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                    selectedServices.includes(service.value)
                      ? "border-aurora-green bg-aurora-green/10 text-white"
                      : "border-white/20 text-gray-300 hover:border-white/40"
                  }`}
                >
                  <span className="mr-2">{service.icon}</span>
                  {service.label}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Filters */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-aurora-green focus:ring-aurora-green focus:ring-offset-0"
              />
              <span className="text-sm text-gray-300">Verified businesses only</span>
            </label>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-aurora-green text-black"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
                title="Grid view"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-aurora-green text-black"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
                title="List view"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-400">
            {businesses.length} {businesses.length === 1 ? "business" : "businesses"} found
          </p>
        </div>

        {/* Business Listings */}
        {businesses.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-lg">
            <p className="text-gray-400">No businesses found matching your criteria</p>
          </div>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {businesses.map((business) => (
              <div
                key={business.id}
                onClick={() => router.push(`/profile/${business.username || business.id}`)}
                className={`bg-white/5 backdrop-blur-sm rounded-lg overflow-hidden hover:bg-white/10 transition-all cursor-pointer ${
                  viewMode === "list" ? "flex gap-4" : ""
                }`}
              >
                {/* Business Image/Preview */}
                <div className={`relative ${viewMode === "grid" ? "h-48" : "w-48 flex-shrink-0"}`}>
                  {business.roomTypePreview?.coverImage ? (
                    <Image
                      src={business.roomTypePreview.coverImage}
                      alt={business.businessName || "Business"}
                      fill
                      className="object-cover"
                    />
                  ) : business.tourPreview?.coverImage ? (
                    <Image
                      src={business.tourPreview.coverImage}
                      alt={business.businessName || "Business"}
                      fill
                      className="object-cover"
                    />
                  ) : business.image ? (
                    <Image
                      src={business.image}
                      alt={business.businessName || "Business"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-aurora-blue to-aurora-green flex items-center justify-center">
                      <span className="text-4xl">
                        {business.businessServices?.includes("accommodation")
                          ? "🏨"
                          : business.businessServices?.includes("tours")
                            ? "🚌"
                            : business.businessServices?.includes("photography")
                              ? "📸"
                              : "🏢"}
                      </span>
                    </div>
                  )}
                  {business.verificationStatus === "verified" && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-blue-500/90 backdrop-blur-sm rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-xs text-white font-medium">Verified</span>
                    </div>
                  )}
                </div>

                {/* Business Info */}
                <div className="p-4 flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {business.businessName || business.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-3">
                    {business.businessCity}, {business.businessCountry}
                  </p>

                  {business.businessDescription && (
                    <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                      {business.businessDescription}
                    </p>
                  )}

                  {/* Services */}
                  {business.businessServices && business.businessServices.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {business.businessServices.slice(0, 3).map((service) => {
                        const serviceInfo = BUSINESS_SERVICES.find((s) => s.value === service);
                        return (
                          <span
                            key={service}
                            className="px-2 py-1 bg-white/10 rounded text-xs text-gray-300"
                          >
                            {serviceInfo?.icon} {serviceInfo?.label || service}
                          </span>
                        );
                      })}
                      {business.businessServices.length > 3 && (
                        <span className="px-2 py-1 bg-white/10 rounded text-xs text-gray-400">
                          +{business.businessServices.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    {business._count.sightings > 0 && (
                      <span>{business._count.sightings} sightings</span>
                    )}
                    {business._count.roomTypes > 0 && (
                      <span>{business._count.roomTypes} room types</span>
                    )}
                    {business._count.tourExperiences > 0 && (
                      <span>{business._count.tourExperiences} tours</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
