"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LocationAutocomplete from "@/components/forms/LocationAutocomplete";
import TimezoneSelect from "@/components/forms/TimezoneSelect";

export default function CreateHuntPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    additionalInfoUrl: "",
    whatsappNumber: "",
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
    cancellationPolicy: "",
  });
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setFormData({ ...formData, coverImage: file });
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = new FormData();

    // Append all form fields
    submitData.append("name", formData.name);
    submitData.append("description", formData.description);
    if (formData.additionalInfoUrl) {
      submitData.append("additionalInfoUrl", formData.additionalInfoUrl);
    }
    if (formData.whatsappNumber) {
      submitData.append("whatsappNumber", formData.whatsappNumber);
    }
    submitData.append("startDate", formData.startDate);
    submitData.append("endDate", formData.endDate);
    submitData.append("timezone", formData.timezone);
    submitData.append("location", formData.location);
    submitData.append("latitude", formData.latitude);
    submitData.append("longitude", formData.longitude);
    submitData.append("hideLocation", formData.hideLocation.toString());
    submitData.append("isPublic", formData.isPublic.toString());
    submitData.append("hideFromPublic", formData.hideFromPublic.toString());
    submitData.append("isPaid", formData.isPaid.toString());

    if (formData.isPaid && formData.price) {
      submitData.append("price", formData.price);
    }

    if (formData.isPaid && formData.cancellationPolicy) {
      submitData.append("cancellationPolicy", formData.cancellationPolicy);
    }

    if (formData.capacity) {
      submitData.append("capacity", formData.capacity);
    }

    submitData.append("allowWaitlist", formData.allowWaitlist.toString());

    // Append cover image if present
    if (formData.coverImage) {
      submitData.append("coverImage", formData.coverImage);
    }

    try {
      const response = await fetch("/api/hunts/create", {
        method: "POST",
        body: submitData,
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/hunts");
      } else {
        console.error("Error creating hunt:", data);
        alert(`Failed to create hunt: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error creating hunt:", error);
      alert("Failed to create hunt. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e17] p-4">
      <div className="max-w-screen-lg mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push("/hunts")}
            className="text-aurora-blue"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Create Hunt</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Cover Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">Cover Image (Landscape)</label>
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
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
            ) : (
              <label
                className={`block border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-aurora-green bg-aurora-green/10"
                    : "border-gray-600 hover:border-aurora-green"
                }`}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
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
                  className={`w-12 h-12 mx-auto mb-4 ${isDragging ? "text-aurora-green" : "text-gray-400"}`}
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
                <p className={isDragging ? "text-aurora-green" : "text-gray-300"}>
                  {isDragging ? "Drop image here" : "Drag & drop or click to upload"}
                </p>
                <p className="text-sm text-gray-500 mt-1">Recommended: Landscape image (16:9 ratio)</p>
              </label>
            )}
          </div>

          {/* 2. Hunt Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Hunt Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-white/10 rounded-lg px-4 py-3 text-white"
              placeholder="e.g., Northern Lights Adventure 2025"
            />
          </div>

          {/* 3. Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-white/10 rounded-lg px-4 py-3 text-white h-24"
              placeholder="Describe your hunt..."
            />
          </div>

          {/* 4. Meeting Point (with auto-populated timezone) */}
          <div>
            <label className="block text-sm font-medium mb-2">Meeting Point</label>
            <LocationAutocomplete
              value={formData.location}
              onChange={async (loc, lat, lng) => {
                // Get IANA timezone from coordinates via API
                let timezone = "UTC";
                if (lat && lng) {
                  try {
                    const response = await fetch(`/api/timezone?lat=${lat}&lng=${lng}`);
                    const data = await response.json();
                    timezone = data.timezone || "UTC";
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
              className="w-full bg-white/10 rounded-lg px-4 py-3 text-white mb-2"
              required={true}
            />

            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="bg-white/10 rounded-lg px-4 py-2 text-white text-sm"
                placeholder="Latitude"
                readOnly
              />
              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="bg-white/10 rounded-lg px-4 py-2 text-white text-sm"
                placeholder="Longitude"
                readOnly
              />
            </div>

            {/* 5. Timezone */}
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">
                🌍 Timezone {formData.timezone && formData.timezone !== "UTC" && <span className="text-aurora-green text-xs ml-1">✓ Auto-detected</span>}
              </label>
              <TimezoneSelect
                value={formData.timezone}
                onChange={(tz) => setFormData({ ...formData, timezone: tz })}
                className="w-full bg-white/10 rounded-lg px-4 py-3 text-white border border-gray-600 hover:border-gray-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Timezone will be auto-detected from location, but you can manually adjust it here
              </p>
            </div>
          </div>

          {/* 6. Event Date & Time */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Event Date & Time
            </label>
            <p className="text-xs text-gray-400 mb-3">
              Enter the event time in the meeting point's local timezone (set above)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="datetime-local"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full bg-white/10 rounded-lg px-4 py-3 text-white"
                  placeholder="Start"
                />
                <p className="text-xs text-gray-400 mt-1">Start</p>
              </div>
              <div>
                <input
                  type="datetime-local"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full bg-white/10 rounded-lg px-4 py-3 text-white"
                  placeholder="End"
                />
                <p className="text-xs text-gray-400 mt-1">End</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 bg-white/5 p-4 rounded-lg">
            <div className="flex items-center gap-2">
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
                className="w-4 h-4"
              />
              <label htmlFor="isPrivate" className="text-sm">
                Private (by invitations only)
              </label>
            </div>

            {formData.isPrivate && (
              <div className="flex items-center gap-2 ml-6 border-l-2 border-aurora-green/30 pl-4">
                <input
                  type="checkbox"
                  id="hideFromPublic"
                  checked={formData.hideFromPublic}
                  onChange={(e) => setFormData({ ...formData, hideFromPublic: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="hideFromPublic" className="text-sm text-gray-300">
                  Hide from Public (only people with link can see)
                </label>
              </div>
            )}

            <div className="flex items-center gap-2">
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
                className="w-4 h-4"
              />
              <label htmlFor="isPublic" className="text-sm">
                Public (allow anyone to join)
              </label>
            </div>

            <div className="flex items-center gap-2">
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
                className="w-4 h-4"
              />
              <label htmlFor="isPaid" className="text-sm">
                Paid event
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hideLocation"
                checked={formData.hideLocation}
                onChange={(e) => setFormData({ ...formData, hideLocation: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="hideLocation" className="text-sm">
                Hide exact location (only show on map to participants)
              </label>
            </div>
          </div>

          {formData.isPaid && (
            <>
              {/* Disclaimer */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-xs text-amber-200">
                  <strong>⚠️ Disclaimer:</strong> Aurora Addict is not liable for any transactions between hunt organizers and participants. All payments, refunds, and disputes are handled directly between parties. By creating a paid hunt, you agree to handle all financial matters independently.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Price per pax ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-white/10 rounded-lg px-4 py-3 text-white"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Cancellation Policy</label>
                <textarea
                  value={formData.cancellationPolicy}
                  onChange={(e) => setFormData({ ...formData, cancellationPolicy: e.target.value })}
                  className="w-full bg-white/10 rounded-lg px-4 py-3 text-white h-32"
                  placeholder="Describe your cancellation and refund policy for paid participants..."
                />
                <p className="text-xs text-gray-400 mt-1">
                  This policy will be shown to participants when they leave the hunt
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Capacity (optional)</label>
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
              className="w-full bg-white/10 rounded-lg px-4 py-3 text-white"
              placeholder="Maximum participants"
            />
          </div>

          {formData.capacity && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="allowWaitlist"
                checked={formData.allowWaitlist}
                onChange={(e) => setFormData({ ...formData, allowWaitlist: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="allowWaitlist" className="text-sm">
                Allow Waitlist (rejected requests will be added to waitlist)
              </label>
            </div>
          )}

          {/* 8. Additional Info URL and WhatsApp Number */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Additional Info URL (Optional)
            </label>
            <input
              type="url"
              value={formData.additionalInfoUrl}
              onChange={(e) => setFormData({ ...formData, additionalInfoUrl: e.target.value })}
              className="w-full bg-white/10 rounded-lg px-4 py-3 text-white"
              placeholder="https://example.com/hunt-details"
            />
            <p className="text-xs text-gray-400 mt-1">
              Add a link to more details about your hunt (e.g., website, Google Form)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              WhatsApp Number (Optional)
            </label>
            <input
              type="tel"
              value={formData.whatsappNumber}
              onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
              className="w-full bg-white/10 rounded-lg px-4 py-3 text-white"
              placeholder="6512345678"
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter with country code (no spaces, dashes, or + sign). Example: 6512345678 for Singapore
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-aurora-green to-aurora-blue text-black font-semibold py-4 px-6 rounded-lg hover:opacity-90 transition-opacity"
          >
            Create Hunt
          </button>
        </form>
      </div>
    </div>
  );
}
