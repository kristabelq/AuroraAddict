"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useDropzone } from "react-dropzone";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { extractPhotoMetadata, reverseGeocode, formatCaptureDate, getDateString, getTimeString } from "@/utils/exif";
import { isPhotoOutsideHuntDates, formatValidationWindow } from "@/utils/huntValidation";
import LocationAutocomplete from "@/components/forms/LocationAutocomplete";
import TimezoneSelect from "@/components/forms/TimezoneSelect";

interface ImagePreview {
  file: File;
  preview: string;
  latitude?: number;
  longitude?: number;
  captureDate?: Date;
  timezone?: string; // IANA timezone extracted from GPS
  caption?: string; // Per-photo caption
  manualLatitude?: string;
  manualLongitude?: string;
  manualDate?: string;
  manualTime?: string;
  manualTimezone?: string;
  locationSearchValue?: string;
}

interface HuntDetails {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  timezone: string;
}

export default function NewSightingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const huntId = searchParams.get("huntId");
  const { data: session, status } = useSession();
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [sightingType, setSightingType] = useState<"realtime" | "past">("realtime");
  const [sightingDate, setSightingDate] = useState("");
  const [sightingTime, setSightingTime] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [loading, setLoading] = useState(false);
  const [extractingGPS, setExtractingGPS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [huntDetails, setHuntDetails] = useState<HuntDetails | null>(null);
  const [loadingHunt, setLoadingHunt] = useState(false);

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  // Detect if mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
  }, []);

  // Fetch hunt details if huntId is present
  useEffect(() => {
    if (huntId) {
      fetchHuntDetails();
    }
  }, [huntId]);

  const fetchHuntDetails = async () => {
    if (!huntId) return;

    setLoadingHunt(true);
    try {
      const response = await fetch(`/api/hunts/${huntId}`);
      const data = await response.json();

      if (response.ok) {
        setHuntDetails({
          id: data.id,
          name: data.name,
          startDate: data.startDate,
          endDate: data.endDate,
          timezone: data.timezone,
        });
        // Set timezone to hunt's timezone
        setTimezone(data.timezone);
      } else {
        toast.error("Failed to load hunt details");
      }
    } catch (error) {
      console.error("Error fetching hunt details:", error);
      toast.error("Failed to load hunt details");
    } finally {
      setLoadingHunt(false);
    }
  };

  // Generate array of dates between hunt start and end dates
  const getHuntDates = (): string[] => {
    if (!huntDetails) return [];

    const start = new Date(huntDetails.startDate);
    const end = new Date(huntDetails.endDate);
    const dates: string[] = [];

    // Generate dates from start to end
    const currentDate = new Date(start);
    while (currentDate <= end) {
      // Format as YYYY-MM-DD for the date input value
      const dateStr = currentDate.toISOString().split('T')[0];
      dates.push(dateStr);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  };

  // Format date for display in dropdown
  const formatDateForDisplay = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00'); // Add time to prevent timezone issues
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setExtractingGPS(true);

    const newImages: ImagePreview[] = [];

    for (const file of acceptedFiles) {
      const preview = URL.createObjectURL(file);

      // Extract comprehensive metadata using utility function
      const metadata = await extractPhotoMetadata(file, true);

      // Reverse geocode to get location name for this specific photo
      let locationSearchValue = "";
      if (metadata.latitude && metadata.longitude) {
        locationSearchValue = await reverseGeocode(metadata.latitude, metadata.longitude);
      }

      // Use the first image's coordinates if we don't have location yet
      if (!latitude && !longitude && metadata.latitude && metadata.longitude) {
        setLatitude(metadata.latitude);
        setLongitude(metadata.longitude);
        setLocation(locationSearchValue);

        // Set timezone from first image if available
        if (metadata.timezone && !huntId) {
          setTimezone(metadata.timezone);
        }
      }

      newImages.push({
        file,
        preview,
        latitude: metadata.latitude,
        longitude: metadata.longitude,
        captureDate: metadata.captureDate,
        timezone: metadata.timezone,
        caption: "", // Initialize with empty caption
        locationSearchValue: locationSearchValue, // Auto-populate location field
      });
    }

    setImages((prev) => [...prev, ...newImages]);
    setExtractingGPS(false);
  }, [latitude, longitude, huntId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: sightingType === "past" ? 10 : 5,
  });

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const updateImageData = (index: number, field: keyof ImagePreview, value: any) => {
    setImages((prev) => {
      const newImages = [...prev];
      newImages[index] = { ...newImages[index], [field]: value };
      return newImages;
    });
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
          setLocation(
            `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
          );
          toast.success("Location detected!");
        },
        (error) => {
          toast.error("Could not get your location. Please enter manually.");
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (images.length === 0) {
      toast.error("Please add at least one image");
      return;
    }

    setLoading(true);

    try {
      // Create individual posts for each image
      const promises = images.map(async (img) => {
        const formData = new FormData();
        formData.append("images", img.file);

        // Use per-photo caption, fallback to global caption
        formData.append("caption", img.caption || caption);
        formData.append("sightingType", sightingType);

        // Priority: manual input > extracted metadata > global fallback
        let imgLat: number | undefined;
        let imgLng: number | undefined;

        if (img.manualLatitude && img.manualLongitude) {
          imgLat = parseFloat(img.manualLatitude);
          imgLng = parseFloat(img.manualLongitude);
        } else if (img.latitude && img.longitude) {
          imgLat = img.latitude;
          imgLng = img.longitude;
        } else if (latitude && longitude) {
          imgLat = latitude;
          imgLng = longitude;
        }

        if (imgLat && imgLng) {
          formData.append("latitude", imgLat.toString());
          formData.append("longitude", imgLng.toString());

          // Use location search value or reverse geocode
          let locationName = img.locationSearchValue || location;
          if (!locationName || locationName.match(/^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/)) {
            // If no readable location name, reverse geocode
            locationName = await reverseGeocode(imgLat, imgLng);
          }
          formData.append("location", locationName);
        }

        // Include huntId if present (for hunt-specific sightings)
        if (huntId) {
          formData.append("huntId", huntId);
        }

        // Date, time, and timezone - Priority: manual input > extracted metadata > global fallback
        let finalDate: string | undefined;
        let finalTime: string | undefined;
        let finalTimezone: string | undefined;

        if (sightingType === "past") {
          // Priority 1: Manual input
          if (img.manualDate || img.manualTime) {
            finalDate = img.manualDate || (img.captureDate ? getDateString(img.captureDate) : sightingDate);
            finalTime = img.manualTime || (img.captureDate ? getTimeString(img.captureDate) : sightingTime);
            finalTimezone = img.manualTimezone || img.timezone || timezone;
          }
          // Priority 2: Extracted from EXIF
          else if (img.captureDate) {
            finalDate = getDateString(img.captureDate);
            finalTime = getTimeString(img.captureDate);
            finalTimezone = img.timezone || timezone;
          }
          // Priority 3: Global fallback
          else if (sightingDate) {
            finalDate = sightingDate;
            finalTime = sightingTime;
            finalTimezone = timezone;
          }
        } else {
          // Real-time: use global date/time if provided
          if (sightingDate) {
            finalDate = sightingDate;
            finalTime = sightingTime;
            finalTimezone = timezone;
          }
        }

        if (finalDate) {
          formData.append("sightingDate", finalDate);
          if (finalTime) {
            formData.append("sightingTime", finalTime);
          }
          formData.append("timezone", finalTimezone || "UTC");
        }

        return fetch("/api/sightings/create", {
          method: "POST",
          body: formData,
        });
      });

      const responses = await Promise.all(promises);
      const successCount = responses.filter(r => r.ok).length;

      if (successCount === images.length) {
        toast.success(`${successCount} sighting${successCount > 1 ? 's' : ''} posted successfully!`);
        // Redirect back to hunt if huntId exists, otherwise go to feed
        if (huntId) {
          router.push(`/hunts/${huntId}/album`);
        } else {
          router.push("/feed");
        }
      } else if (successCount > 0) {
        toast.success(`${successCount} of ${images.length} sightings posted successfully`);
        if (huntId) {
          router.push(`/hunts/${huntId}/album`);
        } else {
          router.push("/feed");
        }
      } else {
        toast.error("Failed to post sightings");
      }
    } catch (error) {
      console.error("Error posting sighting:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
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
            onClick={() => router.back()}
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
            Cancel
          </button>

          <h1 className="text-3xl font-bold text-white">Share Your Sighting</h1>
          <p className="text-gray-400 mt-2">
            {huntId
              ? "Post a real-time sighting to your hunt's shared album"
              : "Share your aurora photos with the community"}
          </p>
        </div>

        {/* Hunt Badge */}
        {huntId && (
          <div className="bg-gradient-to-r from-green-400/20 to-blue-500/20 border border-green-400/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <svg
                className="w-6 h-6 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <div>
                <div className="text-white font-medium">Posting to Hunt Album</div>
                <div className="text-sm text-gray-300">
                  This sighting will be shared with hunt participants
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sighting Type - Moved to Top */}
          <div>
            <label className="block text-white font-medium mb-3">
              Sighting Type *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSightingType("realtime")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  sightingType === "realtime"
                    ? "border-aurora-green bg-aurora-green/10 text-white"
                    : "border-gray-600 bg-white/5 text-gray-400 hover:border-gray-500"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="font-semibold">Real-time</div>
                  <div className="text-xs text-center">
                    Happening now
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSightingType("past")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  sightingType === "past"
                    ? "border-aurora-blue bg-aurora-blue/10 text-white"
                    : "border-gray-600 bg-white/5 text-gray-400 hover:border-gray-500"
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <div className="font-semibold">Past Sighting</div>
                  <div className="text-xs text-center">
                    From a previous occasion
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Real-time: Camera only on mobile */}
          {sightingType === "realtime" && !isMobile && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <div className="flex gap-3">
                <svg
                  className="w-6 h-6 text-yellow-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div className="text-sm text-gray-300">
                  <p className="font-semibold text-white mb-1">
                    Mobile Device Required
                  </p>
                  <p>
                    Real-time sightings can only be posted from mobile devices using the camera.
                    Please switch to "Past Sighting" to upload from desktop.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Image Upload - Conditional based on type */}
          {(sightingType === "past" || (sightingType === "realtime" && isMobile)) && (
            <div>
              <label className="block text-white font-medium mb-2">
                Photos {images.length > 0 && `(${images.length}/${sightingType === "past" ? 10 : 5})`}
              </label>

              {images.length < (sightingType === "past" ? 10 : 5) && (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-aurora-green bg-aurora-green/10"
                      : "border-gray-600 hover:border-gray-500"
                  }`}
                >
                  <input
                    {...getInputProps()}
                    accept="image/*"
                    capture={sightingType === "realtime" ? "environment" : undefined}
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
                  {isDragActive ? (
                    <p className="text-aurora-green">Drop your photos here</p>
                  ) : (
                    <>
                      <p className="text-gray-300 mb-2">
                        {sightingType === "realtime"
                          ? "Tap to take a photo"
                          : "Drag & drop photos here, or click to select"}
                      </p>
                      <p className="text-sm text-gray-500">
                        Up to {sightingType === "past" ? 10 : 5} images (JPEG, PNG, WebP)
                      </p>
                    </>
                  )}
                </div>
              )}

            {/* Image Previews with Metadata */}
            {images.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {images.map((img, index) => (
                  <div key={index} className="space-y-2">
                    <div className="relative group">
                      <img
                        src={img.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {img.latitude && img.longitude && (
                          <div className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                            GPS ✓
                          </div>
                        )}
                        {img.captureDate && (
                          <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                            <span>📅 {format(img.captureDate, "dd MMM HH:mm")}</span>
                            {img.timezone && (
                              <span className="text-blue-100">🌍</span>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>

                    {/* Per-photo Editable Metadata */}
                    <div className="space-y-3 bg-white/5 p-3 rounded-lg">
                      {/* Caption */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Caption</label>
                        <textarea
                          value={img.caption || ""}
                          onChange={(e) => updateImageData(index, "caption", e.target.value)}
                          placeholder="Describe this photo..."
                          className="w-full bg-white/10 border border-gray-600 rounded px-2 py-1.5 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-aurora-green resize-none"
                          rows={2}
                          maxLength={500}
                        />
                      </div>

                      {/* Location Search */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          📍 Location {img.latitude && img.longitude && <span className="text-green-400">✓ Auto-detected</span>}
                        </label>
                        <LocationAutocomplete
                          value={img.locationSearchValue || (img.latitude && img.longitude ? `${img.latitude.toFixed(4)}, ${img.longitude.toFixed(4)}` : "")}
                          onChange={async (loc, lat, lng) => {
                            updateImageData(index, "locationSearchValue", loc);
                            if (lat && lng) {
                              updateImageData(index, "manualLatitude", lat);
                              updateImageData(index, "manualLongitude", lng);

                              // Auto-update timezone based on location
                              try {
                                const response = await fetch(`/api/timezone?lat=${lat}&lng=${lng}`);
                                const data = await response.json();
                                if (data.timezone) {
                                  updateImageData(index, "manualTimezone", data.timezone);
                                }
                              } catch (error) {
                                console.warn("Failed to fetch timezone for location:", error);
                              }
                            }
                          }}
                          placeholder="Search for location..."
                          className="w-full bg-white/10 border border-gray-600 rounded px-2 py-1.5 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-aurora-green"
                        />
                      </div>

                      {/* Date and Time */}
                      {sightingType === "past" && (
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            📅 Date & Time {img.captureDate && <span className="text-blue-400">✓ Auto-detected</span>}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="date"
                              value={img.manualDate || (img.captureDate ? getDateString(img.captureDate, img.manualTimezone || img.timezone) : "")}
                              onChange={(e) => updateImageData(index, "manualDate", e.target.value)}
                              max={new Date().toISOString().split('T')[0]}
                              className="w-full bg-white/10 border border-gray-600 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-aurora-blue"
                            />
                            <input
                              type="time"
                              value={img.manualTime || (img.captureDate ? getTimeString(img.captureDate, img.manualTimezone || img.timezone) : "")}
                              onChange={(e) => updateImageData(index, "manualTime", e.target.value)}
                              className="w-full bg-white/10 border border-gray-600 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-aurora-blue"
                            />
                          </div>
                        </div>
                      )}

                      {/* Timezone */}
                      {sightingType === "past" && (
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            🌍 Timezone {img.timezone && <span className="text-blue-300">✓ Auto-detected</span>}
                          </label>
                          <TimezoneSelect
                            value={img.manualTimezone || img.timezone || "UTC"}
                            onChange={(tz) => updateImageData(index, "manualTimezone", tz)}
                            className="w-full bg-white/10 border border-gray-600 rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-aurora-blue"
                          />
                        </div>
                      )}

                      {/* GPS Coordinates Display */}
                      {(img.latitude || img.manualLatitude) && (
                        <div className="text-xs text-gray-400">
                          <span className="text-green-400">GPS:</span> {(img.latitude || parseFloat(img.manualLatitude!)).toFixed(6)}, {(img.longitude || parseFloat(img.manualLongitude!)).toFixed(6)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {extractingGPS && (
              <p className="text-sm text-aurora-blue mt-2">
                Extracting metadata (GPS, date/time, timezone) from images...
              </p>
            )}
            </div>
          )}

          {/* Info Box about Automatic Metadata Extraction */}
          {images.length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex gap-3">
                <svg
                  className="w-6 h-6 text-blue-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-sm text-gray-300">
                  <p className="font-semibold text-white mb-2">
                    Automatic Metadata Extraction
                  </p>
                  <p className="mb-2">
                    📍 Location (GPS coordinates) extracted from each photo automatically
                  </p>
                  <p className="mb-2">
                    📅 Date and time extracted from each photo's metadata
                  </p>
                  <p>
                    🌍 Timezone detected from GPS coordinates when available
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Default Caption - applies to all photos without individual captions */}
          {images.length > 0 && (
            <div>
              <label className="block text-white font-medium mb-2">
                Default Caption for All Photos (Optional)
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="This caption will be used for photos without individual captions..."
                className="w-full bg-white/5 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-aurora-blue resize-none"
                rows={3}
                maxLength={500}
              />
              <p className="text-sm text-gray-400 mt-1">
                {caption.length}/500 characters · Each photo can have its own caption above
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || images.length === 0}
              className="flex-1 bg-gradient-to-r from-green-400 to-blue-500 text-white py-3 rounded-lg font-medium hover:from-green-500 hover:to-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Posting..." : "Post Sighting"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
