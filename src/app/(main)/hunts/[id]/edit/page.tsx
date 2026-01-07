"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import LocationAutocomplete from "@/components/forms/LocationAutocomplete";
import toast from "react-hot-toast";

export default function EditHuntPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { id: huntId } = use(params);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    coverImage: null as File | null,
    startDate: "",
    endDate: "",
    timezone: "UTC",
    location: "",
    latitude: "",
    longitude: "",
    hideLocation: false,
    isPrivate: false,
    isPublic: true,
    hideFromPublic: false,
    isPaid: false,
    price: "",
    capacity: "",
    allowWaitlist: false,
  });
  const [existingCoverImage, setExistingCoverImage] = useState<string | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchHuntData();
    }
  }, [status]);

  const fetchHuntData = async () => {
    if (!huntId) return;

    try {
      const response = await fetch(`/api/hunts/${huntId}`);
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to load hunt");
        router.push("/");
        return;
      }

      // Check if user is the creator
      if (!data.isCreator) {
        alert("Only the creator can edit this hunt");
        router.push(`/hunts/${huntId}`);
        return;
      }

      // Check if hunt has ended (past hunt)
      const now = new Date();
      const endDate = new Date(data.endDate);
      if (now > endDate) {
        alert("Past hunts cannot be edited");
        router.push(`/hunts/${huntId}`);
        return;
      }

      // Format dates for datetime-local input
      const formatDateForInput = (dateString: string) => {
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
      };

      setFormData({
        name: data.name,
        description: data.description || "",
        coverImage: null,
        startDate: formatDateForInput(data.startDate),
        endDate: formatDateForInput(data.endDate),
        timezone: data.timezone || "UTC",
        location: data.location || "",
        latitude: data.latitude?.toString() || "",
        longitude: data.longitude?.toString() || "",
        hideLocation: data.hideLocation,
        isPrivate: !data.isPublic,
        isPublic: data.isPublic,
        hideFromPublic: data.hideFromPublic || false,
        isPaid: data.isPaid,
        price: data.price?.toString() || "",
        capacity: data.capacity?.toString() || "",
        allowWaitlist: data.allowWaitlist || false,
      });

      if (data.coverImage) {
        setExistingCoverImage(data.coverImage);
        setCoverImagePreview(data.coverImage);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching hunt:", error);
      alert("Failed to load hunt");
      router.push("/");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!huntId) return;

    setSaving(true);

    try {
      const submitData = new FormData();

      // Append all form fields
      submitData.append("name", formData.name);
      submitData.append("description", formData.description);
      submitData.append("startDate", formData.startDate);
      submitData.append("endDate", formData.endDate);
      submitData.append("timezone", formData.timezone);
      submitData.append("location", formData.location);
      submitData.append("latitude", formData.latitude);
      submitData.append("longitude", formData.longitude);
      submitData.append("hideLocation", formData.hideLocation.toString());
      submitData.append("isPrivate", formData.isPrivate.toString());
      submitData.append("isPublic", formData.isPublic.toString());
      submitData.append("hideFromPublic", formData.hideFromPublic.toString());
      submitData.append("isPaid", formData.isPaid.toString());

      if (formData.isPaid && formData.price) {
        submitData.append("price", formData.price);
      }

      if (formData.capacity) {
        submitData.append("capacity", formData.capacity);
      }

      submitData.append("allowWaitlist", formData.allowWaitlist.toString());

      // Append cover image if a new one was selected
      if (formData.coverImage) {
        submitData.append("coverImage", formData.coverImage);
      }

      const response = await fetch(`/api/hunts/${huntId}`, {
        method: "PATCH",
        body: submitData,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Hunt updated successfully!");
        router.push(`/hunts/${huntId}`);
      } else {
        toast.error(data.error || "Failed to update hunt");
      }
    } catch (error) {
      console.error("Error updating hunt:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black pb-24">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/hunts")}
            className="text-gray-400 hover:text-white mb-4 flex items-center gap-2"
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
            Back to Hunt
          </button>

          <h1 className="text-3xl font-bold text-white">Edit Hunt</h1>
          <p className="text-gray-400 mt-2">
            Update your hunt details
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white font-medium mb-2">
              Hunt Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full bg-white/5 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-aurora-blue"
              placeholder="e.g., Northern Lights Adventure 2025"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full bg-white/5 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-aurora-blue resize-none"
              rows={4}
              placeholder="Describe your hunt..."
            />
          </div>

          {/* Cover Image Upload */}
          <div>
            <label className="block text-white font-medium mb-2">Cover Image (Landscape)</label>
            <p className="text-xs text-gray-400 mb-3">
              Upload a landscape cover image for your hunt event (16:9 ratio recommended)
            </p>
            {coverImagePreview ? (
              <div className="relative w-80 h-45 mx-auto">
                <img
                  src={coverImagePreview}
                  alt="Cover preview"
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCoverImagePreview(null);
                    setFormData({ ...formData, coverImage: null });
                    setExistingCoverImage(null);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
            ) : (
              <label className="block border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-aurora-green transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData({ ...formData, coverImage: file });
                      setCoverImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  className="hidden"
                />
                <svg
                  className="w-12 h-12 mx-auto mb-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-gray-300">Click to upload cover image</p>
                <p className="text-sm text-gray-500 mt-1">Recommended: Square image (1:1 ratio)</p>
              </label>
            )}
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              Event Date & Time *
              {formData.timezone && formData.timezone !== "UTC" && (
                <span className="text-aurora-green text-xs ml-2">({formData.timezone})</span>
              )}
            </label>
            <p className="text-xs text-gray-400 mb-3">
              Enter the event time in the meeting point's local timezone
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="datetime-local"
                  required
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full bg-white/5 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-aurora-blue"
                />
                <p className="text-xs text-gray-400 mt-1">Start</p>
              </div>
              <div>
                <input
                  type="datetime-local"
                  required
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="w-full bg-white/5 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-aurora-blue"
                />
                <p className="text-xs text-gray-400 mt-1">End</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              Meeting Point *
            </label>
            <LocationAutocomplete
              value={formData.location}
              onChange={async (loc, lat, lng) => {
                // Get IANA timezone from coordinates via API
                let timezone = formData.timezone || "UTC";
                if (lat && lng) {
                  try {
                    const response = await fetch(`/api/timezone?lat=${lat}&lng=${lng}`);
                    const data = await response.json();
                    timezone = data.timezone || formData.timezone || "UTC";
                  } catch (error) {
                    console.error("Error fetching timezone:", error);
                  }
                }

                setFormData({
                  ...formData,
                  location: loc,
                  latitude: lat || formData.latitude,
                  longitude: lng || formData.longitude,
                  timezone: timezone,
                });
              }}
              placeholder="Search for a meeting point..."
              className="w-full bg-white/5 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-aurora-blue mb-2"
              required={true}
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) =>
                  setFormData({ ...formData, latitude: e.target.value })
                }
                className="bg-white/5 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-aurora-blue"
                placeholder="Latitude"
                readOnly
              />
              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) =>
                  setFormData({ ...formData, longitude: e.target.value })
                }
                className="bg-white/5 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-aurora-blue"
                placeholder="Longitude"
                readOnly
              />
            </div>

            {/* Display detected timezone */}
            {formData.timezone && formData.timezone !== "UTC" && (
              <p className="text-xs text-aurora-green mt-2">
                📍 Timezone: {formData.timezone}
              </p>
            )}
          </div>

          <div className="space-y-3 bg-white/5 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPrivate"
                checked={formData.isPrivate}
                onChange={(e) => {
                  const isPrivate = e.target.checked;
                  setFormData({
                    ...formData,
                    isPrivate,
                    isPublic: !isPrivate,
                    // Reset hideFromPublic when unchecking Private
                    hideFromPublic: isPrivate ? formData.hideFromPublic : false,
                  });
                }}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="isPrivate" className="text-white text-sm">
                Private (by invitations only)
              </label>
            </div>

            {formData.isPrivate && (
              <div className="flex items-center gap-3 ml-6 border-l-2 border-aurora-green/30 pl-4">
                <input
                  type="checkbox"
                  id="hideFromPublic"
                  checked={formData.hideFromPublic}
                  onChange={(e) => setFormData({ ...formData, hideFromPublic: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="hideFromPublic" className="text-gray-300 text-sm">
                  Hide from Public (only people with link can see)
                </label>
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => {
                  const isPublic = e.target.checked;
                  setFormData({
                    ...formData,
                    isPublic,
                    isPrivate: !isPublic,
                    // Reset hideFromPublic when selecting Public
                    hideFromPublic: false,
                  });
                }}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="isPublic" className="text-white text-sm">
                Public (allow anyone to join)
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPaid"
                checked={formData.isPaid}
                onChange={(e) => {
                  const isPaid = e.target.checked;
                  setFormData({
                    ...formData,
                    isPaid,
                  });
                }}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="isPaid" className="text-white text-sm">
                Paid event
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hideLocation"
                checked={formData.hideLocation}
                onChange={(e) =>
                  setFormData({ ...formData, hideLocation: e.target.checked })
                }
                className="w-4 h-4 rounded"
              />
              <label htmlFor="hideLocation" className="text-white text-sm">
                Hide exact location (only show on map to participants)
              </label>
            </div>
          </div>

          {formData.isPaid && (
            <div>
              <label className="block text-white font-medium mb-2">
                Price per pax ($) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="w-full bg-white/5 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-aurora-blue"
                placeholder="0.00"
              />
            </div>
          )}

          <div>
            <label className="block text-white font-medium mb-2">
              Capacity (Optional)
            </label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => {
                const capacity = e.target.value;
                setFormData({
                  ...formData,
                  capacity,
                  // Reset allowWaitlist if capacity is removed
                  allowWaitlist: capacity ? formData.allowWaitlist : false
                });
              }}
              className="w-full bg-white/5 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-aurora-blue"
              placeholder="Maximum participants"
            />
          </div>

          {formData.capacity && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allowWaitlist"
                checked={formData.allowWaitlist}
                onChange={(e) => setFormData({ ...formData, allowWaitlist: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="allowWaitlist" className="text-white text-sm">
                Allow Waitlist (rejected requests will be added to waitlist)
              </label>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => huntId && router.push(`/hunts/${huntId}`)}
              className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-green-400 to-blue-500 text-white py-3 rounded-lg font-medium hover:from-green-500 hover:to-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
